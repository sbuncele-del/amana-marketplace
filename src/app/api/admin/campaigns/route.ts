import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {auth} from '@/lib/auth';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
import {mailConfigured, resend} from '@/lib/mail/send';
import {subscriberStats} from '@/lib/mail/subscribers';
import {getCampaign, listCampaigns, saveCampaign, sendCampaign, sendTest} from '@/lib/mail/campaigns';

export const maxDuration = 300;

async function admin() {
  const session = await auth();
  return session?.user?.id && session.user.role === 'ADMIN' ? session.user : null;
}

async function health() {
  const checks = {apiKey: Boolean(process.env.RESEND_API_KEY), fromEmail: process.env.FROM_EMAIL || null, webhookSecret: Boolean(process.env.RESEND_WEBHOOK_SECRET), supportInbox: Boolean(process.env.SUPPORT_NOTIFY_EMAIL)};
  let domains: {name: string; status: string}[] = [];
  let error: string | null = null;
  if (checks.apiKey) {
    const r = await resend().domains.list().catch(e => ({data: null, error: {message: String(e)}}));
    if (r.error || !r.data) error = r.error?.message || 'Could not read Resend domains';
    else domains = r.data.data.map(d => ({name: d.name, status: d.status}));
  }
  return {...checks, domains, error};
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({error: 'Unauthorized'}, {status: 403});
  const [campaigns, subscribers, mail] = await Promise.all([listCampaigns(), subscriberStats(), health()]);
  return NextResponse.json({campaigns, subscribers, health: mail}, {headers: {'Cache-Control': 'no-store'}});
}

const draft = z.object({
  name: z.string().trim().min(2).max(120),
  subject: z.string().trim().min(3).max(150),
  preheader: z.string().trim().max(200).default(''),
  body: z.string().trim().min(10).max(10000),
  ctaLabel: z.string().trim().max(40).optional().or(z.literal('')),
  ctaUrl: z.string().trim().url().max(500).refine(u => u.startsWith('https://'), 'Link must start with https://').optional().or(z.literal('')),
}).refine(d => !d.ctaLabel === !d.ctaUrl, {message: 'Give the button both a label and a link, or neither.'});

const action = z.discriminatedUnion('action', [
  z.object({action: z.literal('save'), id: z.string().uuid().optional(), campaign: draft}),
  z.object({action: z.literal('test'), campaign: draft, to: z.string().trim().email()}),
  z.object({action: z.literal('send'), id: z.string().uuid()}),
]);

export async function POST(request: NextRequest) {
  const user = await admin();
  if (!user) return NextResponse.json({error: 'Unauthorized'}, {status: 403});
  if (!sameRequestOrigin(request)) return NextResponse.json({error: 'Bad origin'}, {status: 403});
  const parsed = action.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({error: parsed.error.issues[0]?.message || 'Invalid request'}, {status: 400});
  if (!mailConfigured()) return NextResponse.json({error: 'Set RESEND_API_KEY and FROM_EMAIL in Vercel first.'}, {status: 503});
  const a = parsed.data;
  try {
    if (a.action === 'save') return NextResponse.json({id: await saveCampaign(a.campaign, user.id!, a.id)});
    if (a.action === 'test') {
      await sendTest(a.campaign, a.to);
      return NextResponse.json({ok: true});
    }
    const c = await getCampaign(a.id);
    if (!c) return NextResponse.json({error: 'Campaign not found'}, {status: 404});
    return NextResponse.json(await sendCampaign(a.id));
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'CAMPAIGN_LOCKED' || code === 'CAMPAIGN_NOT_DRAFT') return NextResponse.json({error: 'This campaign has already been sent.'}, {status: 409});
    console.error('[campaigns]', e);
    return NextResponse.json({error: code || 'Something went wrong'}, {status: 500});
  }
}
