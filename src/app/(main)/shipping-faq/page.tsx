import { Truck, Globe, Clock, Package, AlertTriangle, MapPin, FileText, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Shipping FAQ — Amana Marketplace" };

const domesticRoutes = [
  { route: "Lagos → Abuja (Nigeria)", time: "2–4 business days", carrier: "GIG Logistics, Kwik" },
  { route: "Nairobi → Mombasa (Kenya)", time: "1–3 business days", carrier: "Sendy, G4S" },
  { route: "Accra → Kumasi (Ghana)", time: "2–3 business days", carrier: "Speedaf, DHL" },
  { route: "Johannesburg → Cape Town (South Africa)", time: "2–4 business days", carrier: "The Courier Guy, Aramex" },
  { route: "Dar es Salaam → Dodoma (Tanzania)", time: "2–4 business days", carrier: "DHL, Sendy" },
];

const crossBorderRoutes = [
  { route: "Nigeria → Kenya", time: "5–10 business days", carrier: "DHL Express, Aramex" },
  { route: "Kenya → South Africa", time: "5–8 business days", carrier: "DHL, FedEx" },
  { route: "Ghana → Nigeria", time: "3–7 business days", carrier: "Aramex, Speedaf" },
  { route: "Tanzania → Rwanda", time: "3–5 business days", carrier: "DHL, local carriers" },
  { route: "South Africa → Nigeria", time: "5–10 business days", carrier: "DHL Express, Aramex" },
  { route: "Ethiopia → Kenya", time: "3–6 business days", carrier: "DHL, Ethiopian Cargo" },
];

const carriers = [
  { name: "DHL Express", coverage: "Pan-African, 34+ countries", best: "Cross-border, time-sensitive shipments" },
  { name: "Aramex", coverage: "East Africa, West Africa, Southern Africa", best: "E-commerce parcels, mid-range pricing" },
  { name: "FedEx", coverage: "Major African cities", best: "Heavy/oversized cross-border shipments" },
  { name: "Speedaf", coverage: "West Africa, Central Africa", best: "Budget-friendly regional shipping" },
  { name: "GIG Logistics", coverage: "Nigeria, Ghana", best: "Domestic Nigerian deliveries" },
  { name: "Sendy", coverage: "Kenya, Tanzania, Uganda", best: "East African last-mile delivery" },
];

const prohibitedItems = [
  "Weapons, ammunition, or explosives",
  "Illegal drugs or controlled substances",
  "Live animals or protected wildlife products",
  "Counterfeit or pirated goods",
  "Hazardous chemicals or flammable materials",
  "Currency, financial instruments, or precious metals without certification",
  "Items prohibited by the destination country's laws",
  "Perishable goods without proper cold-chain arrangements",
];

const faqs = [
  {
    q: "Who pays for shipping?",
    a: "Shipping costs are set by the seller and displayed clearly at checkout. Some sellers offer free shipping for orders above a certain threshold. Cross-border duties and taxes are calculated at checkout so there are no surprises.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order ships, you'll receive a tracking number via email and in your dashboard. Click 'Track Order' to see real-time updates. You can also use our Track page to look up any order by ID.",
  },
  {
    q: "What about customs duties?",
    a: "Cross-border shipments may be subject to import duties and taxes. Amana calculates estimated duties at checkout using current tariff data. AfCFTA-eligible products may qualify for reduced or zero duties between member nations.",
  },
  {
    q: "What if my package is damaged in transit?",
    a: "If your package arrives damaged, open a dispute within 72 hours with photos of the damage. You're fully protected by escrow — the seller's funds won't be released until the issue is resolved.",
  },
  {
    q: "Can I change my delivery address after ordering?",
    a: "If the order hasn't shipped yet, contact the seller immediately through the messaging system to request an address change. Once shipped, address changes are not possible.",
  },
  {
    q: "How does AfCFTA benefit my shipping?",
    a: "The African Continental Free Trade Area (AfCFTA) aims to eliminate tariffs on 90% of goods traded between member nations. Products with AfCFTA certificates of origin may qualify for duty-free or reduced-duty treatment, making cross-border shopping more affordable.",
  },
];

export default function ShippingFaqPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Truck className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Delivery Information</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Shipping<br />
            <span className="text-[#D4A843]">FAQ</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Everything you need to know about shipping on Amana — timelines, carriers, tracking,
            customs duties, and cross-border delivery across Africa.
          </p>
        </div>
      </section>

      {/* Domestic Timelines */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <MapPin className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Domestic Shipping Timelines</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 pr-4 font-bold text-gray-900">Route</th>
                  <th className="py-3 pr-4 font-bold text-gray-900">Estimated Time</th>
                  <th className="py-3 font-bold text-gray-900">Carriers</th>
                </tr>
              </thead>
              <tbody>
                {domesticRoutes.map((r) => (
                  <tr key={r.route} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-gray-700">{r.route}</td>
                    <td className="py-3 pr-4 text-gray-600">{r.time}</td>
                    <td className="py-3 text-gray-500">{r.carrier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Cross-Border Timelines */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Cross-Border Shipping Timelines</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 pr-4 font-bold text-gray-900">Route</th>
                  <th className="py-3 pr-4 font-bold text-gray-900">Estimated Time</th>
                  <th className="py-3 font-bold text-gray-900">Carriers</th>
                </tr>
              </thead>
              <tbody>
                {crossBorderRoutes.map((r) => (
                  <tr key={r.route} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-gray-700">{r.route}</td>
                    <td className="py-3 pr-4 text-gray-600">{r.time}</td>
                    <td className="py-3 text-gray-500">{r.carrier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              <strong className="text-[#2E7D32]">AfCFTA Benefit:</strong> Products with valid certificates of origin
              from AfCFTA member states may qualify for reduced or zero customs duties, speeding up clearance
              and reducing costs.
            </p>
          </div>
        </div>
      </section>

      {/* Carrier Partners */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Truck className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Our Carrier Partners</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carriers.map((c) => (
              <div key={c.name} className="border border-gray-100 rounded-xl p-5">
                <h3 className="font-bold mb-2">{c.name}</h3>
                <p className="text-xs text-gray-500 mb-1"><strong>Coverage:</strong> {c.coverage}</p>
                <p className="text-xs text-gray-500"><strong>Best for:</strong> {c.best}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prohibited Items */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-extrabold">Prohibited Items</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-gray-600 text-sm mb-4">The following items cannot be shipped through Amana:</p>
            <ul className="space-y-2">
              {prohibitedItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <XIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Common Questions</h2>
          </div>
          <div className="space-y-4">
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
          <h2 className="text-2xl font-extrabold text-white mb-4">Need to Track an Order?</h2>
          <p className="text-white/60 mb-8">
            Check the real-time status of your shipment with our order tracking tool.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/track">
              <Button size="lg">Track My Order</Button>
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

function XIcon() {
  return (
    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
