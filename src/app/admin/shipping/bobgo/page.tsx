"use client";
import { useCallback, useEffect, useState } from "react";

type State = {
  deliveryURL: string; secretConfigured: boolean; apiKeyConfigured: boolean;
  topics: string[]; subscriptions: { id: number; topic: string; status: string }[];
  providerError: string | null;
  events: { id: string; topic: string; tracking_reference: string | null; outcome: string | null; received_at: string }[];
};
export default function BobGoSettings() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/delivery/bobgo-webhooks", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load Bob Go settings.");
    setState(data);
  }, []);
  useEffect(() => { refresh().catch(e => setError(e.message)); }, [refresh]);
  async function connect() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/delivery/bobgo-webhooks", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not connect Bob Go.");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not connect Bob Go."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-4xl space-y-6 p-6">
    <h1 className="text-2xl font-bold">Bob Go delivery updates</h1>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!state && !error && <p>Loading delivery connection…</p>}
    {state && <>
      <p>API key {state.apiKeyConfigured ? "configured" : "missing"}. Webhook secret {state.secretConfigured ? "configured" : "missing"}.</p>
      <p className="break-all">Delivery URL — {state.deliveryURL}</p>
      {!state.secretConfigured && <p>Create the webhook secret in Bob Go, save it as BOBGO_WEBHOOK_SECRET in Vercel Production, and redeploy. Then connect the subscriptions here.</p>}
      {state.providerError && <p role="alert">{state.providerError}</p>}
      <button className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50" disabled={busy || !state.secretConfigured || !state.apiKeyConfigured} onClick={connect}>
        {busy ? "Connecting…" : "Connect webhook subscriptions"}
      </button>
      <ul className="space-y-2">{state.topics.map(topic => <li key={topic}>{topic} — {state.subscriptions.find(s => s.topic === topic && s.status === "active") ? "Active" : "Awaiting connection"}</li>)}</ul>
      <h2 className="text-xl font-semibold">Recent delivery updates</h2>
      <p>Match shipments by recording the Bob Go tracking reference on the Plentovo shipment or order. Unmatched updates are retained and checked again hourly.</p>
      {!state.events.length && <p>No events received yet.</p>}
      <ul className="space-y-3">{state.events.map(event => <li className="rounded border p-3" key={event.id}>
        <p>{event.topic} · {event.tracking_reference || "Order update"}</p>
        <p>{event.outcome || "Queued"} · {new Date(event.received_at).toLocaleString()}</p>
      </li>)}</ul>
    </>}
  </main>;
}
