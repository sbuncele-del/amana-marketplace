"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
export function WishlistButton({ slug }: { slug: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (status !== "authenticated") return;
    const c = new AbortController();
    fetch("/api/wishlist", { signal: c.signal })
      .then((r) => r.json())
      .then((d) => setSaved(d.slugs?.includes(slug) || false))
      .catch(() => {});
    return () => c.abort();
  }, [status, slug]);
  async function toggle() {
    if (status !== "authenticated") {
      router.push(
        "/login?callbackUrl=" + encodeURIComponent("/product/" + slug),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, saved: !saved }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setSaved(d.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4">
      <button
        disabled={busy || status === "loading"}
        aria-pressed={saved}
        onClick={() => void toggle()}
        className="min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
      >
        {saved ? "♥ Saved to wishlist" : "♡ Save for later"}
      </button>
      {error && (
        <p role="status" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
