import 'server-only';
import {randomUUID} from 'node:crypto';
import {transaction, experiencePool, ensureExperienceSchema} from '@/lib/experience/store';
import {sendBatch, sendMail} from './send';
import {campaignEmail, oneClickUnsubscribe} from './templates';

export type CampaignInput = {name: string; subject: string; preheader: string; body: string; ctaLabel?: string | null; ctaUrl?: string | null};

export async function listCampaigns() {
  await ensureExperienceSchema();
  return (await experiencePool().query('SELECT id,name,subject,status,recipients,delivered,failed,created_at,sent_at FROM marketing_campaigns ORDER BY created_at DESC LIMIT 50')).rows;
}

export async function getCampaign(id: string) {
  await ensureExperienceSchema();
  return (await experiencePool().query('SELECT * FROM marketing_campaigns WHERE id=$1', [id])).rows[0];
}

export async function saveCampaign(input: CampaignInput, createdBy: string, id?: string) {
  await ensureExperienceSchema();
  if (id) {
    const r = await experiencePool().query(
      "UPDATE marketing_campaigns SET name=$2,subject=$3,preheader=$4,body=$5,cta_label=$6,cta_url=$7 WHERE id=$1 AND status='DRAFT' RETURNING id",
      [id, input.name, input.subject, input.preheader, input.body, input.ctaLabel || null, input.ctaUrl || null]);
    if (!r.rowCount) throw new Error('CAMPAIGN_LOCKED');
    return id;
  }
  const newId = randomUUID();
  await experiencePool().query(
    'INSERT INTO marketing_campaigns(id,name,subject,preheader,body,cta_label,cta_url,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
    [newId, input.name, input.subject, input.preheader, input.body, input.ctaLabel || null, input.ctaUrl || null, createdBy]);
  return newId;
}

/** Sends one preview to a single address with a placeholder unsubscribe token. */
export async function sendTest(input: CampaignInput, to: string) {
  const mail = campaignEmail({...input, subject: `[Test] ${input.subject}`, token: 'preview-token-not-real'});
  await sendMail({to, ...mail, tags: {type: 'campaign-test'}});
}

/** Atomically claims a draft, then sends to every ACTIVE subscriber in batches of 100. */
export async function sendCampaign(id: string) {
  const campaign = await transaction(async client => {
    const c = (await client.query("UPDATE marketing_campaigns SET status='SENDING' WHERE id=$1 AND status='DRAFT' RETURNING *", [id])).rows[0];
    if (!c) throw new Error('CAMPAIGN_NOT_DRAFT');
    await client.query(
      "INSERT INTO marketing_campaign_recipients(campaign_id,subscriber_id) SELECT $1,id FROM marketing_subscribers WHERE status='ACTIVE' ON CONFLICT DO NOTHING", [id]);
    return c;
  });
  const recipients = (await experiencePool().query(
    'SELECT s.id,s.email,s.token FROM marketing_campaign_recipients r JOIN marketing_subscribers s ON s.id=r.subscriber_id WHERE r.campaign_id=$1 AND r.status=$2', [id, 'QUEUED'])).rows;

  let delivered = 0, failed = 0;
  try {
    for (let i = 0; i < recipients.length; i += 100) {
      const chunk = recipients.slice(i, i + 100);
      const ids = await sendBatch(
        chunk.map(r => ({
          to: r.email,
          ...campaignEmail({subject: campaign.subject, preheader: campaign.preheader, body: campaign.body, ctaLabel: campaign.cta_label, ctaUrl: campaign.cta_url, token: r.token}),
          unsubscribeUrl: oneClickUnsubscribe(r.token),
          tags: {type: 'campaign', campaign: id},
        })),
        `campaign-${id}`);
      for (const [n, r] of chunk.entries()) {
        const ok = Boolean(ids[n]);
        if (ok) delivered++; else failed++;
        await experiencePool().query("UPDATE marketing_campaign_recipients SET status=$3,provider_id=$4,sent_at=now() WHERE campaign_id=$1 AND subscriber_id=$2", [id, r.id, ok ? 'SENT' : 'FAILED', ids[n]]);
      }
      if (i + 100 < recipients.length) await new Promise(res => setTimeout(res, 600)); // stay under Resend's request-rate limit
    }
  } finally {
    await experiencePool().query("UPDATE marketing_campaigns SET status=$2,recipients=$3,delivered=$4,failed=$5,sent_at=now() WHERE id=$1",
      [id, failed && !delivered ? 'FAILED' : 'SENT', recipients.length, delivered, failed]);
  }
  return {recipients: recipients.length, delivered, failed};
}
