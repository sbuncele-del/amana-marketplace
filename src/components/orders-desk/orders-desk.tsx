"use client";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  age,
  isStale,
  MARKETS,
  MAX_ATTEMPTS,
  money,
  nextMoves,
  SELLER_VISIBLE,
  STATUS_LABEL,
  TABS,
  tabCounts,
  toMinor,
  type DeskStatus,
  type TabKey,
  type Who,
} from "@/lib/orders-desk/domain";
import type { DeskOrder } from "@/lib/orders-desk/store";

type Partner = { id: string; name: string };
type Event = { by: string; kind: string; from: string; to: string; note: string; at: string };
type Draft = { to: DeskStatus; note: string; fee: string; partnerId: string; tracking: string };

const chip: Record<DeskStatus, string> = {
  PENDING_CONFIRMATION: "bg-amber-50 text-amber-800 border-amber-200",
  NO_ANSWER: "bg-orange-50 text-orange-800 border-orange-200",
  CONFIRMED: "bg-blue-50 text-blue-800 border-blue-200",
  DISPATCHED: "bg-indigo-50 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-green-50 text-green-800 border-green-200",
  RETURNED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};
const field = "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm";
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// One screen for two audiences. Staff get the whole call desk; a seller gets the orders confirmed for them, with the
// customer's delivery details and nothing about how the call went. The server decides which one this person is.
export function OrdersDesk({ embedded = false }: { embedded?: boolean }) {
  const [who, setWho] = useState<Who | null>(null);
  const [orders, setOrders] = useState<DeskOrder[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [markets, setMarkets] = useState<{ code: string; name: string }[]>([]);
  const [country, setCountry] = useState("ALL");
  const [tab, setTab] = useState<TabKey | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<Event[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/orders-desk", { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(j.error || "Orders could not be loaded.");
      setLoaded(true);
      return;
    }
    setWho(j.who);
    setOrders(j.orders);
    setPartners(j.partners);
    setMarkets(j.markets ?? []);
    setErr("");
    setLoaded(true);
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const tabs = useMemo(
    () => (who === "seller" ? TABS.filter((t) => t.statuses.every((s) => SELLER_VISIBLE.includes(s))) : TABS),
    [who],
  );
  const active: TabKey = tab ?? tabs[0]?.key ?? "to_call";
  const scoped = useMemo(() => (country === "ALL" ? orders : orders.filter((o) => o.market === country)), [orders, country]);
  const counts = useMemo(() => tabCounts(scoped), [scoped]);
  const stale = scoped.filter((o) => isStale(o.status, o.createdAt)).length;
  const partnerName = (id: string | null) => partners.find((p) => p.id === id)?.name ?? "";

  const rows = useMemo(() => {
    const t = tabs.find((x) => x.key === active);
    const needle = q.trim().toLowerCase();
    return scoped.filter(
      (o) =>
        (needle
          ? [o.reference, o.name, o.phone, o.governorate].some((v) => v.toLowerCase().includes(needle))
          : (t?.statuses as readonly string[] | undefined)?.includes(o.status)) ?? false,
    );
  }, [scoped, tabs, active, q]);

  async function openRow(o: DeskOrder) {
    setMsg("");
    setDraft(null);
    setHistory([]);
    if (open === o.reference) return setOpen(null);
    setOpen(o.reference);
    if (who === "staff") {
      const r = await fetch(`/api/orders-desk?history=${encodeURIComponent(o.reference)}`, { cache: "no-store" });
      if (r.ok) setHistory((await r.json()).history);
    }
  }
  function start(o: DeskOrder, to: DeskStatus) {
    setMsg("");
    setDraft({ to, note: "", fee: o.deliveryFeeMillimes != null ? String(o.deliveryFeeMillimes / (MARKETS[o.market as keyof typeof MARKETS]?.minor ?? 1000)) : "", partnerId: o.partnerId ?? "", tracking: o.trackingNumber ?? "" });
  }
  async function send(o: DeskOrder, d: Draft) {
    setBusy(true);
    setMsg("");
    const fee = d.fee.trim() === "" ? undefined : toMinor(o.market, Number(d.fee.replace(",", ".")));
    const r = await fetch("/api/orders-desk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: o.reference,
        expectedFrom: o.status,
        to: d.to,
        note: d.note || undefined,
        deliveryFeeMillimes: Number.isFinite(fee) ? fee : undefined,
        partnerId: d.partnerId || undefined,
        trackingNumber: d.tracking || undefined,
      }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setMsg(j.error || "That didn't save. Try again.");
      if (r.status === 409) load();
      return;
    }
    setDraft(null);
    setOpen(null);
    await load();
  }

  if (!loaded) return <p className="p-8 text-sm text-slate-500">Loading orders…</p>;
  if (!who) return <p className="m-8 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">{err}</p>;

  return (
    <div className={embedded ? "text-slate-900" : "mx-auto max-w-7xl px-4 pb-16 pt-24 text-slate-900"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {!embedded && <h1 className="text-xl font-semibold">{who === "staff" ? "Orders" : "Your orders"}</h1>}
          <p className="mt-1 text-sm text-slate-500">
            {who === "staff"
              ? `${counts.to_call} to call${stale ? ` · ${stale} waiting more than 2 hours` : ""} · ${counts.no_answer} no answer · ${counts.confirmed} confirmed, not yet sent`
              : `${counts.confirmed} to send · ${counts.dispatched} on the way`}
          </p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, name or phone" className={`${field} max-w-xs`} aria-label="Search orders" />
      </div>

      {who === "staff" && markets.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Country">
          {[{ code: "ALL", name: "All countries" }, ...markets].map((m) => {
            const n = m.code === "ALL" ? orders.length : orders.filter((o) => o.market === m.code).length;
            return (
              <button key={m.code} onClick={() => { setCountry(m.code); setOpen(null); }} aria-pressed={country === m.code} className={`rounded-md border px-3 py-1.5 text-sm ${country === m.code ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white hover:bg-slate-100"}`}>
                {m.name} <span className="opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      )}
      <div role="tablist" className="mt-5 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={!q && t.key === active}
            onClick={() => { setTab(t.key); setQ(""); setOpen(null); }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${!q && t.key === active ? "border-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{counts[t.key]}</span>
          </button>
        ))}
      </div>
      {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Order</th>
              {markets.length > 1 && <th className="px-3 py-2">Country</th>}
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2 text-right">To collect</th>
              {who === "staff" ? <th className="px-3 py-2">Calls</th> : <th className="px-3 py-2">Tracking</th>}
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">{q ? "No orders match that search." : "Nothing here."}</td></tr>
            )}
            {rows.map((o) => {
              const late = isStale(o.status, o.createdAt);
              const total = o.subtotalMillimes + (o.deliveryFeeMillimes ?? 0);
              const moves = nextMoves(who, o.status);
              return (
                <Fragment key={o.reference}>
                  <tr onClick={() => openRow(o)} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{o.reference}</div>
                      <div className={`text-xs ${late ? "font-semibold text-red-700" : "text-slate-500"}`}>{age(o.createdAt)} ago{late ? " · not called" : ""}</div>
                    </td>
                    {markets.length > 1 && <td className="px-3 py-2.5 text-xs text-slate-600">{MARKETS[o.market as keyof typeof MARKETS]?.name ?? o.market}</td>}
                    <td className="px-3 py-2.5">
                      <div>{o.name}</div>
                      <a href={`tel:${o.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-blue-700 underline">{o.phone}</a>
                      <div className="text-xs text-slate-500">{o.governorate}{o.delegation ? ` · ${o.delegation}` : ""}</div>
                    </td>
                    <td className="max-w-[220px] px-3 py-2.5 text-slate-700">
                      {o.items.slice(0, 2).map((i) => `${i.quantity}× ${i.title}`).join(", ")}
                      {o.items.length > 2 ? ` +${o.items.length - 2} more` : ""}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {money(o.market, total)}
                      {o.deliveryFeeMillimes == null && <div className="text-xs text-slate-400">fee not set</div>}
                    </td>
                    {who === "staff" ? (
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {o.callAttempts ? (
                          <>
                            <span className={o.callAttempts >= MAX_ATTEMPTS && o.status === "NO_ANSWER" ? "font-semibold text-red-700" : ""}>{o.callAttempts} call{o.callAttempts > 1 ? "s" : ""}</span>
                            <div>{o.lastCallBy} · {o.lastCallAt ? when(o.lastCallAt) : ""}</div>
                          </>
                        ) : "Not called"}
                      </td>
                    ) : (
                      <td className="px-3 py-2.5 text-xs text-slate-600">{o.trackingNumber || "—"}</td>
                    )}
                    <td className="px-3 py-2.5"><span className={`rounded-full border px-2 py-0.5 text-xs ${chip[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                  </tr>
                  {open === o.reference && (
                    <tr className="border-t border-slate-100 bg-slate-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-6 md:grid-cols-3">
                          <div>
                            <h3 className="text-xs font-semibold uppercase text-slate-500">Deliver to</h3>
                            <p className="mt-1 text-sm">{o.name}<br />{o.address}<br />{o.delegation}, {o.governorate}</p>
                            {o.customerNotes && <p className="mt-2 text-sm text-slate-600">Customer note: {o.customerNotes}</p>}
                            {o.partnerId && <p className="mt-2 text-sm text-slate-600">Seller: {partnerName(o.partnerId) || o.partnerId}</p>}
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold uppercase text-slate-500">Items</h3>
                            <ul className="mt-1 text-sm">
                              {o.items.map((i, n) => (<li key={n} className="flex justify-between gap-4"><span>{i.quantity}× {i.title}</span><span className="tabular-nums">{money(o.market, i.quantity * i.unitMillimes)}</span></li>))}
                              <li className="flex justify-between gap-4 text-slate-500"><span>Delivery</span><span className="tabular-nums">{o.deliveryFeeMillimes != null ? money(o.market, o.deliveryFeeMillimes) : "not set"}</span></li>
                              <li className="mt-1 flex justify-between gap-4 border-t pt-1 font-semibold"><span>To collect</span><span className="tabular-nums">{money(o.market, total)}</span></li>
                            </ul>
                          </div>
                          {who === "staff" && (
                            <div>
                              <h3 className="text-xs font-semibold uppercase text-slate-500">Call log</h3>
                              {history.length === 0 ? <p className="mt-1 text-sm text-slate-500">No calls logged yet.</p> : (
                                <ul className="mt-1 space-y-1.5 text-sm">
                                  {history.map((h, n) => (<li key={n}><span className="text-slate-500">{when(h.at)} · {h.by}</span><br />{STATUS_LABEL[h.to as DeskStatus] ?? h.to}{h.note ? ` — ${h.note}` : ""}</li>))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>

                        {moves.length > 0 && (
                          <div className="mt-4 border-t border-slate-200 pt-4">
                            <div className="flex flex-wrap gap-2">
                              {moves.map((to) => (
                                <button key={to} onClick={() => start(o, to)} className={`rounded-md border px-3 py-1.5 text-sm ${draft?.to === to ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white hover:bg-slate-100"}`}>
                                  {actionLabel(o.status, to)}
                                </button>
                              ))}
                            </div>
                            {draft && (
                              <form onSubmit={(e) => { e.preventDefault(); send(o, draft); }} className="mt-3 grid max-w-2xl gap-3 sm:grid-cols-2">
                                {draft.to === "CONFIRMED" && (
                                  <label className="text-sm">Delivery fee agreed ({MARKETS[o.market as keyof typeof MARKETS]?.currency ?? "TND"})
                                    <input className={field} inputMode="decimal" required value={draft.fee} onChange={(e) => setDraft({ ...draft, fee: e.target.value })} />
                                  </label>
                                )}
                                {who === "staff" && (draft.to === "CONFIRMED" || draft.to === "DISPATCHED") && (
                                  <label className="text-sm">Who delivers this?
                                    <select className={field} value={draft.partnerId} onChange={(e) => setDraft({ ...draft, partnerId: e.target.value })}>
                                      <option value="">Choose…</option>
                                      {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                  </label>
                                )}
                                {draft.to === "DISPATCHED" && (
                                  <label className="text-sm">Tracking number (optional)
                                    <input className={field} value={draft.tracking} onChange={(e) => setDraft({ ...draft, tracking: e.target.value })} />
                                  </label>
                                )}
                                <label className={`text-sm ${draft.to === "CONFIRMED" ? "sm:col-span-2" : ""}`}>{draft.to === "CANCELLED" ? "Reason (required)" : "Note (optional)"}
                                  <input className={field} maxLength={500} required={draft.to === "CANCELLED"} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
                                </label>
                                <div className="flex items-center gap-3 sm:col-span-2">
                                  <button disabled={busy} className="rounded-md bg-slate-900 px-4 py-1.5 text-sm text-white disabled:opacity-50">{busy ? "Saving…" : `Save · ${STATUS_LABEL[draft.to]}`}</button>
                                  {msg && <span className="text-sm text-red-700" role="alert">{msg}</span>}
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function actionLabel(from: DeskStatus, to: DeskStatus) {
  if (to === "NO_ANSWER") return from === "NO_ANSWER" ? "Still no answer" : "No answer";
  if (to === "CONFIRMED") return from === "CONFIRMED" ? "Change fee or seller" : "Customer confirmed";
  if (to === "DISPATCHED") return "Mark as sent";
  if (to === "DELIVERED") return "Delivered";
  if (to === "RETURNED") return "Returned";
  return "Cancel order";
}
