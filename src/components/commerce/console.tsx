"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/commerce/domain";
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
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const button =
  "rounded-lg bg-[#DA292B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
function values(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget));
}
export function CommerceConsole({
  initialMarket = "ZA",
}: {
  initialMarket?: string;
}) {
  const [market, setMarket] = useState(initialMarket);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Data | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("Markets");
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
    <main className="min-h-screen bg-slate-50 p-5 md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">
              Plentovo · Commerce
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Markets & fulfilment
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              One brand. Local availability. Accountable partners.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4"><Link href="/operations/store" className="text-sm underline">Store management</Link>
            <Link href="/operations" className="text-sm underline">
              Customer care
            </Link>
            <Link href="/partner" className="text-sm underline">
              Partner workspace
            </Link>
            <label className="text-sm">
              Market
              <select
                className={field}
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
        </header>
        <p className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Browsing-only launch: online ordering remains closed. Markets in
          preparation are not offered to customers.
        </p>
        <div role="status" aria-live="polite" className="my-3 text-sm">
          {message}
        </div>
        <nav
          aria-label="Commerce sections"
          className="mb-6 flex flex-wrap gap-2"
        >
          {["Markets", "Partners", "Catalogue", "Fulfilment", "Access"].map(
            (t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-2 text-sm ${t === tab ? "bg-slate-900 text-white" : "border bg-white"}`}
              >
                {t}
              </button>
            ),
          )}
        </nav>
        {!data ? (
          <p>Sign in with assigned commerce access to load this workspace.</p>
        ) : (
          <>
            {tab === "Markets" && (
              <section className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {data.markets.map((m) => (
                    <article
                      key={m.code}
                      className="rounded-xl border bg-white p-5"
                    >
                      <h2 className="text-lg font-bold">{m.name}</h2>
                      <p className="my-2 text-sm">
                        {m.status} · {m.currency} · {m.locale}
                      </p>
                      <p className="text-xs text-slate-500">
                        {Object.entries(m.readiness)
                          .filter(([, v]) => !v)
                          .map(([k]) => k)
                          .join(", ") || "Readiness checks recorded"}
                        {Object.values(m.readiness).some((v) => !v)
                          ? " pending"
                          : ""}
                      </p>
                      {data.actor.admin && (
                        <button
                          disabled={busy}
                          className="mt-4 text-sm underline"
                          onClick={() => {
                            const status =
                              m.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
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
                          {m.status === "ACTIVE"
                            ? "Suspend market"
                            : "Activate market"}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
                {data.actor.admin && (
                  <form
                    className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-3"
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
                    <h2 className="font-bold md:col-span-3">
                      Configure a market
                    </h2>
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
                )}
              </section>
            )}
            {tab === "Partners" && (
              <section className="space-y-4">
                {!data.partners.length && (
                  <p>
                    No applications for this market yet. Partners apply through
                    their workspace.
                  </p>
                )}
                {data.partners.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-xl border bg-white p-5"
                  >
                    <h2 className="text-lg font-bold">{p.name}</h2>
                    <p className="my-2 text-sm">
                      {p.kind} · {p.status} · {p.markets.join(", ")}
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
                <h2 className="mb-4 text-xl font-bold">Supplier offers</h2>
                <p className="mb-4 text-sm text-slate-600">
                  The existing storefront catalogue remains connected to its
                  current feed. Offers here form the new controlled catalogue;
                  publication approval does not yet replace the storefront feed.
                </p>
                <div className="overflow-auto rounded-xl border bg-white">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        {["Product", "SKU", "Retail", "Stock", "Approval"].map(
                          (h) => (
                            <th key={h} className="p-4">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.offers.map((o) => (
                        <tr key={o.id} className="border-t">
                          <td className="p-4">{o.title}</td>
                          <td className="p-4">{o.supplier_sku}</td>
                          <td className="p-4">
                            {formatMoney(o.price_minor, o.currency)}
                          </td>
                          <td className="p-4">
                            {new Date(o.expires_at) < new Date()
                              ? "STALE"
                              : o.stock_status}
                          </td>
                          <td className="p-4">
                            <button
                              disabled={busy}
                              className="underline"
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
                <details className="rounded-xl border bg-white p-5">
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
                <h2 className="text-xl font-bold">Partner assignments</h2>
                <p className="my-3 text-sm text-slate-600">
                  Only confirmed paid orders can be allocated. Each parcel has
                  its own accountable partner and tracking record.
                </p>
                {data.shipments.map((s) => (
                  <article
                    className="my-3 rounded-xl border bg-white p-4"
                    key={s.id}
                  >
                    <p className="font-semibold">{s.order_id}</p>
                    <p className="text-sm">
                      {s.status} · {s.tracking_number || "Awaiting dispatch"}
                    </p>
                  </article>
                ))}
                {!data.shipments.length && (
                  <p className="mt-5">No paid orders allocated yet.</p>
                )}
                <details className="mt-6 rounded-xl border bg-white p-5">
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
            {tab === "Access" && (
              <section>
                {data.actor.admin ? (
                  <>
                    <h2 className="text-xl font-bold">
                      Team and partner access
                    </h2>
                    <form
                      className="my-5 grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-3"
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
                      className="my-6 grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-3"
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
    </main>
  );
}
