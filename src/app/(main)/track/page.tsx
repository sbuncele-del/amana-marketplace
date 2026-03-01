"use client";

import { Package, Search, Truck, CheckCircle, Clock, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const trackingStates = [
  { label: "Order Placed", icon: Package, description: "Your order has been confirmed and payment is in escrow." },
  { label: "Escrow Confirmed", icon: ShieldCheck, description: "Payment securely held by Vesicash. Seller notified to prepare shipment." },
  { label: "Shipped", icon: Truck, description: "Seller has dispatched your order. Tracking number assigned." },
  { label: "In Transit", icon: MapPin, description: "Your package is on its way to the delivery address." },
  { label: "Delivered", icon: CheckCircle, description: "Package delivered. 72-hour inspection window has started." },
  { label: "Completed", icon: ShieldCheck, description: "Order approved. Escrow funds released to seller." },
];

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(true);
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Truck className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Real-Time Tracking</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Track Your<br />
            <span className="text-[#D4A843]">Order</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
            Enter your order ID or the email address used at checkout to see real-time status updates
            on your Amana Marketplace order.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSubmitted(false); }}
                  placeholder="Order ID (e.g., AMN-2026-0847) or email address"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                />
              </div>
              <Button type="submit" size="lg" className="sm:w-auto">
                Track Order
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Tracking Result / Demo */}
      {submitted && (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-[#FAF8F5] rounded-2xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-bold text-lg">{query.includes("@") ? "AMN-2026-XXXX" : query}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-flex items-center gap-1.5 bg-[#D4A843]/10 text-[#D4A843] px-3 py-1 rounded-full text-sm font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Processing
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center py-8">
                To view real order tracking details, please{" "}
                <Link href="/dashboard" className="text-[#D4A843] font-medium hover:underline">
                  log in to your dashboard
                </Link>
                . This page shows the tracking flow below for reference.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Tracking States Visual */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-4">Order Lifecycle</h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Every order on Amana follows these stages. You can see the current status of your order
            in real-time from your dashboard.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackingStates.map((state, i) => {
              const Icon = state.icon;
              return (
                <div key={state.label} className="relative border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#D4A843]" />
                  </div>
                  <h3 className="font-bold mb-1">{state.label}</h3>
                  <p className="text-gray-500 text-sm">{state.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tracking Tips */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Tracking Tips</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold mb-2">Where do I find my Order ID?</h3>
              <p className="text-gray-600 text-sm">
                Your Order ID is included in the confirmation email sent after checkout. It follows the
                format AMN-YYYY-XXXX. You can also find it in your dashboard under &ldquo;My Orders.&rdquo;
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold mb-2">What if tracking isn&apos;t updating?</h3>
              <p className="text-gray-600 text-sm">
                Cross-border shipments may experience delays in tracking updates during customs processing.
                If tracking hasn&apos;t updated for more than 5 business days, contact our support team.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold mb-2">When does my 72-hour window start?</h3>
              <p className="text-gray-600 text-sm">
                The inspection window begins when the carrier confirms delivery (status changes to &ldquo;Delivered&rdquo;).
                You have exactly 72 hours from that timestamp to inspect and either approve or dispute.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold mb-2">Can I track multiple orders?</h3>
              <p className="text-gray-600 text-sm">
                Yes! Log in to your dashboard to see all active and past orders in one place, each with
                its own tracking status and escrow information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Need Help With Your Order?</h2>
          <p className="text-white/60 mb-8">
            Our support team is available to help with any shipping or order inquiries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/help">
              <Button size="lg">Visit Help Center</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
