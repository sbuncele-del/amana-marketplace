"use client";

import { useState, useEffect } from "react";
import {useSession} from "next-auth/react";
import {usePathname} from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {readConsent} from "@/components/consent-analytics";
import { X, Mail, ArrowRight } from "lucide-react";

const STORAGE_KEY = "ps_email_popup_dismissed";
const DELAY_MS = 45000; // Only offer after time and meaningful browsing.

export function EmailCapturePopup() {
  const {status} = useSession();
  const pathname = usePathname();
  const eligible = status === "unauthenticated" && !["/account", "/admin", "/dashboard", "/operations", "/partner", "/checkout", "/newsletter", "/feedback"].some(path => pathname.startsWith(path));
  const [markets, setMarkets] = useState<{code:string;name:string}[]>([]);
  const [market, setMarket] = useState('');
  const [countryError, setCountryError] = useState('');
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eligible) return;
    try { if (localStorage.getItem(STORAGE_KEY)) return; } catch { return; }
    const started = Date.now();
    const show = () => {
      if (Date.now() - started < DELAY_MS || document.hidden || !readConsent()) return;
      if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"], [aria-label="Cookie preferences"]')) return;
      const focused = document.activeElement;
      if (focused?.matches('input,textarea,select,[contenteditable="true"]')) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable < 300 || window.scrollY / scrollable < 0.35) return;
      setVisible(true);
      window.clearInterval(timer);
    };
    const timer = window.setInterval(show, 3000);
    return () => window.clearInterval(timer);
  }, [eligible, pathname]);

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    fetch('/api/commerce/markets', {signal:controller.signal}).then(async r => {
      if (!r.ok) throw new Error();
      const data = await r.json(); setMarkets(data.markets); setMarket(data.selectedMarket || '');
    }).catch(e => {if (e.name !== 'AbortError') setCountryError('Local recommendations are temporarily unavailable. You can still subscribe for general updates.');});
    return () => controller.abort();
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* Browsing still works without storage. */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Please tick the box to agree to receive our emails.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true, source: "popup", website: trap, market: market || null }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
      (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.("event", "email_signup", { event_category: "engagement", event_label: "popup" });
      setSubmitted(true);
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* Browsing still works without storage. */ }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!eligible || !visible) return null;

  return (
    <Dialog.Root open={visible} onOpenChange={open => {if (!open) dismiss();}}><Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[199] bg-black/50 backdrop-blur-sm" />
      <Dialog.Content aria-describedby="newsletter-description" className="fixed bottom-4 left-1/2 z-[200] max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
        <button onClick={dismiss} className="absolute top-1 right-1 flex h-11 w-11 items-center justify-center text-white/70 hover:text-white z-10" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="bg-[#171B20] px-6 pt-8 pb-6 text-center text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#DA292B]/30 rounded-full blur-2xl" />
          <div className="relative">
            <Dialog.Title className="text-2xl font-extrabold mb-1">Be first to know</Dialog.Title>
            <Dialog.Description id="newsletter-description" className="text-white/70 text-sm">New arrivals and good deals from Plentovo</Dialog.Description>
          </div>
        </div>

        <div className="px-6 py-6">
          {!submitted ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    aria-label="Email address"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#DA292B] focus:border-transparent"
                    required
                    autoComplete="email"
                  />
                </div>
                <p className="text-xs text-gray-500">{market ? `Recommendations for ${markets.find(m => m.code === market)?.name || market}.` : 'General updates until your delivery country is available.'} <button type="button" className="underline" onClick={() => {setVisible(false); window.dispatchEvent(new Event('plentovo:change-country'));}}>Change delivery country</button></p>
                {countryError && <p role="status" className="text-xs text-gray-500">{countryError}</p>}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} className="hidden" />
                <label className="flex items-start gap-2 text-xs text-gray-500 leading-5">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                  <span>I agree to receive Plentovo news, new arrivals and offers by email. I can unsubscribe at any time. See our <a href="/privacy" className="underline">privacy policy</a>.</span>
                </label>
                {error && <p className="text-red-600 text-xs" role="alert">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#DA292B] hover:bg-[#b82224] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending…" : (<>Keep me posted <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-3">We will email you to confirm. No spam.</p>
            </>
          ) : (
            <div className="text-center py-4">
              <h3 className="font-extrabold text-lg mb-1">Check your inbox</h3>
              <p className="text-sm text-gray-500 mb-4">We have sent a confirmation email. Tap the button inside to finish signing up.</p>
              <button onClick={dismiss} className="bg-[#171B20] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-black transition-colors">
                Keep browsing
              </button>
            </div>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>
  );
}
