import { Scale, Upload, Clock, FileText, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dispute Resolution — Amana Marketplace" };

const steps = [
  {
    number: 1,
    icon: AlertCircle,
    title: "Open a Dispute",
    time: "Within 72 hours of delivery",
    description:
      "From your order dashboard, select 'Open Dispute' on the relevant order. Choose the reason: item not as described, damaged, wrong item, missing items, or item not received. Provide a clear description of the issue.",
  },
  {
    number: 2,
    icon: Upload,
    title: "Submit Evidence",
    time: "Within 24 hours of opening",
    description:
      "Upload photos, videos, or documents that support your claim. This may include images of the received product, screenshots of the listing, packaging condition, or any communication with the seller. The seller will also be asked to submit their evidence.",
  },
  {
    number: 3,
    icon: MessageSquare,
    title: "Both Parties Respond",
    time: "48 hours for responses",
    description:
      "The seller is notified immediately and has 48 hours to respond with their side. During this period, both parties can communicate through the dispute resolution portal. Many disputes are resolved directly at this stage through mutual agreement.",
  },
  {
    number: 4,
    icon: Scale,
    title: "Amana Review",
    time: "1–3 business days",
    description:
      "If no mutual agreement is reached, our dispute resolution team reviews all evidence from both sides. We examine the listing accuracy, shipping documentation, product condition evidence, and communication history to make a fair determination.",
  },
  {
    number: 5,
    icon: FileText,
    title: "Resolution Issued",
    time: "Within 3–5 business days total",
    description:
      "A binding resolution is issued. This may be a full refund to the buyer, a partial refund, or release of funds to the seller. Both parties are notified with a detailed explanation of the decision and next steps.",
  },
];

const outcomes = [
  {
    icon: CheckCircle,
    title: "Full Refund",
    color: "text-green-600 bg-green-50",
    description: "Issued when: the product significantly differs from the listing, is counterfeit, is damaged beyond use, or was never delivered. The full escrow amount is returned to the buyer.",
  },
  {
    icon: Scale,
    title: "Partial Refund",
    color: "text-[#D4A843] bg-[#D4A843]/10",
    description: "Issued when: the product has minor discrepancies from the listing, or the buyer and seller agree to a partial resolution. The agreed amount is returned to the buyer, the remainder released to the seller.",
  },
  {
    icon: XCircle,
    title: "Funds Released to Seller",
    color: "text-blue-600 bg-blue-50",
    description: "Issued when: the evidence shows the product was delivered as described, the dispute was filed incorrectly, or the buyer's claims cannot be substantiated. The full amount is released to the seller.",
  },
];

const faqs = [
  {
    q: "What if I miss the 72-hour window?",
    a: "Disputes must be opened within 72 hours of confirmed delivery. After this window, funds are automatically released to the seller. In exceptional cases (e.g., you were traveling), contact support within 7 days for a case-by-case review.",
  },
  {
    q: "Can I cancel a dispute?",
    a: "Yes, you can withdraw a dispute at any time before a resolution is issued. This will release the funds to the seller. Once withdrawn, you cannot re-open a dispute for the same order.",
  },
  {
    q: "What evidence should I submit?",
    a: "Clear photos/videos of the received product, the original listing screenshots, packaging condition, shipping labels, and any relevant communication. The more evidence you provide, the faster and more accurate the resolution.",
  },
  {
    q: "Are resolution decisions final?",
    a: "Resolutions can be appealed once within 7 days by providing new evidence not previously considered. A senior review team handles all appeals. Second-level decisions are final and binding.",
  },
  {
    q: "What about cross-border disputes?",
    a: "Cross-border disputes follow the same process. Additional consideration is given to customs delays, international shipping timelines, and the complexity of returning items across borders. Return shipping in cross-border cases is handled case-by-case.",
  },
];

export default function DisputeResolutionPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Scale className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Fair & Transparent</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Dispute<br />
            <span className="text-[#D4A843]">Resolution</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            When things don&apos;t go as planned, we have a clear, fair process to resolve disputes.
            Your funds remain in escrow until a resolution is reached — protecting both buyers and sellers.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-4">How the Process Works</h2>
          <p className="text-gray-500 text-center mb-14">Most disputes are resolved within 3–5 business days.</p>
          <div className="space-y-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {step.number}
                    </div>
                    {step.number < steps.length && <div className="w-px h-full bg-gray-200 mt-2" />}
                  </div>
                  <div className="pb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{step.title}</h3>
                      <span className="text-xs bg-[#D4A843]/10 text-[#D4A843] px-2 py-0.5 rounded-full font-medium">
                        {step.time}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Possible Outcomes */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Possible Outcomes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {outcomes.map((o) => {
              const Icon = o.icon;
              return (
                <div key={o.title} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className={`w-10 h-10 rounded-lg ${o.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold mb-2">{o.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{o.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Need to Open a Dispute?</h2>
          <p className="text-white/60 mb-8">
            Log into your dashboard to manage your orders and open a dispute if needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
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
