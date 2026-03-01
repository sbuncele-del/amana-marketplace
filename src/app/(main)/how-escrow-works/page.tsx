import { ShieldCheck, CreditCard, Truck, CheckCircle, Banknote, ArrowDown, Search, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "How Escrow Works — Amana Marketplace" };

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Browse & Order",
    description:
      "Find products from verified African sellers across 34+ countries. Add items to your cart and proceed to checkout just like any online marketplace.",
    detail:
      "All sellers are identity-verified and rated by previous buyers. You can message sellers before purchasing to confirm details, request custom orders, or negotiate bulk pricing.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    number: 2,
    icon: CreditCard,
    title: "Pay Into Escrow",
    description:
      "Your payment is held securely in a Vesicash escrow account — NOT sent directly to the seller. Funds are protected until you confirm satisfaction.",
    detail:
      "We support 15+ payment methods including M-Pesa, Flutterwave, bank transfer, and card payments. Multi-currency support means you pay in your local currency while sellers receive theirs.",
    color: "bg-[#D4A843]/10 text-[#D4A843]",
  },
  {
    number: 3,
    icon: Truck,
    title: "Seller Ships",
    description:
      "Once escrow is confirmed, the seller is notified to prepare and ship your order. A tracking number is provided so you can follow your package in real-time.",
    detail:
      "Sellers must ship within the agreed timeframe (typically 2–5 business days). Cross-border shipments include customs pre-clearance documentation and AfCFTA certificates of origin where applicable.",
    color: "bg-green-50 text-green-600",
  },
  {
    number: 4,
    icon: CheckCircle,
    title: "Buyer Inspects",
    description:
      "You receive your order and have a 72-hour inspection window. Check the product matches the listing — quality, quantity, and condition must all be as described.",
    detail:
      "If everything is perfect, mark the order as accepted. If there's an issue, open a dispute directly from your dashboard with photo or video evidence. Your funds remain safe in escrow until the matter is resolved.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    number: 5,
    icon: Banknote,
    title: "Funds Released",
    description:
      "Once you confirm satisfaction (or the 72-hour window closes without a dispute), the funds are automatically released to the seller. Transaction complete.",
    detail:
      "Sellers receive payment in their local currency. The entire process is transparent — both buyer and seller can see the escrow status at every stage from their respective dashboards.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

const benefits = [
  { icon: ShieldCheck, title: "100% Purchase Protection", desc: "Every single transaction on Amana is escrow-protected. No exceptions." },
  { icon: Lock, title: "Secure Fund Holding", desc: "Powered by Vesicash, a licensed escrow provider. Funds are held in regulated trust accounts." },
  { icon: CreditCard, title: "15+ Payment Methods", desc: "Pay with M-Pesa, cards, bank transfer, Flutterwave, and more — in your local currency." },
  { icon: CheckCircle, title: "72-Hour Inspection", desc: "Full inspection period to verify your purchase before funds are ever released to the seller." },
];

export default function HowEscrowWorksPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <ShieldCheck className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Powered by Vesicash</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            How Escrow Protection<br />
            <span className="text-[#D4A843]">Keeps You Safe</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Every transaction on Amana is protected by Vesicash escrow. Your money is held securely
            until you receive and approve your order. Here&apos;s exactly how it works.
          </p>
        </div>
      </section>

      {/* 5-Step Diagram */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-4">The 5-Step Escrow Process</h2>
          <p className="text-gray-500 text-center mb-14 max-w-2xl mx-auto">
            From browsing to payment release, every step is designed to protect both buyers and sellers.
          </p>

          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number}>
                  <div className="relative border border-gray-200 rounded-2xl p-6 md:p-8 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Step Number + Icon */}
                      <div className="flex-shrink-0 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center font-extrabold text-lg">
                          {step.number}
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        <p className="text-gray-600 mb-3">{step.description}</p>
                        <p className="text-sm text-gray-400">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="w-6 h-6 text-[#D4A843]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Why Escrow Makes the Difference</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#D4A843]" />
                  </div>
                  <h3 className="font-bold mb-2">{b.title}</h3>
                  <p className="text-gray-600 text-sm">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">With Escrow vs Without</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50/30">
              <h3 className="font-bold text-red-800 mb-4">❌ Without Escrow</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>• Pay the seller directly and hope they ship</li>
                <li>• No recourse if product doesn&rsquo;t match listing</li>
                <li>• Risk of counterfeit or substandard goods</li>
                <li>• Cross-border disputes nearly impossible to resolve</li>
                <li>• Seller can disappear after receiving payment</li>
              </ul>
            </div>
            <div className="border-2 border-green-200 rounded-2xl p-6 bg-green-50/30">
              <h3 className="font-bold text-green-800 mb-4">✅ With Amana Escrow</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>• Funds held securely until you approve the order</li>
                <li>• 72-hour inspection window on every delivery</li>
                <li>• Dedicated dispute resolution with evidence review</li>
                <li>• Full refund if seller fails to deliver</li>
                <li>• Both parties held accountable by escrow terms</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Ready to Trade With Confidence?</h2>
          <p className="text-white/60 mb-8">
            Join thousands of buyers and sellers across Africa who trade safely with Amana&apos;s escrow protection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg">Start Shopping</Button>
            </Link>
            <Link href="/dashboard/sell">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
