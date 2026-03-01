import { Search, MessageSquare, BookOpen, Shield, Truck, CreditCard, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Help Centre — Amana Marketplace" };

const topics = [
  { icon: Shield, title: "Escrow & Payments", desc: "How escrow works, payment methods, refunds, and payouts.", href: "/how-escrow-works" },
  { icon: Truck, title: "Shipping & Delivery", desc: "Shipping options, tracking, customs, and delivery times.", href: "/shipping-faq" },
  { icon: CreditCard, title: "Buyer Protection", desc: "Your rights as a buyer, return policy, and dispute process.", href: "/buyer-protection" },
  { icon: AlertTriangle, title: "Disputes & Returns", desc: "How to open a dispute, resolution timeline, and refunds.", href: "/dispute-resolution" },
  { icon: BookOpen, title: "Seller Guidelines", desc: "Listing standards, verification, shipping requirements.", href: "/seller-guidelines" },
  { icon: MessageSquare, title: "Contact Support", desc: "Reach our team by email, phone, or live chat.", href: "/contact" },
];

const faqs = [
  { q: "How does escrow protection work?", a: "When you place an order, your payment is held securely by our escrow partner, Vesicash. The seller is notified to ship your order. Once you receive and approve the delivery, the funds are released to the seller. If there's an issue, you can open a dispute within 72 hours." },
  { q: "What payment methods do you accept?", a: "We accept M-Pesa, MTN MoMo, Airtel Money, Visa, Mastercard, bank transfers, and Flutterwave. Payment options vary by country." },
  { q: "How long does shipping take?", a: "Domestic orders typically arrive in 3–7 business days. Cross-border shipments take 7–21 days depending on the corridor. All orders include tracking." },
  { q: "How do I become a seller?", a: "Register with a seller account, complete our verification process (ID + business registration), and you can start listing products immediately." },
  { q: "What is AfCFTA and how does it benefit me?", a: "The African Continental Free Trade Area provides preferential tariff rates for qualifying products traded between member countries. Amana automatically calculates AfCFTA eligibility, potentially reducing import duties." },
  { q: "How do I track my order?", a: "Log into your account, go to Orders, and click on any order to see real-time tracking information. You'll also receive email/SMS updates at each stage." },
];

export default function HelpPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Help Centre</h1>
          <p className="text-white/60 mb-8">Find answers to common questions or get in touch with our support team.</p>
          <div className="max-w-xl mx-auto">
            <div className="flex items-center bg-white rounded-lg overflow-hidden shadow-lg">
              <Search className="w-5 h-5 text-gray-400 ml-4" />
              <input type="text" placeholder="Search help articles..." className="flex-1 px-3 py-3 text-sm focus:outline-none" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-extrabold mb-8 text-center">Browse Topics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((t) => {
              const Icon = t.icon;
              return (
                <Link key={t.title} href={t.href} className="group bg-[#FAF8F5] rounded-xl p-5 border border-gray-100 hover:border-[#D4A843]/30 hover:shadow-md transition-all">
                  <Icon className="w-6 h-6 text-[#D4A843] mb-3" />
                  <h3 className="font-bold text-sm mb-1 group-hover:text-[#D4A843] transition-colors">{t.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl font-extrabold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="bg-white rounded-lg border border-gray-200 overflow-hidden group">
                <summary className="px-5 py-4 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 text-center">
        <p className="text-gray-500 text-sm mb-4">Still need help?</p>
        <Link href="/contact" className="inline-flex items-center gap-2 bg-[#D4A843] hover:bg-[#C4982F] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
          <MessageSquare className="w-4 h-4" /> Contact Support
        </Link>
      </section>
    </div>
  );
}
