import { RotateCcw, Clock, CheckCircle, XCircle, Package, AlertTriangle, Globe, CreditCard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Returns & Refunds — Amana Marketplace" };

const returnProcess = [
  { step: 1, title: "Report the Issue", desc: "Within 72 hours of delivery, go to your order in the dashboard and select 'Report Issue' or 'Open Dispute.' Describe the problem and upload photo/video evidence." },
  { step: 2, title: "Resolution Offered", desc: "The seller is notified and may offer a resolution (refund, replacement, or partial refund). If you accept, the matter is resolved. If not, Amana mediates." },
  { step: 3, title: "Return Authorized", desc: "If a return is required, Amana issues a Return Authorization. The seller provides a return shipping address and, in some cases, a prepaid shipping label." },
  { step: 4, title: "Ship the Return", desc: "Package the item securely in its original condition with all accessories and documentation. Provide the return tracking number through the Platform." },
  { step: 5, title: "Refund Processed", desc: "Once the seller confirms receipt of the return (or tracking shows delivery), your refund is processed from escrow. Refunds are issued to your original payment method." },
];

const refundTimelines = [
  { method: "M-Pesa / Mobile Money", timeline: "Instant – 24 hours" },
  { method: "Bank Transfer", timeline: "2–5 business days" },
  { method: "Credit/Debit Card", timeline: "5–10 business days" },
  { method: "Flutterwave Balance", timeline: "Instant – 24 hours" },
  { method: "Paystack", timeline: "3–5 business days" },
];

const returnConditions = [
  "Item must be in its original condition — unused, unworn, and undamaged",
  "All original packaging, tags, labels, and accessories must be included",
  "Return must be initiated within the 72-hour inspection window",
  "Item must be securely packaged for the return shipment",
  "Return tracking number must be provided through the Platform",
  "Buyer must not have caused the damage or defect being reported",
];

const nonReturnable = [
  "Perishable goods (food, flowers, fresh produce)",
  "Custom or personalized items made specifically for you",
  "Intimate apparel, swimwear, or undergarments (for hygiene reasons)",
  "Digital products, downloads, or licenses once accessed",
  "Items explicitly marked as 'Final Sale' or 'No Returns' in the listing",
  "Hazardous materials or items with special handling requirements",
  "Items returned after the 72-hour inspection window (unless an active dispute exists)",
];

export default function ReturnsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <RotateCcw className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Hassle-Free Returns</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Returns &<br />
            <span className="text-[#D4A843]">Refunds</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Your purchases are protected by Amana&apos;s escrow system. If something isn&apos;t right with your order,
            here&apos;s how returns and refunds work.
          </p>
        </div>
      </section>

      {/* 72-Hour Window */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-[#D4A843]/5 border border-[#D4A843]/20 rounded-2xl p-8 text-center">
            <Clock className="w-10 h-10 text-[#D4A843] mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold mb-3">72-Hour Inspection Period</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              You have <strong>72 hours</strong> from confirmed delivery to inspect your order. During this window,
              your payment remains safely in escrow. If the product doesn&apos;t match the listing, is defective,
              or was damaged in transit — you can open a dispute and request a return or refund.
            </p>
          </div>
        </div>
      </section>

      {/* Return Process */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Return Process</h2>
          <div className="space-y-6">
            {returnProcess.map((s) => (
              <div key={s.step} className="flex gap-5">
                <div className="w-10 h-10 rounded-full bg-[#1A1A2E] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{s.title}</h3>
                  <p className="text-gray-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Conditions */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="w-6 h-6 text-[#2E7D32]" />
            <h2 className="text-2xl font-extrabold">Return Conditions</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-gray-600 text-sm mb-4">For a return to be accepted, the following conditions must be met:</p>
            <ul className="space-y-2">
              {returnConditions.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-[#2E7D32] mt-0.5">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Refund Timelines */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Refund Timelines</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Refunds are processed once the return is confirmed (or the dispute is resolved in your favor).
            The time to receive your refund depends on your payment method:
          </p>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-5 text-left font-bold">Payment Method</th>
                  <th className="py-3 px-5 text-left font-bold">Refund Timeline</th>
                </tr>
              </thead>
              <tbody>
                {refundTimelines.map((r) => (
                  <tr key={r.method} className="border-b border-gray-100">
                    <td className="py-3 px-5 text-gray-700">{r.method}</td>
                    <td className="py-3 px-5 text-gray-600">{r.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Non-Returnable Items */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <XCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-extrabold">Non-Returnable Items</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-gray-600 text-sm mb-4">The following items generally cannot be returned:</p>
            <ul className="space-y-2">
              {nonReturnable.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-red-400 mt-0.5">✕</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 bg-[#D4A843]/5 rounded-lg p-4 border border-[#D4A843]/20">
              <p className="text-sm text-gray-600">
                <strong>Exception:</strong> Even non-returnable items are eligible for refund if they arrive
                damaged, counterfeit, or significantly different from the listing description.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Border Returns */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Cross-Border Returns</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3 text-sm text-gray-600">
            <p>
              Cross-border returns can be more complex due to shipping costs and customs. Here&apos;s how we handle them:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>If the seller shipped the wrong item or a defective product, the seller bears all return shipping costs</li>
              <li>If the buyer simply changed their mind (where allowed), the buyer may be responsible for return shipping costs</li>
              <li>In many cases, a full refund without return may be offered for low-value items where return shipping costs would be excessive</li>
              <li>Customs duties paid on the original shipment may be recoverable — check with your local customs authority</li>
              <li>Our dispute resolution team takes cross-border complexity into account when determining resolutions</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Need to Return an Item?</h2>
          <p className="text-white/60 mb-8">
            Log into your dashboard to initiate a return or open a dispute on your order.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
            <Link href="/dispute-resolution">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Dispute Resolution
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
