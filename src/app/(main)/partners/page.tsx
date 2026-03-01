import { Handshake, Truck, CreditCard, Code, Globe, Building2, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Partners — Amana Marketplace" };

const logisticsPartners = [
  { name: "DHL Express Africa", desc: "Our primary cross-border shipping partner, providing express delivery to 34+ African countries with full tracking and insurance.", region: "Pan-African" },
  { name: "Aramex", desc: "Regional logistics partner for East, West, and Southern Africa. Offers competitive rates for e-commerce parcels.", region: "East, West, Southern Africa" },
  { name: "Sendy", desc: "Last-mile delivery partner for Kenya, Tanzania, and Uganda. Provides affordable, fast domestic delivery with real-time tracking.", region: "East Africa" },
  { name: "GIG Logistics", desc: "Nigeria's leading logistics company. Handles domestic deliveries across all 36 states with same-day and next-day options.", region: "Nigeria" },
  { name: "Speedaf Express", desc: "Budget-friendly shipping across West and Central Africa. Ideal for standard delivery timelines.", region: "West & Central Africa" },
];

const paymentPartners = [
  { name: "Vesicash", desc: "Licensed escrow provider powering every transaction on Amana. Holds funds in regulated trust accounts until buyer approval.", role: "Escrow Provider" },
  { name: "Flutterwave", desc: "Pan-African payment gateway enabling card payments, bank transfers, and mobile money across 34+ countries.", role: "Payment Gateway" },
  { name: "M-Pesa", desc: "Mobile money integration for East African markets. Enables buyers to pay directly from their M-Pesa wallets.", role: "Mobile Money" },
  { name: "Paystack", desc: "Payment processing for Nigerian and Ghanaian markets. Supports cards, bank transfers, and USSD payments.", role: "Payment Processing" },
];

const technologyPartners = [
  { name: "Vercel", desc: "Cloud hosting platform powering Amana's global edge network for fast page loads across Africa.", role: "Cloud Infrastructure" },
  { name: "Cloudinary", desc: "Image management platform handling product photography optimization, resizing, and CDN delivery.", role: "Media Management" },
  { name: "Algolia", desc: "Search infrastructure powering Amana's product discovery with AI-powered relevance and multi-language support.", role: "Search & Discovery" },
];

const partnerBenefits = [
  "Access to Amana's growing network of buyers and sellers across 34+ countries",
  "Co-marketing opportunities and brand visibility on the platform",
  "Integration support from our engineering team",
  "Revenue sharing and commission structures tailored to your contribution",
  "Quarterly business reviews and performance insights",
  "Early access to new features and market expansion plans",
];

export default function PartnersPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Handshake className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Growing Together</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Our<br />
            <span className="text-[#D4A843]">Partners</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Amana works with leading logistics, payment, and technology companies to deliver
            a seamless cross-border commerce experience across Africa.
          </p>
        </div>
      </section>

      {/* Logistics Partners */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Truck className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Logistics Partners</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {logisticsPartners.map((p) => (
              <div key={p.name} className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{p.name}</h3>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.region}</span>
                </div>
                <p className="text-gray-600 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Partners */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Payment Partners</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {paymentPartners.map((p) => (
              <div key={p.name} className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{p.name}</h3>
                  <span className="text-xs bg-[#D4A843]/10 text-[#D4A843] px-2 py-0.5 rounded-full">{p.role}</span>
                </div>
                <p className="text-gray-600 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Partners */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Code className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Technology Partners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {technologyPartners.map((p) => (
              <div key={p.name} className="border border-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{p.name}</h3>
                </div>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{p.role}</span>
                <p className="text-gray-600 text-sm mt-3">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AfCFTA Partnership */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-[#2E7D32]" />
            <h2 className="text-2xl font-extrabold">AfCFTA Alliance</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <p className="text-gray-600 leading-relaxed mb-4">
              Amana is proud to be aligned with the goals of the African Continental Free Trade Area (AfCFTA). 
              We actively support the vision of a single continental market by:
            </p>
            <ul className="space-y-3 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#2E7D32] mt-0.5">✓</span>
                Building AfCFTA-compliant duty calculators that automatically apply preferential tariffs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2E7D32] mt-0.5">✓</span>
                Enabling sellers to obtain and display Certificates of Origin for their products
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2E7D32] mt-0.5">✓</span>
                Providing trade data and insights to support intra-African commerce development
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2E7D32] mt-0.5">✓</span>
                Partnering with national trade promotion agencies to onboard small and medium enterprises
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Become a Partner */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Become a Partner</h2>
          </div>
          <p className="text-gray-600 mb-6">
            We&apos;re always looking for partners who share our vision for trusted African commerce. 
            Whether you&apos;re a logistics provider, payment company, technology platform, or trade organization — 
            let&apos;s explore how we can work together.
          </p>

          <h3 className="font-bold mb-4">Partnership Benefits</h3>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-8">
            <ul className="space-y-2">
              {partnerBenefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-[#D4A843] mt-0.5">•</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] rounded-2xl p-8 text-center">
            <Mail className="w-8 h-8 text-[#D4A843] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Partnership Inquiries</h3>
            <p className="text-white/60 mb-6 text-sm">
              Send us a brief overview of your company and how you&apos;d like to partner with Amana.
            </p>
            <div className="bg-white/10 rounded-xl p-4 inline-block mb-4">
              <p className="text-white font-medium">partners@amanamarket.com</p>
            </div>
            <p className="text-white/40 text-xs">
              We review all partnership inquiries and respond within 5 business days.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
