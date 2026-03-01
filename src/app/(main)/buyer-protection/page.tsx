import { Shield, Eye, Clock, RefreshCcw, BadgeCheck, MessageSquare, CreditCard, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Buyer Protection — Amana Marketplace" };

const protections = [
  {
    icon: Shield,
    title: "100% Escrow Protection",
    description:
      "Every payment you make on Amana goes into a secure Vesicash escrow account. Your funds are never sent directly to the seller — they are held safely until you receive and approve your order.",
  },
  {
    icon: Clock,
    title: "72-Hour Inspection Window",
    description:
      "After receiving your delivery, you have a full 72 hours to inspect the product. Check quality, quantity, and accuracy against the listing. Only when you're satisfied are the funds released.",
  },
  {
    icon: RefreshCcw,
    title: "Full Refund Guarantee",
    description:
      "If the product doesn't match the listing, is damaged, or never arrives, you are entitled to a full refund from escrow. No chasing sellers — the funds were never theirs to begin with.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Sellers Only",
    description:
      "Every seller on Amana undergoes identity verification. Premium sellers have business registration, tax compliance, and quality certifications verified by our team.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Pay with confidence using 15+ methods including M-Pesa, Flutterwave, bank transfer, and cards. All transactions are encrypted and PCI-DSS compliant.",
  },
  {
    icon: MessageSquare,
    title: "Dispute Resolution",
    description:
      "If something goes wrong, our dedicated team reviews evidence from both parties and resolves disputes within 3–5 business days. You'll never be left without recourse.",
  },
];

const rights = [
  "Receive exactly what was described in the product listing",
  "Inspect your order for up to 72 hours after delivery",
  "Open a dispute if the product is defective, counterfeit, or not as described",
  "Receive a full refund if the seller fails to ship within the agreed timeframe",
  "Communicate with sellers through our secure messaging system",
  "Access your full transaction history and escrow status at any time",
  "Report sellers who violate marketplace policies",
  "Request partial refunds for partially fulfilled orders",
];

const scenarios = [
  {
    situation: "Item Not as Described",
    example: "You ordered a genuine leather bag but received synthetic material.",
    outcome: "Full refund after evidence review. Seller receives a policy violation warning.",
    icon: Eye,
  },
  {
    situation: "Item Never Delivered",
    example: "Tracking shows delivered but you never received the package.",
    outcome: "Investigation initiated. If delivery cannot be confirmed, full refund issued.",
    icon: AlertTriangle,
  },
  {
    situation: "Damaged in Transit",
    example: "Your ceramic vase arrived cracked due to poor packaging.",
    outcome: "Full refund or replacement at seller's expense. Seller must improve packaging.",
    icon: RefreshCcw,
  },
];

export default function BuyerProtectionPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Your Rights, Protected</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Buyer Protection<br />
            <span className="text-[#D4A843]">Guarantee</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            When you shop on Amana, you&apos;re protected at every step. From secure escrow payments to verified sellers
            and a dedicated dispute resolution team — we have your back.
          </p>
        </div>
      </section>

      {/* Protections Grid */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-4">How We Protect You</h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Amana&apos;s buyer protection program is built into every transaction. You don&apos;t need to opt in — it&apos;s automatic.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {protections.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#D4A843]" />
                  </div>
                  <h3 className="font-bold mb-2">{p.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Buyer Rights */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Your Rights as a Buyer</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <ul className="space-y-4">
              {rights.map((right, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#2E7D32]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{right}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Protection Scenarios */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-4">Protection in Action</h2>
          <p className="text-gray-500 text-center mb-12">Real scenarios, real protection.</p>
          <div className="space-y-6">
            {scenarios.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.situation} className="border border-gray-200 rounded-2xl p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{s.situation}</h3>
                      <p className="text-gray-500 text-sm mb-3"><strong>Example:</strong> {s.example}</p>
                      <div className="bg-green-50 rounded-lg px-4 py-3">
                        <p className="text-sm text-green-800"><strong>Outcome:</strong> {s.outcome}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Shop With Complete Confidence</h2>
          <p className="text-white/60 mb-8">
            Every purchase on Amana is backed by escrow protection, verified sellers, and our buyer guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg">Start Shopping</Button>
            </Link>
            <Link href="/how-escrow-works">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                How Escrow Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
