"use client";

import { useCallback, useEffect, useState } from "react";

type Campaign = { id: string; name: string; subject: string; status: string; recipients: number; delivered: number; failed: number; created_at: string; sent_at: string | null };
type Data = {
  campaigns: Campaign[];
  subscribers: Record<string, number>;
  health: { apiKey: boolean; fromEmail: string | null; webhookSecret: boolean; supportInbox: boolean; domains: { name: string; status: string }[]; error: string | null };
};

const empty = { name: "", subject: "", preheader: "", body: "", ctaLabel: "", ctaUrl: "" };
const field = "mt-1 block w-full rounded-lg border px-3 py-2 text-sm";

export default function CampaignsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [form, setForm] = useState(empty);
  const [id, setId] = useState<string | undefined>();
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/campaigns");
    if (r.ok) setData(await r.json());
    else setNote({ ok: false, text: "You need an admin account to view this page." });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function post(body: object) {
    setBusy(true); setNote(null);
    try {
      const r = await fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      return j;
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Something went wrong" });
      return null;
    } finally { setBusy(false); }
  }

  const campaign = () => ({ ...form, ctaLabel: form.ctaLabel || undefined, ctaUrl: form.ctaUrl || undefined });
  const save = async () => { const j = await post({ action: "save", id, campaign: campaign() }); if (j) { setId(j.id); setNote({ ok: true, text: "Draft saved." }); load(); } return j?.id as string | undefined; };
  const test = async () => { if (await post({ action: "test", campaign: campaign(), to: testTo })) setNote({ ok: true, text: `Test sent to ${testTo}.` }); };
  const send = async () => {
    const active = data?.subscribers.ACTIVE ?? 0;
    if (!confirm(`Send "${form.subject}" to ${active} confirmed subscriber${active === 1 ? "" : "s"}? This cannot be undone.`)) return;
    const cid = await save(); if (!cid) return;
    const j = await post({ action: "send", id: cid });
    if (j) { setNote({ ok: true, text: `Sent to ${j.delivered} of ${j.recipients} subscribers${j.failed ? ` (${j.failed} failed)` : ""}.` }); setForm(empty); setId(undefined); load(); }
  };

  const h = data?.health;
  const verified = h?.domains.some((d) => d.status === "verified");
  const ready = Boolean(h?.apiKey && h.fromEmail && verified);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Email &amp; campaigns</h1>
      <p className="mt-2 text-sm text-gray-500">Write to people who confirmed they want to hear from Plentovo.</p>

      {note && <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${note.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{note.text}</p>}

      {data && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-bold">Audience</h2>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {[["Confirmed", "ACTIVE"], ["Awaiting confirmation", "PENDING"], ["Unsubscribed", "UNSUBSCRIBED"], ["Bounced / complained", null]].map(([label, key]) => (
                <div key={label as string} className="contents">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-right font-semibold">{key ? data.subscribers[key as string] ?? 0 : (data.subscribers.BOUNCED ?? 0) + (data.subscribers.COMPLAINED ?? 0)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-bold">Sending setup {ready ? "✓" : ""}</h2>
            <ul className="mt-3 space-y-1 text-sm">
              <li>{h?.apiKey ? "✅" : "❌"} Resend API key</li>
              <li>{h?.fromEmail ? "✅" : "❌"} Sender address {h?.fromEmail && <span className="text-gray-500">({h.fromEmail})</span>}</li>
              <li>{verified ? "✅" : "❌"} Domain verified in Resend {h?.domains.map((d) => <span key={d.name} className="text-gray-500">({d.name}: {d.status}) </span>)}{h?.error && <span className="text-red-600">{h.error}</span>}</li>
              <li>{h?.webhookSecret ? "✅" : "⚠️"} Bounce &amp; complaint webhook</li>
              <li>{h?.supportInbox ? "✅" : "⚠️"} Customer care alert inbox</li>
            </ul>
          </div>
        </section>
      )}

      <section className="mt-8 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-bold">New campaign</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Internal name<input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="October new arrivals" /></label>
          <label className="text-sm font-semibold">Subject line<input className={field} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={150} /></label>
          <label className="text-sm font-semibold sm:col-span-2">Preview text <span className="font-normal text-gray-500">(shown beside the subject in the inbox)</span><input className={field} value={form.preheader} onChange={(e) => setForm({ ...form, preheader: e.target.value })} maxLength={200} /></label>
          <label className="text-sm font-semibold sm:col-span-2">Message <span className="font-normal text-gray-500">(leave a blank line between paragraphs)</span><textarea className={`${field} min-h-48`} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
          <label className="text-sm font-semibold">Button text (optional)<input className={field} value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} maxLength={40} placeholder="Shop now" /></label>
          <label className="text-sm font-semibold">Button link (https)<input className={field} value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="https://plentovo.com/browse" /></label>
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold">Send a test to<input type="email" className={field} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" /></label>
          <button disabled={busy || !testTo} onClick={test} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50">Send test</button>
          <button disabled={busy} onClick={save} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-50">Save draft</button>
          <button disabled={busy || !ready} onClick={send} className="ml-auto rounded-lg bg-[#DA292B] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">Send to all confirmed</button>
        </div>
        {!ready && <p className="mt-2 text-xs text-gray-500">Sending unlocks once the API key, sender address and a verified domain are all in place.</p>}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">History</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-gray-500"><tr><th className="py-2">Campaign</th><th>Status</th><th className="text-right">Sent</th><th className="text-right">Failed</th></tr></thead>
          <tbody>
            {data?.campaigns.map((c) => (
              <tr key={c.id} className="border-t"><td className="py-2">{c.name}<div className="text-xs text-gray-500">{c.subject}</div></td><td>{c.status}</td><td className="text-right">{c.delivered}/{c.recipients}</td><td className="text-right">{c.failed}</td></tr>
            ))}
            {data && !data.campaigns.length && <tr><td colSpan={4} className="py-6 text-center text-gray-500">No campaigns yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </main>
  );
}
