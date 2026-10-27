"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
export function EmailSignIn() {
  const router = useRouter(),
    params = useSearchParams();
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [challenge, setChallenge] = useState(""),
    [password, setPassword] = useState(""),
    [passwordMode, setPasswordMode] = useState(false),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sentAt, setSentAt] = useState(0);
  async function finish() {
    const next = params.get("callbackUrl");
    const r = await fetch(
      "/api/auth/destination" +
        (next ? "?next=" + encodeURIComponent(next) : ""),
    );
    const d = await r.json();
    router.replace(d.destination || "/account");
    router.refresh();
  }
  async function send() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, marketingConsent: consent }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setChallenge(d.challenge);
      setCode("");
      setSentAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send code.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!passwordMode && !challenge) {
      await send();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        ...(passwordMode ? { password } : { code, challenge }),
        redirect: false,
      });
      if (!result || !result.ok || result.error)
        throw Error(
          passwordMode
            ? "Email or password did not match."
            : "That code is invalid or expired. Check the latest email or request a new code.",
        );
      await finish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const field =
    "mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F6F3] px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" aria-label="Plentovo home">
          <BrandLogo className="h-auto w-44" />
        </Link>
        <p className="mt-5 text-sm text-gray-500">
          Good things. Plenty of choice.
        </p>
        <h1 className="mt-6 text-2xl font-bold">
          {passwordMode
            ? "Sign in with your password"
            : challenge
              ? "Check your email"
              : "Welcome to Plentovo"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {passwordMode
            ? "Use your existing account password."
            : challenge
              ? `We sent a six-digit code to ${email}. It is valid for 10 minutes.`
              : "Sign in or create your account with an email code. No password to remember."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-5">
          {(!challenge || passwordMode) && (
            <label className="block text-sm font-semibold">
              Email address
              <input
                className={field}
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </label>
          )}
          {challenge && !passwordMode && (
            <label className="block text-sm font-semibold">
              Your six-digit code
              <input
                className={field + " text-center text-2xl tracking-[.3em]"}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={busy}
              />
            </label>
          )}
          {passwordMode && (
            <label className="block text-sm font-semibold">
              Password
              <input
                className={field}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
            </label>
          )}
          {!challenge && !passwordMode && (
            <>
              <label className="flex items-start gap-2 text-xs leading-5 text-gray-600">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                Email me relevant finds, new arrivals and offers. Optional;
                unsubscribe any time.
              </label>
              <p className="text-xs leading-5 text-gray-500">
                Continuing means you agree to our{" "}
                <Link className="underline" href="/terms">
                  Terms
                </Link>
                . See our{" "}
                <Link className="underline" href="/privacy">
                  Privacy policy
                </Link>
                . If you are new, we create your customer account after
                verifying your email.
              </p>
            </>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-[#DA292B] px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy
              ? "Please wait…"
              : passwordMode
                ? "Sign in"
                : challenge
                  ? "Verify & continue"
                  : "Continue with email"}
          </button>
        </form>
        {challenge && !passwordMode && (
          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
            <button
              disabled={busy}
              className="text-red-700 underline"
              onClick={() => {
                setChallenge("");
                setCode("");
                setError("");
              }}
            >
              Change email
            </button>
            <button
              disabled={busy}
              className="text-red-700 underline"
              onClick={() => {
                if (Date.now() - sentAt < 60000) {
                  setError(
                    "Please wait a minute before requesting another code.",
                  );
                  return;
                }
                void send();
              }}
            >
              Resend code
            </button>
          </div>
        )}
        <button
          className="mt-6 text-sm font-semibold text-red-700 underline"
          disabled={busy}
          onClick={() => {
            setPasswordMode(!passwordMode);
            setChallenge("");
            setError("");
          }}
        >
          {passwordMode
            ? "Use an email code instead"
            : "Use my existing password instead"}
        </button>
        {passwordMode && (
          <Link
            href="/forgot-password"
            className="mt-3 block text-sm text-gray-500 underline"
          >
            Forgot password?
          </Link>
        )}
        <div className="mt-7 border-t pt-5 text-xs leading-6 text-gray-500">
          <p>Your approved team access follows your account automatically.</p>
          <Link href="/partner" className="text-red-700 underline">
            Apply to become a fulfilment partner
          </Link>
          <span className="mx-2">·</span>
          <Link href="/browse" className="underline">
            Continue browsing
          </Link>
        </div>
      </section>
    </main>
  );
}
