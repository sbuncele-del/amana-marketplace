"use client";

import { useState, useEffect } from "react";
import { X, Mail, ArrowRight } from "lucide-react";

const STORAGE_KEY = "ps_email_popup_dismissed";
const DELAY_MS = 8000; // show after 8 seconds

export function EmailCapturePopup() {
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
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    let retry: ReturnType<typeof setTimeout>;
    const show = () => {
      if (document.querySelector('dialog[open]')) {retry = setTimeout(show, 1000); return;}
      setVisible(true);
    };
    const timer = setTimeout(show, DELAY_MS);
    return () => {clearTimeout(timer); clearTimeout(retry);};
  }, []);

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
    localStorage.setItem(STORAGE_KEY, "1");
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
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0" role="dialog" aria-modal="true" aria-label="Join the Plentovo list">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} aria-hidden="true" />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <button onClick={dismiss} className="absolute top-3 right-3 text-white/70 hover:text-white z-10" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="bg-[#171B20] px-6 pt-8 pb-6 text-center text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#DA292B]/30 rounded-full blur-2xl" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold mb-1">Be first to know</h2>
            <p className="text-white/70 text-sm">New arrivals and good deals from Plentovo</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {!submitted ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
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
      </div>
    </div>
  );
}
