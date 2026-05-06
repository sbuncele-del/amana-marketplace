"use client";

import { useState, useEffect } from "react";
import { X, Tag, Mail, ArrowRight } from "lucide-react";

const STORAGE_KEY = "ps_email_popup_dismissed";
const DELAY_MS = 8000; // show after 8 seconds

export function EmailCapturePopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Don't show if already dismissed or submitted
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Fire GA4 event if available
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "email_signup", {
          event_category: "engagement",
          event_label: "popup_discount",
        });
      }
      // Store in Shopify customer list via our API (or just save locally for now)
      await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {}); // Silent fail — we still show success

      setSubmitted(true);
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] px-6 pt-8 pb-6 text-center text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#D4A843]/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#D4A843]/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-[#D4A843] text-[#1A1A2E] text-xs font-extrabold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              <Tag className="w-3 h-3" /> Limited Offer
            </div>
            <h2 className="text-2xl font-extrabold mb-1">Get 10% Off</h2>
            <p className="text-white/70 text-sm">Your first order when you join Prime Sources</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {!submitted ? (
            <>
              <p className="text-sm text-gray-500 text-center mb-4">
                Subscribe for exclusive deals, new arrivals & the best prices across Africa.
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A843] focus:border-transparent"
                    required
                    autoComplete="email"
                  />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D4A843] hover:bg-[#c49730] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {loading ? "Subscribing…" : (
                    <>Claim My 10% Discount <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-3">
                No spam. Unsubscribe anytime.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-extrabold text-lg mb-1">You&apos;re in!</h3>
              <p className="text-sm text-gray-500 mb-4">
                Check your inbox for your 10% discount code.
              </p>
              <button
                onClick={dismiss}
                className="bg-[#1A1A2E] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#0F3460] transition-colors"
              >
                Start Shopping →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
