"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CatalogueCard,
  type CatalogueCardData,
} from "@/components/shop/catalogue-card";
export default function Wishlist() {
  const [page, setPage] = useState(1),
    [refresh, setRefresh] = useState(0),
    [removing, setRemoving] = useState(""),
    [data, setData] = useState<{
      products: (CatalogueCardData | null)[];
      slugs: string[];
      total: number;
    }>(),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/wishlist?page=" + page, { signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setError("");
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });

    return () => c.abort();
  }, [page, refresh]);
  async function remove(slug: string) {
    setRemoving(slug);
    try {
      const r = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, saved: false }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove item.");
    } finally {
      setRemoving("");
    }
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Your saved finds</h1>
      <p className="mt-3 text-sm text-gray-500">
        Keep your shortlist together. Prices and availability are checked when
        you return.
      </p>
      {error ? (
        <p role="status" className="mt-6">
          {error}{" "}
          <Link
            href="/login?callbackUrl=%2Fwishlist"
            className="text-red-700 underline"
          >
            Sign in
          </Link>
        </p>
      ) : !data ? (
        <p className="mt-6">Loading saved items…</p>
      ) : !data.total ? (
        <p className="mt-6">
          Save products using “Save for later” on a product page.{" "}
          <Link className="text-red-700 underline" href="/browse">
            Explore the shop
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.products.map((p, i) => (
              <article key={data.slugs[i]} className="flex flex-col gap-2">
                {p ? (
                  <CatalogueCard product={p} />
                ) : (
                  <p className="rounded-lg border bg-white p-5 text-sm">
                    This saved product is no longer listed.
                  </p>
                )}
                <button
                  className="text-left text-xs text-red-700 underline disabled:opacity-50"
                  disabled={!!removing}
                  onClick={() => void remove(data.slugs[i])}
                >
                  {removing === data.slugs[i]
                    ? "Removing…"
                    : "Remove from wishlist"}
                </button>
              </article>
            ))}
          </div>
          <div className="mt-6 flex justify-between text-sm">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              ← Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={page * 20 >= data.total}
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </main>
  );
}
