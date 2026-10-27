"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CmsProduct, StoreConfig, CmsKind } from "@/lib/cms/domain";
import { themes } from "@/lib/cms/domain";
type ProductRow = {
  qualityFlags?: string[];
  slug: string;
  name: string;
  source: string;
  status: string;
  draft: boolean;
  price: number;
};
type Release = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};
type Data = {
  sourceUrl?: string | null;
  qualityFlags?: string[];
  draft?: CmsProduct | StoreConfig;
  version?: number;
  products?: ProductRow[];
  total?: number;
  permissions: { product: boolean; storefront: boolean; publish: boolean };
  departments: { slug: string; name: string }[];
  missions?: { slug: string; title: string }[];
  history?: {
    id: string;
    action: string;
    actor_id: string;
    created_at: string;
  }[];
  releases?: Release[];
};
const field =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm";
const button =
  "rounded-lg bg-[#DA292B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40";
function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {multiline ? (
        <textarea
          className={field}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className={field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function StoreConsole({
  initialKind = "product",
  readOnly = false,
}: {
  initialKind?: CmsKind;
  readOnly?: boolean;
}) {
  const [kind, setKind] = useState<CmsKind>(initialKind),
    [key, setKey] = useState(initialKind === "storefront" ? "plentovo" : ""),
    [q, setQ] = useState(""),
    [reviewOnly, setReviewOnly] = useState(false),
    [page, setPage] = useState(1),
    [data, setData] = useState<Data>(),
    [draft, setDraft] = useState<CmsProduct | StoreConfig>(),
    [version, setVersion] = useState(0),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const requestId = useRef(0);
  const load = useCallback(
    async (
      k: CmsKind,
      id: string,
      query: string,
      p: number,
      review = false,
    ) => {
      const current = ++requestId.current;
      setBusy(true);
      try {
        const r = await fetch(
          `/api/cms?kind=${k}&${id ? "key=" + encodeURIComponent(id) : "q=" + encodeURIComponent(query) + "&page=" + p}${review ? "&review=1" : ""}`,
        );
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (current !== requestId.current) return;
        setData(d);
        setDraft(d.draft);
        setVersion(d.version || 0);
        setDirty(false);
      } catch (e) {
        if (current === requestId.current)
          setMessage(e instanceof Error ? e.message : "Unable to load.");
      } finally {
        if (current === requestId.current) setBusy(false);
      }
    },
    [],
  );
  const search = useRef("");
  search.current = q;
  useEffect(() => {
    void load(kind, key, search.current, page, reviewOnly);
  }, [kind, key, page, load, reviewOnly]); // Search submits explicitly to avoid refreshing an open edit.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function navigate(k: CmsKind, id = "") {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    setKind(k);
    setKey(id);
    setPage(1);
    setMessage("");
    setDraft(undefined);
    if (kind === k && key === id) void load(k, id, q, 1);
  }
  function edit(value: CmsProduct | StoreConfig) {
    setDraft(value);
    setDirty(true);
    setMessage("");
  }
  async function action(action: string, release?: string) {
    if (!draft) return;
    if (readOnly) {
      setMessage(
        "Preview deployment: saving and publishing are disabled to protect the live database.",
      );
      return;
    }
    if (action !== "save" && dirty) {
      setMessage("Save your draft before publishing or restoring.");
      return;
    }
    if (
      action !== "save" &&
      !confirm(
        action === "cancel"
          ? "Cancel this release? An earlier release may become active."
          : `Confirm ${action}. This changes what customers see at the selected time.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          kind,
          key: key || ("slug" in draft ? draft.slug : "plentovo"),
          version,
          payload: action === "save" ? draft : undefined,
          release,
          start: start ? new Date(start).toISOString() : null,
          end: end ? new Date(end).toISOString() : null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      const id = key || ("slug" in draft ? draft.slug : "plentovo");
      if (!key) setKey(id);
      await load(kind, id, q, page);
      setMessage(
        action === "save"
          ? "Draft saved. Customers still see the published version."
          : action === "cancel"
            ? "Release cancelled."
            : "Release recorded. Scheduled changes activate automatically.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  function add() {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    setKey("");
    setDraft({
      source: "manual",
      slug: "",
      name: "",
      description: "",
      details: "",
      images: [],
      category: data?.departments[0]?.slug || "home-living",
      collections: [data?.departments[0]?.slug || "home-living"],
      status: "active",
      sku: "",
      variants: [
        {
          id: "standard",
          title: "Standard",
          price: 0,
          stock: 0,
          weightGrams: 100,
        },
      ],
    });
    setVersion(0);
    setDirty(true);
    setMessage("New product · save a draft, then a manager publishes it.");
  }
  async function upload(file: File | undefined) {
    if (!file || !draft || readOnly) return;
    if (file.size > 3000000) {
      setMessage("Choose an image smaller than 3 MB.");
      return;
    }
    setBusy(true);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const r = await fetch("/api/cms/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if ("source" in draft)
        edit({ ...draft, images: [...draft.images.filter(Boolean), d.url] });
      else
        setMessage(
          "Uploaded image URL: " + d.url + " — paste it into the chosen slide.",
        );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  const product = draft && "source" in draft ? draft : undefined;
  const store = draft && "slides" in draft ? draft : undefined;
  return (
    <main className="min-h-screen bg-[#F7F6F3] text-[#191D23]">
      <header className="border-b bg-white px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/operations" className="text-sm text-red-700">
              ← Team console
            </Link>
            <h1 className="mt-2 text-2xl font-bold">
              Plentovo store management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Catalogue, campaigns and the storefront your customers see.
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border px-4 py-2 text-sm"
          >
            View store ↗
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-[200px_1fr]">
        <nav
          aria-label="Store management"
          className="flex gap-2 overflow-x-auto lg:flex-col"
        >
          {[
            ["product", "Products"],
            ["storefront", "Storefront & themes"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() =>
                navigate(k as CmsKind, k === "storefront" ? "plentovo" : "")
              }
              className={`whitespace-nowrap rounded-lg p-3 text-left text-sm font-semibold ${kind === k ? "bg-white shadow-sm text-red-700" : ""}`}
            >
              {label}
            </button>
          ))}
          <Link className="p-3 text-sm" href="/operations/commerce">
            Orders & fulfilment
          </Link>
          <Link className="p-3 text-sm" href="/admin/campaigns">
            Email campaigns
          </Link>
          <Link className="p-3 text-sm" href="/operations/commerce">
            Team access
          </Link>
        </nav>
        <div className="min-w-0">
          {readOnly && (
            <p className="mb-4 rounded-lg bg-amber-100 p-4 text-sm">
              Preview deployment · You can explore the editor. Saving, uploads
              and publishing are disabled because previews share the live
              database.
            </p>
          )}
          {message && (
            <p
              role="status"
              className="mb-4 rounded-lg border bg-white p-4 text-sm"
            >
              {message}
            </p>
          )}
          {!draft && kind === "product" && (
            <section className="rounded-xl border bg-white p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-xl font-bold">
                  Products{" "}
                  <span className="text-sm font-normal text-gray-500">
                    {data?.total?.toLocaleString()} items
                  </span>
                </h2>
                <button
                  className={button}
                  onClick={add}
                  disabled={busy || !data?.permissions.product}
                >
                  Add product
                </button>
              </div>
              <form
                className="my-5 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  void load(kind, "", q, 1, reviewOnly);
                }}
              >
                <input
                  aria-label="Search products"
                  placeholder="Search name or product handle"
                  className={field}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button className="rounded-lg border px-4" disabled={busy}>
                  Search
                </button>
              </form>
              <label className="mb-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={reviewOnly}
                  onChange={(e) => {
                    setReviewOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                Only products flagged for supplier-content review
              </label>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-gray-500">
                    <tr>
                      <th className="py-3">Product</th>
                      <th>Source</th>
                      <th>Live state</th>
                      <th>Draft</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.products?.map((p) => (
                      <tr key={p.slug} className="border-b">
                        <td className="py-4 pr-3">
                          <button
                            className="text-left font-semibold hover:text-red-700"
                            onClick={() => navigate("product", p.slug)}
                          >
                            {p.name}
                          </button>
                          {p.qualityFlags?.length ? (
                            <span className="mt-1 block text-xs text-amber-800">
                              Content review needed
                            </span>
                          ) : null}
                          <p className="mt-1 text-xs text-gray-500">
                            R{p.price.toFixed(2)}
                          </p>
                        </td>
                        <td>{p.source}</td>
                        <td>{p.status}</td>
                        <td>{p.draft ? "Saved" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  disabled={busy || page === 1}
                  onClick={() => setPage(page - 1)}
                  className="disabled:opacity-30"
                >
                  ← Previous
                </button>
                <span className="text-sm">Page {page}</span>
                <button
                  disabled={busy || page * 30 >= (data?.total || 0)}
                  onClick={() => setPage(page + 1)}
                  className="disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </section>
          )}
          {draft && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">
                  {product
                    ? product.name || "New product"
                    : "Storefront & campaign theme"}
                </h2>
                <span className="text-sm text-gray-500">
                  Draft version {version}
                  {dirty ? " · Unsaved changes" : ""}
                </span>
              </div>
              <section className="space-y-5 rounded-xl border bg-white p-5">
                <label className="block text-sm font-medium">
                  Upload an image
                  <input
                    className={field}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={(e) => void upload(e.target.files?.[0])}
                  />
                </label>
                {data?.qualityFlags?.length ? (
                  <aside className="rounded-lg bg-amber-50 p-4 text-sm">
                    <h3 className="font-semibold">Supplier content review</h3>
                    <ul className="mt-2 list-disc pl-5">
                      {data.qualityFlags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                    <p className="mt-2">
                      Preserve supplier wording and supporting evidence. Do not
                      invent claims, approvals or product specifications.
                    </p>
                  </aside>
                ) : null}
                {product && (
                  <>
                    <p className="rounded-lg bg-gray-50 p-3 text-sm">
                      {product.source === "supplier"
                        ? "Supplier prices and stock refresh automatically. These edits change presentation only."
                        : "Manually managed product. Your team owns its price and stock."}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Product name"
                        value={product.name}
                        onChange={(name) => edit({ ...product, name })}
                      />
                      <Field
                        label="Product handle (permanent after saving)"
                        value={product.slug}
                        onChange={(slug) => {
                          if (!key) edit({ ...product, slug });
                        }}
                      />
                      <label className="text-sm">
                        Primary department
                        <select
                          className={field}
                          value={product.category}
                          onChange={(e) =>
                            edit({
                              ...product,
                              category: e.target.value,
                              collections: [
                                ...new Set([
                                  ...product.collections,
                                  e.target.value,
                                ]),
                              ],
                            })
                          }
                        >
                          {data?.departments.map((d) => (
                            <option key={d.slug} value={d.slug}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm">
                        Publication state
                        <select
                          className={field}
                          value={product.status}
                          onChange={(e) =>
                            edit({
                              ...product,
                              status: e.target.value as "active" | "archived",
                            })
                          }
                        >
                          <option value="active">Active</option>
                          <option value="archived">
                            Archived (removed from the store when published)
                          </option>
                        </select>
                      </label>
                    </div>
                    <Field
                      label="Short description"
                      multiline
                      value={product.description}
                      onChange={(description) =>
                        edit({ ...product, description })
                      }
                    />
                    <Field
                      label="Details"
                      multiline
                      value={product.details}
                      onChange={(details) => edit({ ...product, details })}
                    />
                    <Field
                      label="Image URLs — one HTTPS URL or existing /brand/ path per line"
                      multiline
                      value={product.images.join("\n")}
                      onChange={(v) =>
                        edit({ ...product, images: v.split("\n") })
                      }
                    />
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold">
                        Departments
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {data?.departments.map((d) => (
                          <label key={d.slug} className="text-sm">
                            <input
                              type="checkbox"
                              checked={product.collections.includes(d.slug)}
                              onChange={(e) =>
                                edit({
                                  ...product,
                                  collections: e.target.checked
                                    ? [...product.collections, d.slug]
                                    : product.collections.filter(
                                        (c) => c !== d.slug,
                                      ),
                                })
                              }
                            />{" "}
                            {d.name}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    {product.source === "manual" && (
                      <>
                        <Field
                          label="SKU"
                          value={product.sku}
                          onChange={(sku) => edit({ ...product, sku })}
                        />
                        <h3 className="font-semibold">
                          Variants, price and stock
                        </h3>
                        {product.variants.map((v, i) => (
                          <div
                            key={i}
                            className="grid gap-3 rounded-lg border p-3 sm:grid-cols-3"
                          >
                            {(
                              [
                                "id",
                                "title",
                                "price",
                                "stock",
                                "weightGrams",
                              ] as const
                            ).map((k) => (
                              <Field
                                key={k}
                                label={
                                  k === "weightGrams"
                                    ? "Weight (grams)"
                                    : k === "price"
                                      ? "Price (ZAR)"
                                      : k
                                }
                                type={
                                  ["price", "stock", "weightGrams"].includes(k)
                                    ? "number"
                                    : "text"
                                }
                                value={String(v[k])}
                                onChange={(value) =>
                                  edit({
                                    ...product,
                                    variants: product.variants.map((row, n) =>
                                      n === i
                                        ? {
                                            ...row,
                                            [k]: [
                                              "price",
                                              "stock",
                                              "weightGrams",
                                            ].includes(k)
                                              ? Number(value)
                                              : value,
                                          }
                                        : row,
                                    ),
                                  })
                                }
                              />
                            ))}
                            <button
                              type="button"
                              disabled={product.variants.length === 1}
                              onClick={() =>
                                edit({
                                  ...product,
                                  variants: product.variants.filter(
                                    (_, n) => n !== i,
                                  ),
                                })
                              }
                              className="text-sm text-red-700 disabled:opacity-30"
                            >
                              Remove variant
                            </button>
                          </div>
                        ))}
                        <button
                          className="text-sm font-semibold text-red-700"
                          onClick={() =>
                            edit({
                              ...product,
                              variants: [
                                ...product.variants,
                                {
                                  id: `variant-${product.variants.length + 1}`,
                                  title: "New variant",
                                  price: 0,
                                  stock: 0,
                                  weightGrams: 100,
                                },
                              ],
                            })
                          }
                        >
                          + Add variant
                        </button>
                      </>
                    )}
                  </>
                )}
                {store && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Campaign name (internal)"
                        value={store.name}
                        onChange={(name) => edit({ ...store, name })}
                      />
                      <label className="text-sm">
                        Theme
                        <select
                          className={field}
                          value={store.theme}
                          onChange={(e) =>
                            edit({
                              ...store,
                              theme: e.target.value as StoreConfig["theme"],
                            })
                          }
                        >
                          {Object.keys(themes).map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <h3 className="font-bold">Slideshow</h3>
                    {store.slides.map((slide, i) => (
                      <fieldset
                        key={i}
                        className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
                      >
                        <legend className="px-1 text-sm font-semibold">
                          Slide {i + 1}
                        </legend>
                        {(slide.image.startsWith("/brand/") ||
                          slide.image.startsWith("https://")) && (
                          <Image
                            unoptimized
                            src={slide.image}
                            width={600}
                            height={200}
                            alt="Slide image preview"
                            className="h-32 w-full rounded-lg object-contain sm:col-span-2"
                          />
                        )}
                        {(
                          ["title", "text", "image", "href", "action"] as const
                        ).map((k) => (
                          <Field
                            key={k}
                            label={
                              k === "href"
                                ? "Destination within Plentovo"
                                : k === "image"
                                  ? "Image URL"
                                  : k
                            }
                            value={slide[k]}
                            onChange={(v) =>
                              edit({
                                ...store,
                                slides: store.slides.map((s, n) =>
                                  n === i ? { ...s, [k]: v } : s,
                                ),
                              })
                            }
                          />
                        ))}
                        <div className="flex gap-4 text-sm text-red-700">
                          <button
                            disabled={i === 0}
                            onClick={() => {
                              const slides = [...store.slides];
                              [slides[i - 1], slides[i]] = [
                                slides[i],
                                slides[i - 1],
                              ];
                              edit({ ...store, slides });
                            }}
                          >
                            Move up
                          </button>
                          <button
                            disabled={store.slides.length === 1}
                            onClick={() =>
                              edit({
                                ...store,
                                slides: store.slides.filter((_, n) => n !== i),
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </fieldset>
                    ))}
                    <button
                      className="text-sm font-semibold text-red-700"
                      disabled={store.slides.length >= 12}
                      onClick={() =>
                        edit({
                          ...store,
                          slides: [
                            ...store.slides,
                            {
                              title: "New collection",
                              text: "Find your next useful idea.",
                              image: store.slides[0].image,
                              href: "/collections",
                              action: "Explore the collection",
                            },
                          ],
                        })
                      }
                    >
                      + Add slide
                    </button>
                    <h3 className="font-bold">Homepage sections</h3>
                    {store.sectionOrder.map((id, i) => (
                      <div
                        key={id}
                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={!store.hiddenSections.includes(id)}
                            onChange={(e) =>
                              edit({
                                ...store,
                                hiddenSections: e.target.checked
                                  ? store.hiddenSections.filter((s) => s !== id)
                                  : [...store.hiddenSections, id],
                              })
                            }
                          />{" "}
                          {id}
                        </label>
                        <button
                          disabled={i === 0}
                          className="disabled:opacity-30"
                          onClick={() => {
                            const order = [...store.sectionOrder];
                            [order[i - 1], order[i]] = [order[i], order[i - 1]];
                            edit({ ...store, sectionOrder: order });
                          }}
                        >
                          Move up ↑
                        </button>
                      </div>
                    ))}
                    <fieldset>
                      <legend className="mb-2 font-semibold">
                        Shopping ideas
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {data?.missions?.map((m) => (
                          <label key={m.slug} className="text-sm">
                            <input
                              type="checkbox"
                              checked={store.missionSlugs.includes(m.slug)}
                              onChange={(e) =>
                                edit({
                                  ...store,
                                  missionSlugs: e.target.checked
                                    ? [...store.missionSlugs, m.slug]
                                    : store.missionSlugs.filter(
                                        (s) => s !== m.slug,
                                      ),
                                })
                              }
                            />{" "}
                            {m.title}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <Field
                      label="Featured products heading"
                      value={store.featuredTitle}
                      onChange={(featuredTitle) =>
                        edit({ ...store, featuredTitle })
                      }
                    />
                    <Field
                      label="Featured product handles — one per line (copy from product editor)"
                      multiline
                      value={store.featuredSlugs.join("\n")}
                      onChange={(v) =>
                        edit({
                          ...store,
                          featuredSlugs: v.split("\n").filter(Boolean),
                        })
                      }
                    />
                    <p className="text-sm text-gray-500">
                      Only available, published products appear in featured
                      picks. Empty sections stay hidden.
                    </p>
                    <Link
                      href="/operations/store/preview"
                      target="_blank"
                      className="inline-block text-sm font-semibold text-red-700 underline"
                    >
                      Preview saved storefront draft ↗
                    </Link>
                  </>
                )}
                <div className="border-t pt-4">
                  <button
                    className={button}
                    disabled={busy || !dirty}
                    onClick={() => void action("save")}
                  >
                    {busy ? "Working…" : "Save draft"}
                  </button>
                </div>
              </section>
              <section className="mt-5 rounded-xl border bg-white p-5">
                <h3 className="font-bold">Publish or schedule</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Dates use your device’s local time. Leaving start blank
                  publishes now.
                  {kind === "storefront"
                    ? " When an end date passes, the previous eligible release returns."
                    : ""}
                </p>
                {data?.permissions.publish ? (
                  <>
                    <div className="my-4 grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Start (optional)"
                        type="datetime-local"
                        value={start}
                        onChange={setStart}
                      />
                      {kind === "storefront" && (
                        <Field
                          label="End (optional)"
                          type="datetime-local"
                          value={end}
                          onChange={setEnd}
                        />
                      )}
                    </div>
                    <button
                      className={button}
                      disabled={busy || dirty || version === 0}
                      onClick={() => void action("publish")}
                    >
                      Publish saved draft
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm">
                    A store manager publishes your saved draft.
                  </p>
                )}
              </section>
              <section className="mt-5 rounded-xl border bg-white p-5">
                <h3 className="font-bold">Release history & restore</h3>
                {!data?.releases?.length && (
                  <p className="mt-3 text-sm text-gray-500">
                    No releases yet. The current store remains unchanged.
                  </p>
                )}
                {data?.releases?.map((r) => (
                  <div
                    key={r.id}
                    className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm"
                  >
                    <div>
                      {new Date(r.starts_at).toLocaleString()}
                      {r.ends_at &&
                        ` → ${new Date(r.ends_at).toLocaleString()}`}
                      <p className="text-xs text-gray-500">
                        {r.cancelled_at
                          ? "Cancelled"
                          : new Date(r.starts_at) > new Date()
                            ? "Scheduled"
                            : r.ends_at && new Date(r.ends_at) < new Date()
                              ? "Expired"
                              : "Eligible · newest start takes priority"}
                      </p>
                    </div>
                    {data.permissions.publish && (
                      <div className="flex gap-4 text-red-700">
                        <button
                          disabled={busy || dirty}
                          onClick={() => void action("restore", r.id)}
                        >
                          Restore
                        </button>
                        {!r.cancelled_at && (
                          <button
                            disabled={busy || dirty}
                            onClick={() => void action("cancel", r.id)}
                          >
                            Cancel release
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <details className="mt-5">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Audit history
                  </summary>
                  {data?.history?.map((h) => (
                    <p
                      key={h.id}
                      className="mt-2 break-all text-xs text-gray-500"
                    >
                      {new Date(h.created_at).toLocaleString()} · {h.action} ·{" "}
                      {h.actor_id}
                    </p>
                  ))}
                </details>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
