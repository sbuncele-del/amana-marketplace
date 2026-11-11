"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/commerce/domain";
import { MailActivity } from "./mail-activity";
import type { Market, Grant } from "@/lib/commerce/domain";
type Partner = {
  id: string;
  name: string;
  website: string;
  kind: string;
  status: string;
  version: number;
  markets: string[];
};
type Offer = {
  id: string;
  title: string;
  partner_id: string;
  supplier_sku: string;
  currency: string;
  price_minor: string;
  stock_status: string;
  expires_at: string;
  approved: boolean;
  version: number;
};
type Shipment = {
  id: string;
  order_id: string;
  partner_id: string;
  status: string;
  tracking_number: string | null;
  version: number;
};
type Data = {
  actor: { name: string; admin: boolean; grants: Grant[] };
  markets: Market[];
  partners: Partner[];
  offers: Offer[];
  shipments: Shipment[];
  staff: {
    email: string;
    market_code: string | null;
    role: string;
    active: boolean;
  }[];
  syncRuns: {
    id: string;
    status: string;
    processed: number;
    error_code: string | null;
    created_at: string;
  }[];
  page: number;
};
const field =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm";
const chipClass: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-800 border-green-200",
  APPROVED: "bg-green-50 text-green-800 border-green-200",
  AVAILABLE: "bg-green-50 text-green-800 border-green-200",
  DELIVERED: "bg-green-50 text-green-800 border-green-200",
  PREPARATION: "bg-amber-50 text-amber-800 border-amber-200",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  STALE: "bg-amber-50 text-amber-800 border-amber-200",
  ASSIGNED: "bg-blue-50 text-blue-800 border-blue-200",
  ACCEPTED: "bg-blue-50 text-blue-800 border-blue-200",
  DISPATCHED: "bg-indigo-50 text-indigo-800 border-indigo-200",
  SUSPENDED: "bg-red-50 text-red-800 border-red-200",
  REJECTED: "bg-red-50 text-red-800 border-red-200",
  UNAVAILABLE: "bg-red-50 text-red-800 border-red-200",
};
function Chip({ s }: { s: string }) {
  const label = s.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  return (
    <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${chipClass[s] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {label}
    </span>
  );
}
const button =
  "rounded-lg bg-[#DA292B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
function values(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget));
}
export function CommerceConsole({
  initialMarket = "ZA",
  initialTab = "Markets",
}: {
  initialMarket?: string;
  initialTab?: "Markets" | "Partners" | "Fulfilment";
}) {
  const [market, setMarket] = useState(initialMarket);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<string>(initialTab);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/commerce/command?market=${market}&page=${page}`,
        { cache: "no-store" },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setData(d);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to load commerce.");
    }
  }, [market, page]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function send(body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/commerce/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setMessage("Saved.");
      await refresh();
      return true;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-slate-600">Markets, partners, catalogue offers and shipments.</p>
          <label className="text-xs font-medium text-slate-600">
            Country
            <select
              className="mt-1 block rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
              value={market}
              onChange={(e) => {
                setMarket(e.target.value);
                setPage(1);
              }}
            >
              {(data?.markets || [{ code: "ZA", name: "South Africa" }]).map(
                (m) => (
                  <option key={m.code} value={m.code}>
                    {m.name}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Online ordering is closed in markets that are still in preparation.
        </p>
        <div role="status" aria-live="polite" className="my-3 text-sm">
          {message}
        </div>
        {data && (
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Active markets", `${data.markets.filter((m) => m.status === "ACTIVE").length} of ${data.markets.length}`],
              ["Partners to review", String(data.partners.filter((p) => p.status === "PENDING").length)],
              ["Offers needing attention", String(data.offers.filter((o) => !o.approved || o.stock_status !== "AVAILABLE" || new Date(o.expires_at) < new Date()).length)],
              ["Open shipments", String(data.shipments.filter((x) => !["DELIVERED", "REJECTED"].includes(x.status)).length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}
        <nav aria-label="Commerce sections" className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
          {[
            ["Markets", data?.markets.length],
            ["Partners", data?.partners.length],
            ["Catalogue", data?.offers.length],
            ["Fulfilment", data?.shipments.length],
            ["Access", undefined],
            ...(data?.actor.admin ? [["Email", undefined] as const] : []),
          ].map(([t, n]) => (
            <button
              key={t as string}
              onClick={() => setTab(t as string)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${t === tab ? "border-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {t}
              {typeof n === "number" && <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{n}</span>}
            </button>
          ))}
        </nav>
        {!data ? (
          <p>Sign in with assigned commerce access to load this workspace.</p>
        ) : (
          <>
            {tab === "Markets" && (
              <section className="space-y-5">
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        {["Country", "Status", "Currency", "Language", "Ready for launch", ""].map((h) => (
                          <th key={h} className="px-3 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.markets.map((m) => (
                        <tr key={m.code} className="border-t border-slate-100">
                          <td className="px-3 py-2.5 font-medium">{m.name} <span className="text-xs text-slate-400">{m.code}</span></td>
                          <td className="px-3 py-2.5"><Chip s={m.status} /></td>
                          <td className="px-3 py-2.5">{m.currency}</td>
                          <td className="px-3 py-2.5">{m.locale}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(m.readiness).map(([k, v]) => (
                                <span key={k} className={`rounded px-1.5 py-0.5 text-xs ${v ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-500"}`}>
                                  {v ? "✓" : "○"} {k}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {data.actor.admin && (
                              <button
                                disabled={busy}
                                className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                                onClick={() => {
                                  const status = m.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                                  void send({
                                    action: "market",
                                    market: {
                                      code: m.code,
                                      name: m.name,
                                      currency: m.currency,
                                      locale: m.locale,
                                      languages: m.languages,
                                      readiness: m.readiness,
                                      version: m.version,
                                      status,
                                    },
                                  });
                                }}
                              >
                                {m.status === "ACTIVE" ? "Suspend" : "Activate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.actor.admin && (
                  <details className="rounded-lg border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-5 py-3 text-sm font-semibold">Add or edit a market</summary>
                  <form
                    className="grid gap-4 p-5 md:grid-cols-3"
                    onSubmit={(e) => {
                      const v = values(e);
                      const old = data.markets.find((m) => m.code === v.code);
                      void send({
                        action: "market",
                        market: {
                          code: v.code,
                          name: v.name,
                          currency: v.currency,
                          locale: v.locale,
                          languages: String(v.languages)
                            .split(",")
                            .map((s) => s.trim()),
                          status: v.status,
                          readiness: {
                            payments: v.payments === "on",
                            fulfilment: v.fulfilment === "on",
                            returns: v.returns === "on",
                            localisation: v.localisation === "on",
                          },
                          version: old?.version || 1,
                        },
                      });
                    }}
                  >
                    {[
                      ["code", "Country code, e.g. ZA"],
                      ["name", "Country name"],
                      ["currency", "Currency code, e.g. ZAR"],
                      ["locale", "Default language, e.g. en-ZA"],
                      ["languages", "Supported languages, comma separated"],
                    ].map(([k, label]) => (
                      <label key={k} className="text-sm">
                        {label}
                        <input required name={k} className={field} />
                      </label>
                    ))}
                    <label className="text-sm">
                      State
                      <select name="status" className={field}>
                        <option>PREPARATION</option>
                        <option>ACTIVE</option>
                        <option>SUSPENDED</option>
                      </select>
                    </label>
                    <fieldset className="flex flex-wrap gap-5 md:col-span-3">
                      <legend className="mb-2 text-sm font-semibold">
                        Record completed readiness checks
                      </legend>
                      {[
                        "payments",
                        "fulfilment",
                        "returns",
                        "localisation",
                      ].map((k) => (
                        <label key={k} className="text-sm">
                          <input type="checkbox" name={k} /> {k}
                        </label>
                      ))}
                    </fieldset>
                    <button disabled={busy} className={button}>
                      Save market
                    </button>
                  </form>
                  </details>
                )}
              </section>
            )}
            {tab === "Partners" && (
              <section className="space-y-4">
                {!data.partners.length && (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    No applications yet. Sellers and delivery partners apply from their own workspace.
                  </p>
                )}
                {data.partners.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-lg border bg-white p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-semibold">{p.name}</h2>
                      <Chip s={p.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {p.kind === "FULFILMENT" ? "Delivery / fulfilment partner" : "Seller"} · {p.markets.join(", ") || "No markets yet"}
                    </p>
                    <p className="text-xs text-slate-500">{p.website}</p>
                    {data.actor.admin && (
                      <form
                        className="mt-4 flex flex-wrap gap-3"
                        onSubmit={(e) => {
                          const v = values(e);
                          void send({
                            action: "partner-review",
                            id: p.id,
                            version: p.version,
                            status: v.status,
                            note: v.note,
                          });
                        }}
                      >
                        <label className="text-sm">
                          Decision
                          <select name="status" className={field}>
                            <option>APPROVED</option>
                            <option>SUSPENDED</option>
                            <option>REJECTED</option>
                          </select>
                        </label>
                        <label className="grow text-sm">
                          Verification record
                          <input
                            required
                            minLength={10}
                            name="note"
                            className={field}
                            placeholder="Document checks and agreed fulfilment arrangements"
                          />
                        </label>
                        <button disabled={busy} className={button}>
                          Save review
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </section>
            )}
            {tab === "Catalogue" && (
              <section>
                <h2 className="mb-4 text-base font-bold">Supplier offers</h2>
                <p className="mb-4 text-sm text-slate-600">
                  The existing storefront catalogue remains connected to its
                  current feed. Offers here form the new controlled catalogue;
                  publication approval does not yet replace the storefront feed.
                </p>
                <div className="overflow-auto rounded-lg border bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        {["Product", "SKU", "Retail", "Stock", "Approval"].map(
                          (h) => (
                            <th key={h} className="px-3 py-2">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.offers.map((o) => (
                        <tr key={o.id} className="border-t">
                          <td className="px-3 py-2.5">{o.title}</td>
                          <td className="px-3 py-2.5">{o.supplier_sku}</td>
                          <td className="px-3 py-2.5">
                            {formatMoney(o.price_minor, o.currency)}
                          </td>
                          <td className="px-3 py-2.5">
                            <Chip s={new Date(o.expires_at) < new Date() ? "STALE" : o.stock_status} />
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              disabled={busy}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                              onClick={() =>
                                void send({
                                  action: "offer-review",
                                  id: o.id,
                                  version: o.version,
                                  approved: !o.approved,
                                })
                              }
                            >
                              {o.approved ? "Withdraw" : "Approve"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="my-4 flex gap-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    disabled={data.offers.length < 50}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
                <details className="rounded-lg border bg-white p-5">
                  <summary className="cursor-pointer font-semibold">
                    Add a supplier offer
                  </summary>
                  <form
                    className="mt-4 grid gap-3 md:grid-cols-3"
                    onSubmit={(e) => {
                      const v = values(e);
                      void send({
                        action: "offer",
                        offer: {
                          partnerId: v.partnerId,
                          market,
                          productId: v.productId,
                          variantId: v.variantId,
                          title: v.title,
                          categoryId: v.categoryId || null,
                          currency: data.markets.find((m) => m.code === market)
                            ?.currency,
                          costMinor: Number(v.costMinor),
                          priceMinor: Number(v.priceMinor),
                          supplierSku: v.supplierSku,
                          stockStatus: v.stockStatus,
                          quantity:
                            v.quantity === "" ? null : Number(v.quantity),
                          observedAt: new Date().toISOString(),
                          expiresAt: new Date(
                            Date.now() + 3600000,
                          ).toISOString(),
                          deliveryMinDays: Number(v.deliveryMinDays),
                          deliveryMaxDays: Number(v.deliveryMaxDays),
                        },
                      });
                    }}
                  >
                    <label className="text-sm">
                      Partner
                      <select name="partnerId" className={field} required>
                        {data.partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {[
                      ["productId", "Product reference"],
                      ["variantId", "Variant reference"],
                      ["title", "Product title"],
                      ["supplierSku", "Supplier SKU"],
                      ["categoryId", "Google category ID"],
                      ["costMinor", "Cost in minor units"],
                      ["priceMinor", "Retail price in minor units"],
                      ["quantity", "Quantity, leave empty if unknown"],
                      ["deliveryMinDays", "Minimum delivery days"],
                      ["deliveryMaxDays", "Maximum delivery days"],
                    ].map(([k, label]) => (
                      <label key={k} className="text-sm">
                        {label}
                        <input
                          name={k}
                          className={field}
                          required={!["quantity", "categoryId"].includes(k)}
                        />
                      </label>
                    ))}
                    <label className="text-sm">
                      Stock
                      <select name="stockStatus" className={field}>
                        <option>UNKNOWN</option>
                        <option>AVAILABLE</option>
                        <option>UNAVAILABLE</option>
                      </select>
                    </label>
                    <button disabled={busy} className={button}>
                      Submit for review
                    </button>
                  </form>
                </details>
                <h3 className="mt-6 font-bold">Recent supplier refreshes</h3>
                {data.syncRuns.length ? (
                  data.syncRuns.map((r) => (
                    <p key={r.id} className="mt-2 text-sm">
                      {r.status} · {r.processed} offers ·{" "}
                      {r.error_code || "No reported error"}
                    </p>
                  ))
                ) : (
                  <p className="mt-2 text-sm">
                    No refresh runs recorded in this layer yet.
                  </p>
                )}
              </section>
            )}
            {tab === "Fulfilment" && (
              <section>
                <h2 className="text-base font-bold">Partner assignments</h2>
                <p className="my-3 text-sm text-slate-600">
                  Only confirmed paid orders can be allocated. Each parcel has
                  its own accountable partner and tracking record.
                </p>
                {data.shipments.map((s) => (
                  <article
                    className="my-3 rounded-lg border bg-white p-4"
                    key={s.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{s.order_id}</p>
                      <Chip s={s.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {s.tracking_number ? `Tracking ${s.tracking_number}` : "Awaiting dispatch"}
                    </p>
                  </article>
                ))}
                {!data.shipments.length && (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">No paid orders have been given to a partner yet.</p>
                )}
                <details className="mt-6 rounded-lg border bg-white p-5">
                  <summary className="cursor-pointer font-semibold">
                    Allocate a verified paid item
                  </summary>
                  <form
                    className="mt-4 grid gap-3 md:grid-cols-3"
                    onSubmit={(e) => {
                      const v = values(e);
                      void send({
                        action: "shipment",
                        requestKey: crypto.randomUUID(),
                        orderId: v.orderId,
                        partnerId: v.partnerId,
                        market,
                        lines: [
                          { offerId: v.offerId, quantity: Number(v.quantity) },
                        ],
                        address: {
                          name: v.name,
                          street: v.street,
                          city: v.city,
                          postcode: v.postcode,
                          phone: v.phone,
                        },
                      });
                    }}
                  >
                    <p className="text-sm text-slate-600 md:col-span-3">
                      Requires a verified payment and the order’s saved offer
                      references. Enquiry-only orders are blocked.
                    </p>
                    <label className="text-sm">
                      Partner
                      <select name="partnerId" className={field}>
                        {data.partners
                          .filter((p) => p.status === "APPROVED")
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    {[
                      ["orderId", "Paid order ID"],
                      ["offerId", "Saved offer ID"],
                      ["quantity", "Quantity"],
                      ["name", "Recipient name"],
                      ["street", "Street address"],
                      ["city", "City"],
                      ["postcode", "Postal code"],
                      ["phone", "Recipient phone"],
                    ].map(([k, label]) => (
                      <label className="text-sm" key={k}>
                        {label}
                        <input required name={k} className={field} />
                      </label>
                    ))}
                    <button disabled={busy} className={button}>
                      Allocate item
                    </button>
                  </form>
                </details>
              </section>
            )}
            {tab === "Email" && data.actor.admin && <MailActivity />}
            {tab === "Access" && (
              <section>
                {data.actor.admin ? (
                  <>
                    <h2 className="text-base font-bold">
                      Team and partner access
                    </h2>
                    <form
                      className="my-5 grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-3"
                      onSubmit={(e) => {
                        const v = values(e);
                        void send({
                          action: "staff",
                          email: v.email,
                          market: v.scope === "GLOBAL" ? null : market,
                          role: v.role,
                          active: v.active === "on",
                        });
                      }}
                    >
                      <label className="text-sm">
                        Existing account email
                        <input
                          type="email"
                          required
                          name="email"
                          className={field}
                        />
                      </label>
                      <label className="text-sm">
                        Scope
                        <select name="scope" className={field}>
                          <option value="COUNTRY">Selected market</option>
                          <option value="GLOBAL">All markets</option>
                        </select>
                      </label>
                      <label className="text-sm">
                        Role
                        <select name="role" className={field}>
                          {[
                            "MANAGER",
                            "CATALOGUE",
                            "MARKETING",
                            "FULFILMENT",
                          ].map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm">
                        <input name="active" type="checkbox" defaultChecked />{" "}
                        Active
                      </label>
                      <button disabled={busy} className={button}>
                        Save staff access
                      </button>
                    </form>
                    {data.staff.map((s) => (
                      <p key={s.email + s.market_code} className="my-2 text-sm">
                        {s.email} · {s.market_code || "All markets"} · {s.role}{" "}
                        · {s.active ? "Active" : "Revoked"}
                      </p>
                    ))}
                    <form
                      className="my-6 grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-3"
                      onSubmit={(e) => {
                        const v = values(e);
                        void send({
                          action: "partner-member",
                          id: v.id,
                          email: v.email,
                          active: v.active === "on",
                        });
                      }}
                    >
                      <label className="text-sm">
                        Partner
                        <select name="id" className={field}>
                          {data.partners.map((p) => (
                            <option value={p.id} key={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm">
                        Existing account email
                        <input
                          name="email"
                          type="email"
                          required
                          className={field}
                        />
                      </label>
                      <label className="text-sm">
                        <input type="checkbox" name="active" defaultChecked />{" "}
                        Active
                      </label>
                      <button disabled={busy} className={button}>
                        Save partner access
                      </button>
                    </form>
                  </>
                ) : (
                  <p>An administrator manages staff and partner access.</p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
