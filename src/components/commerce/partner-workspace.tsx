"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
type Data = {
  applications: { id: string; name: string; status: string }[];
  markets: { code: string; name: string }[];
  offers: {
    id: string;
    title: string;
    supplier_sku: string;
    market_code: string;
    stock_status: string;
    quantity: number | null;
    version: number;
  }[];
  shipments: {
    id: string;
    order_id: string;
    status: string;
    version: number;
    lines: { offerId: string; quantity: number }[];
    delivery_address: Record<string, string>;
  }[];
};
const field = "rounded border p-2 text-sm";
function form(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget));
}
export function PartnerWorkspace() {
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    const r = await fetch("/api/commerce/partner", { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setData(d);
  }
  useEffect(() => {
    void refresh().catch(() => setMessage("Unable to load your workspace."));
  }, []);
  async function send(body: unknown) {
    setBusy(true);
    try {
      const r = await fetch("/api/commerce/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setMessage("Saved.");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm underline">
          Plentovo store
        </Link>
        <h1 className="my-5 text-3xl font-bold">Partner workspace</h1>
        <p className="text-slate-600">
          Manage your assigned stock and fulfilment. Applications require
          Plentovo verification before access is granted.
        </p>
        <p role="status" aria-live="polite" className="my-4">
          {message}
        </p>
        {data && (
          <>
            {data.applications.map((p) => (
              <p key={p.id} className="my-4 rounded border bg-white p-4">
                {p.name} · {p.status}
              </p>
            ))}
            {!data.applications.length && (
              <form
                className="my-6 grid gap-4 rounded border bg-white p-6"
                onSubmit={(e) => {
                  const v = form(e);
                  void send({
                    action: "apply",
                    application: {
                      name: v.name,
                      website: v.website,
                      kind: v.kind,
                      markets: [v.market],
                      note: v.note,
                    },
                  });
                }}
              >
                <h2 className="text-xl font-bold">
                  Apply to partner with Plentovo
                </h2>
                <label>
                  Business name <input required name="name" className={field} />
                </label>
                <label>
                  Business website{" "}
                  <input required type="url" name="website" className={field} />
                </label>
                <label>
                  Partnership{" "}
                  <select name="kind" className={field}>
                    <option value="FULFILMENT">Fulfilment partner</option>
                    <option value="SELLER">Seller</option>
                  </select>
                </label>
                <label>
                  Market{" "}
                  <select name="market" className={field}>
                    {data.markets.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Business and fulfilment details{" "}
                  <textarea name="note" maxLength={2000} className={field} />
                </label>
                <button
                  disabled={busy}
                  className="rounded bg-red-600 p-3 text-white disabled:opacity-50"
                >
                  Submit application
                </button>
              </form>
            )}
            <h2 className="mt-8 text-xl font-bold">Assigned inventory</h2>
            {!data.offers.length && <p className="my-3">No offers assigned.</p>}
            {data.offers.map((o) => (
              <form
                key={o.id}
                className="my-4 flex flex-wrap items-end gap-4 rounded border bg-white p-4"
                onSubmit={(e) => {
                  const v = form(e);
                  void send({
                    action: "inventory",
                    offerId: o.id,
                    version: o.version,
                    status: v.status,
                    quantity: v.quantity === "" ? null : Number(v.quantity),
                    observedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 3600000).toISOString(),
                  });
                }}
              >
                <div className="grow">
                  <h3 className="font-semibold">{o.title}</h3>
                  <p className="text-sm">
                    {o.supplier_sku} · {o.market_code}
                  </p>
                </div>
                <label className="text-sm">
                  Stock{" "}
                  <select
                    name="status"
                    defaultValue={o.stock_status}
                    className={field}
                  >
                    <option>UNKNOWN</option>
                    <option>AVAILABLE</option>
                    <option>UNAVAILABLE</option>
                  </select>
                </label>
                <label className="text-sm">
                  Quantity{" "}
                  <input
                    type="number"
                    min={0}
                    name="quantity"
                    defaultValue={o.quantity ?? ""}
                    className={field}
                  />
                </label>
                <button disabled={busy} className="underline">
                  Confirm stock for one hour
                </button>
              </form>
            ))}
            <h2 className="mt-8 text-xl font-bold">Fulfilment assignments</h2>
            {!data.shipments.length && <p className="my-3">No assignments.</p>}
            {data.shipments.map((s) => (
              <article key={s.id} className="my-4 rounded border bg-white p-5">
                <h3 className="font-semibold">
                  Order {s.order_id} · {s.status}
                </h3>
                <p className="my-3 text-sm">
                  {Object.values(s.delivery_address).join(" · ")}
                </p>
                {s.lines.map((l) => (
                  <p className="text-sm" key={l.offerId}>
                    {l.offerId} · Quantity {l.quantity}
                  </p>
                ))}
                {!["DELIVERED", "REJECTED"].includes(s.status) && (
                  <form
                    className="mt-4 flex flex-wrap gap-3"
                    onSubmit={(e) => {
                      const v = form(e);
                      void send({
                        action: "shipment",
                        id: s.id,
                        version: s.version,
                        status: v.status,
                        trackingNumber: v.trackingNumber || undefined,
                      });
                    }}
                  >
                    <label>
                      Status{" "}
                      <select name="status" className={field}>
                        {(s.status === "ASSIGNED"
                          ? ["ACCEPTED", "REJECTED"]
                          : s.status === "ACCEPTED"
                            ? ["DISPATCHED"]
                            : ["DELIVERED"]
                        ).map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tracking{" "}
                      <input
                        name="trackingNumber"
                        className={field}
                        required={s.status === "ACCEPTED"}
                      />
                    </label>
                    <button disabled={busy} className="underline">
                      Update assignment
                    </button>
                  </form>
                )}
              </article>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
