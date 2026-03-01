import { Package, Truck, Globe, FileText, Tag, Scale, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Shipping Guide for Sellers — Amana Marketplace" };

const packagingRequirements = [
  { title: "Inner Protection", desc: "Wrap items individually with bubble wrap, foam, or tissue paper. Fragile items need at least 2 inches of cushioning on all sides." },
  { title: "Outer Packaging", desc: "Use new or sturdy corrugated cardboard boxes. The box should be appropriately sized — no more than 2 inches of space around the product after padding." },
  { title: "Sealing", desc: "Seal all boxes with strong packing tape on all seams. Reinforce corners and edges for heavy or fragile items. Use 'Fragile' stickers where applicable." },
  { title: "Moisture Protection", desc: "For cross-border shipments, enclose items in a plastic bag or wrap to protect against humidity and rain during transit. Essential for textiles and leather." },
  { title: "Weight Distribution", desc: "For multi-item orders, place heavier items at the bottom. Fill all empty spaces with packing material to prevent shifting during transport." },
];

const carrierComparison = [
  { carrier: "DHL Express", domestic: "$5–15", crossBorder: "$20–60", speed: "1–3 days domestic, 3–7 cross-border", tracking: "Full", insurance: "Included up to $100" },
  { carrier: "Aramex", domestic: "$4–12", crossBorder: "$15–45", speed: "2–5 days domestic, 5–10 cross-border", tracking: "Full", insurance: "Optional add-on" },
  { carrier: "FedEx", domestic: "$6–18", crossBorder: "$25–70", speed: "1–3 days domestic, 3–7 cross-border", tracking: "Full", insurance: "Included up to $100" },
  { carrier: "Speedaf", domestic: "$3–8", crossBorder: "$10–30", speed: "3–7 days domestic, 7–14 cross-border", tracking: "Basic", insurance: "Optional add-on" },
  { carrier: "GIG Logistics", domestic: "$2–6", crossBorder: "N/A (Nigeria only)", speed: "1–4 days", tracking: "Full", insurance: "Optional" },
  { carrier: "Sendy", domestic: "$2–5", crossBorder: "$12–35 (East Africa)", speed: "1–3 days domestic, 3–7 regional", tracking: "Full", insurance: "Optional" },
];

const crossBorderDocs = [
  {
    title: "Commercial Invoice",
    desc: "Required for all international shipments. Must include: sender/receiver details, product description, quantity, value (in USD), HS code, and country of origin. Amana auto-generates this from your listing data.",
  },
  {
    title: "HS Codes (Harmonized System)",
    desc: "Every product needs a correct HS code for customs classification. Amana suggests HS codes based on your product category, but verify accuracy. Incorrect HS codes can cause delays or additional duties.",
  },
  {
    title: "Certificate of Origin",
    desc: "Proves where the product was manufactured or substantially transformed. Required for AfCFTA preferential tariff treatment. Obtain from your local chamber of commerce or trade authority.",
  },
  {
    title: "Phytosanitary Certificate",
    desc: "Required for plant-based products (teas, spices, seeds, wood items). Issued by your country's agricultural authority. Must be obtained before shipping.",
  },
  {
    title: "Quality Certificates",
    desc: "Gemstones need gemological certificates. Food products need safety certifications. Electronics need compliance marks (CE, FCC). Include copies with the shipment.",
  },
];

const afcftaInfo = [
  "Products must originate from an AfCFTA member state",
  "Certificate of Origin must be obtained before shipping",
  "Product must meet Rules of Origin criteria (wholly obtained or substantially transformed)",
  "Tariff reduction applies to 90% of goods traded between member states",
  "Some sensitive products may still carry duties during the transition period",
  "Keep records of all origin documentation for at least 5 years",
];

const labelRequirements = [
  { field: "Sender Name", example: "Kilimanjaro Gems Ltd" },
  { field: "Sender Address", example: "P.O. Box 1234, Arusha, Tanzania" },
  { field: "Sender Phone", example: "+255 xxx xxx xxx" },
  { field: "Receiver Name", example: "As provided at checkout" },
  { field: "Receiver Address", example: "As provided at checkout" },
  { field: "Amana Order ID", example: "AMN-2026-0847" },
  { field: "Contents Description", example: "Tanzanite gemstone, 2.5ct" },
  { field: "Declared Value", example: "$350 USD" },
];

export default function ShippingGuidePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Truck className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">For Sellers</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Seller Shipping<br />
            <span className="text-[#D4A843]">Guide</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Everything you need to ship your products safely and efficiently — packaging, carriers,
            cross-border documentation, AfCFTA eligibility, and labeling requirements.
          </p>
        </div>
      </section>

      {/* Packaging */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Packaging Requirements</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Proper packaging prevents damage, reduces disputes, and keeps your seller rating high.
            Damaged-in-transit claims are the seller&apos;s responsibility if packaging is inadequate.
          </p>
          <div className="space-y-4">
            {packagingRequirements.map((p) => (
              <div key={p.title} className="border border-gray-100 rounded-xl p-5 flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm mb-1">{p.title}</h3>
                  <p className="text-gray-600 text-sm">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carrier Comparison */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Truck className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Carrier Rate Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm bg-white rounded-xl border border-gray-100">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 font-bold">Carrier</th>
                  <th className="py-3 px-4 font-bold">Domestic</th>
                  <th className="py-3 px-4 font-bold">Cross-Border</th>
                  <th className="py-3 px-4 font-bold">Speed</th>
                  <th className="py-3 px-4 font-bold">Tracking</th>
                  <th className="py-3 px-4 font-bold">Insurance</th>
                </tr>
              </thead>
              <tbody>
                {carrierComparison.map((c) => (
                  <tr key={c.carrier} className="border-b border-gray-50">
                    <td className="py-3 px-4 font-medium">{c.carrier}</td>
                    <td className="py-3 px-4 text-gray-600">{c.domestic}</td>
                    <td className="py-3 px-4 text-gray-600">{c.crossBorder}</td>
                    <td className="py-3 px-4 text-gray-500">{c.speed}</td>
                    <td className="py-3 px-4 text-gray-500">{c.tracking}</td>
                    <td className="py-3 px-4 text-gray-500">{c.insurance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            * Rates are estimates based on a 1kg parcel. Actual rates vary by weight, dimensions, and destination.
          </p>
        </div>
      </section>

      {/* Cross-Border Documentation */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Cross-Border Documentation</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Shipping across African borders requires proper documentation. Missing paperwork is the #1 cause
            of customs delays. Prepare these documents before dropping off your shipment.
          </p>
          <div className="space-y-4">
            {crossBorderDocs.map((d) => (
              <div key={d.title} className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold mb-1">{d.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AfCFTA Eligibility */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-6 h-6 text-[#2E7D32]" />
            <h2 className="text-2xl font-extrabold">AfCFTA Eligibility</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-gray-600 text-sm mb-4">
              The African Continental Free Trade Area (AfCFTA) offers preferential tariff treatment for
              qualifying goods. To benefit from reduced or zero duties:
            </p>
            <ul className="space-y-2">
              {afcftaInfo.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-[#2E7D32] mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Pro Tip:</strong> Products with AfCFTA badges in their listings get 23% more buyer clicks
                on average. Apply for your Certificate of Origin today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Labeling */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Tag className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Labeling Requirements</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Every package must have a clear, legible label with the following information:
          </p>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {labelRequirements.map((l) => (
                <div key={l.field} className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">{l.field}</span>
                  <span className="text-gray-700">{l.example}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 bg-[#D4A843]/5 rounded-xl p-4 border border-[#D4A843]/20">
            <AlertTriangle className="w-5 h-5 text-[#D4A843] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              <strong>Important:</strong> Always include the Amana Order ID on the outer label. This helps our
              support team trace packages in case of delivery issues or disputes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Ship Your First Order</h2>
          <p className="text-white/60 mb-8">
            Follow these guidelines to ensure smooth delivery and happy buyers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/sell">
              <Button size="lg">Go to Seller Dashboard</Button>
            </Link>
            <Link href="/seller-guidelines">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Seller Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
