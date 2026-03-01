"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user already accepted/declined
    const consent = localStorage.getItem("amana-cookie-consent");
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("amana-cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("amana-cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-[#1A1A2E] border border-white/10 rounded-xl shadow-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-full bg-[#D4A843]/10 items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-[#D4A843]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">
                We use cookies
              </h3>
              <button
                onClick={decline}
                className="sm:hidden text-white/30 hover:text-white/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/45 leading-relaxed mb-4">
              We use cookies and similar technologies to improve your experience,
              analyse traffic, and personalise content. By clicking
              &ldquo;Accept&rdquo;, you consent to our use of cookies. Read our{" "}
              <Link
                href="/cookies"
                className="text-[#D4A843] hover:text-[#D4A843]/80 underline underline-offset-2"
              >
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-[#D4A843] hover:text-[#D4A843]/80 underline underline-offset-2"
              >
                Privacy Policy
              </Link>{" "}
              for more information.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={accept}
                className="px-5 py-2 text-xs font-semibold bg-[#D4A843] hover:bg-[#D4A843]/90 text-[#1A1A2E] rounded-lg transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={decline}
                className="px-5 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 rounded-lg transition-colors"
              >
                Decline
              </button>
              <Link
                href="/cookies"
                className="hidden sm:inline-flex px-5 py-2 text-xs font-semibold text-white/40 hover:text-white/60 transition-colors"
              >
                Manage Preferences
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
