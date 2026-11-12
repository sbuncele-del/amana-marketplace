"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CommerceConsole } from "@/components/commerce/console";

type Market = { code: string; name: string; currency: string };
type Rate = { service: string; conditions: string; amount: string };
type Profile = { method: string; coverage: string; leadTime: string; terms: string; rates: Rate[] };
type Partner = { id: string; name: string; kind: string; status: string; version: number; profile: Profile | null };
const emptyProfile: Profile = { method: "", coverage: "", leadTime: "", terms: "", rates: [] };
const endpoint = "/api/commerce/back-office-partners";
const field = "mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2";
const primary = "rounded-lg bg-[#d4252d] px-4 py-2 font-semibold text-white disabled:opacity-50";
const secondary = "rounded-lg border border-stone-300 bg-white px-4 py-2 font-semibold";

export function PartnerDirectory({ markets, admin }: { markets: Market[]; admin: boolean }) {
  const [code, setCode] = useState(markets[0]?.code);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [adding, setAdding] = useState(false);
  const [editVersion, setEditVersion] = useState(0);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [directoryRevision, setDirectoryRevision] = useState(0);
  const [consoleRevision, setConsoleRevision] = useState(0);
  const market = markets.find(item => item.code === code);
  const selected = partners.find(item => item.id === selectedId);

  useEffect(() => {
    if (!code) return;
    const controller = new AbortController();
    fetch(`${endpoint}?market=${code}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) setPartners(data);
      })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [code, directoryRevision]);

  async function submit(body: object) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, market: code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function addPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const result = await submit({ action: "create", ...Object.fromEntries(values) });
    if (!result) return;
    setSelectedId(result.id);
    setAdding(false);
    setLoading(true);
    setDirectoryRevision(value => value + 1);
    setConsoleRevision(value => value + 1);
    setNotice("Partner added. Review its approval below.");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !draft || busy) return;
    const result = await submit({ action: "save", id: selected.id, version: editVersion, profile: draft });
    if (!result) return;
    setPartners(previous => previous.map(item => item.id === selected.id
      ? { ...item, version: result.version, profile: draft } : item));
    setDraft(null);
    setNotice("Delivery and rates saved.");
  }

  if (!market) return <p>No commerce markets are assigned to your account.</p>;
  return <>
    <div className="my-5 flex flex-wrap items-end justify-between gap-3">
      <label className="text-sm font-semibold">Market
        <select className={field} value={code} disabled={busy} onChange={event => {
          setLoading(true);
          setPartners([]);
          setSelectedId("");
          setDraft(null);
          setAdding(false);
          setNotice("");
          setError("");
          setCode(event.target.value);
        }}>{markets.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select>
      </label>
      {admin && <button className={primary} disabled={busy} onClick={() => { setAdding(true); setDraft(null); setNotice(""); setError(""); }}>Add partner</button>}
    </div>
    {notice && <p className="my-3 text-sm text-green-800" role="status">{notice}</p>}
    {error && <p className="my-3 text-sm text-red-800" role="alert">{error}</p>}
    {adding && <form onSubmit={addPartner} className="mb-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
      <label>Partner name<input className={field} name="name" required maxLength={150} autoFocus /></label>
      <label>Partner type<select className={field} name="kind"><option value="SELLER">Supplier / seller</option><option value="FULFILMENT">Delivery / fulfilment</option></select></label>
      <label className="sm:col-span-2">Website (optional)<input className={field} name="website" type="url" maxLength={500} placeholder="https://" /></label>
      <div className="flex gap-2"><button className={primary} disabled={busy}>Save partner</button><button className={secondary} type="button" disabled={busy} onClick={() => setAdding(false)}>Cancel</button></div>
    </form>}
    <section className="mb-7 grid gap-4 xl:grid-cols-2">
      <div className="min-w-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <p className="border-b border-stone-200 px-4 py-3 font-semibold">Partner directory</p>
        {loading && <p className="p-4 text-sm" role="status">Loading partners…</p>}
        {!loading && !error && !partners.length && <p className="p-4 text-sm text-stone-600">No partners in this market.</p>}
        {partners.map(item => <button key={item.id} aria-pressed={selectedId === item.id} disabled={busy} className="block w-full border-b border-stone-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-stone-50 aria-pressed:bg-red-50" onClick={() => {
          setSelectedId(item.id); setDraft(null); setAdding(false); setNotice(""); setError("");
        }}>
          <strong className="block">{item.name}</strong>
          <span className="text-stone-600">{item.kind === "SELLER" ? "Supplier / seller" : "Delivery / fulfilment"} · {item.status.toLowerCase()}</span>
        </button>)}
      </div>
      {selected && <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 text-sm">
        <h3 className="text-base font-bold">{selected.name}</h3>
        {draft ? <form onSubmit={saveProfile} className="mt-3 space-y-3">
          <label className="block">How they deliver<input className={field} placeholder="e.g. Supplier dispatches via courier" required maxLength={150} value={draft.method} onChange={event => setDraft({ ...draft, method: event.target.value })} /></label>
          <label className="block">Coverage<input className={field} maxLength={500} value={draft.coverage} onChange={event => setDraft({ ...draft, coverage: event.target.value })} /></label>
          <label className="block">Lead time<input className={field} maxLength={150} value={draft.leadTime} onChange={event => setDraft({ ...draft, leadTime: event.target.value })} /></label>
          <label className="block">Delivery terms<textarea className={field} maxLength={2000} value={draft.terms} onChange={event => setDraft({ ...draft, terms: event.target.value })} /></label>
          <p className="font-semibold">Rate card · {market.currency}</p>
          {draft.rates.map((rate, index) => <fieldset key={index} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-2">
            <legend className="px-1">Rate {index + 1}</legend>
            {(["service", "amount", "conditions"] as const).map(key => <label key={key}>{key === "service" ? "Service or zone" : key === "amount" ? "Amount" : "Conditions (weight, region or limits)"}
              <input className={field} value={rate[key]} required={key !== "conditions"} maxLength={key === "service" ? 150 : key === "conditions" ? 300 : 12}
                inputMode={key === "amount" ? "decimal" : undefined} pattern={key === "amount" ? "[0-9]{1,8}([.][0-9]{1,3})?" : undefined}
                onChange={event => setDraft({ ...draft, rates: draft.rates.map((row, position) => position === index ? { ...row, [key]: event.target.value } : row) })} />
            </label>)}
            <button type="button" className="self-end justify-self-start text-red-700 underline" disabled={busy} onClick={() => setDraft({ ...draft, rates: draft.rates.filter((_, position) => position !== index) })}>Remove rate {index + 1}</button>
          </fieldset>)}
          <div className="flex flex-wrap gap-2">
            <button className={secondary} type="button" disabled={busy || draft.rates.length >= 30} onClick={() => setDraft({ ...draft, rates: [...draft.rates, { service: "", conditions: "", amount: "" }] })}>Add rate</button>
            <button className={primary} disabled={busy}>Save delivery and rates</button>
            <button className={secondary} type="button" disabled={busy} onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form> : <>
          {selected.profile ? <>
            <dl className="my-3 space-y-2">
              {([["How they deliver", selected.profile.method], ["Coverage", selected.profile.coverage], ["Lead time", selected.profile.leadTime], ["Delivery terms", selected.profile.terms]]).filter(([, value]) => value).map(([label, value]) =>
                <div key={label}><dt className="font-semibold">{label}</dt><dd className="whitespace-pre-wrap break-words text-stone-700">{value}</dd></div>)}
            </dl>
            <p className="font-semibold">Rate card · {market.currency}</p>
            {selected.profile.rates.length ? <ul className="mb-3 divide-y divide-stone-200">{selected.profile.rates.map((rate, index) => <li className="flex justify-between gap-3 py-2" key={index}><span>{rate.service}{rate.conditions && <small>{rate.conditions}</small>}</span><strong className="shrink-0">{market.currency} {rate.amount}</strong></li>)}</ul> : <p className="my-2 text-stone-600">No rates on file.</p>}
          </> : <p className="my-3 text-stone-600">No delivery method or rates on file.</p>}
          {admin && <button className={secondary} onClick={() => { setEditVersion(selected.version); setDraft(selected.profile ?? emptyProfile); setNotice(""); setError(""); }}>{selected.profile ? "Edit delivery and rates" : "Add delivery and rates"}</button>}
        </>}
      </div>}
    </section>
    <h3 className="mb-3 font-bold">Partner approvals</h3>
    <CommerceConsole key={`${code}-${consoleRevision}`} initialTab="Partners" initialMarket={code} fixedMarket
      onSaved={() => setDirectoryRevision(value => value + 1)} />
  </>;
}
