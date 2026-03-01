import { Newspaper, Download, Mail, ExternalLink, Calendar, Quote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Press & Media — Amana Marketplace" };

const pressReleases = [
  {
    date: "January 15, 2026",
    title: "Amana Marketplace Launches with Built-In Escrow Protection for Pan-African Trade",
    summary: "Africa's first cross-border e-commerce platform with integrated Vesicash escrow protection goes live, serving 34+ countries with 15+ payment methods.",
  },
  {
    date: "December 5, 2025",
    title: "Amana Partners with Vesicash to Secure Every Cross-Border Transaction",
    summary: "Strategic partnership announced between Amana Marketplace and Vesicash, bringing licensed escrow services to intra-African e-commerce for the first time.",
  },
  {
    date: "November 20, 2025",
    title: "Amana Announces AfCFTA-Compliant Duty Calculator for Seamless Cross-Border Shopping",
    summary: "New feature automatically calculates customs duties and identifies AfCFTA-eligible products for reduced or zero-duty treatment across member states.",
  },
  {
    date: "October 8, 2025",
    title: "Amana Marketplace Onboards 500 Verified Sellers Across 18 African Countries",
    summary: "Ahead of its public launch, Amana reports milestone of 500 verified sellers spanning fashion, gemstones, food & beverages, beauty, and crafts categories.",
  },
  {
    date: "September 1, 2025",
    title: "Amana Raises Seed Funding to Build Africa's Trusted Marketplace",
    summary: "Amana secures seed funding to develop its escrow-protected cross-border marketplace, with plans to serve the $3.4 trillion intra-African trade opportunity.",
  },
];

const coverage = [
  { outlet: "TechCrunch Africa", title: "Meet Amana, the marketplace betting on trust to unlock African e-commerce", date: "January 2026" },
  { outlet: "Disrupt Africa", title: "Kenyan startup Amana launches escrow-first marketplace for AfCFTA era", date: "January 2026" },
  { outlet: "Business Daily Africa", title: "How escrow protection is changing the game for African online sellers", date: "December 2025" },
  { outlet: "Quartz Africa", title: "The $3.4T problem this African startup is solving with escrow", date: "November 2025" },
  { outlet: "Ventures Africa", title: "Amana Marketplace: Building trust infrastructure for pan-African trade", date: "October 2025" },
];

const brandGuidelines = [
  { item: "Logo (Gold on Dark)", format: "SVG, PNG" },
  { item: "Logo (Dark on Light)", format: "SVG, PNG" },
  { item: "Logo Mark (Icon Only)", format: "SVG, PNG" },
  { item: "Brand Colors", format: "Gold #D4A843, Dark #1A1A2E, Green #2E7D32" },
  { item: "Typography", format: "Inter (headings), system sans-serif (body)" },
  { item: "Product Screenshots", format: "PNG, 1920×1080" },
];

export default function PressPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Newspaper className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Newsroom</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Press &<br />
            <span className="text-[#D4A843]">Media</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            The latest news from Amana Marketplace. For press inquiries, media assets, 
            and interview requests, find everything you need here.
          </p>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold mb-8">Press Releases</h2>
          <div className="space-y-6">
            {pressReleases.map((pr) => (
              <div key={pr.title} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {pr.date}
                </div>
                <h3 className="font-bold text-lg mb-2">{pr.title}</h3>
                <p className="text-gray-600 text-sm">{pr.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notable Coverage */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold mb-8">Notable Coverage</h2>
          <div className="space-y-4">
            {coverage.map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[#D4A843] font-medium mb-1">{c.outlet}</p>
                  <h3 className="font-bold text-sm mb-1">{c.title}</h3>
                  <p className="text-xs text-gray-400">{c.date}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Download className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Media Kit & Brand Assets</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Download our official brand assets for editorial use. Please follow our brand guidelines when
            using the Amana name and logo.
          </p>
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {brandGuidelines.map((b) => (
                  <tr key={b.item} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-5 font-medium text-gray-900">{b.item}</td>
                    <td className="py-3 px-5 text-gray-500">{b.format}</td>
                    <td className="py-3 px-5 text-right">
                      <span className="text-[#D4A843] text-xs font-medium cursor-pointer hover:underline">Download</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Full Media Kit (ZIP)
            </Button>
          </div>
        </div>
      </section>

      {/* Brand Guidelines */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold mb-6">Brand Guidelines</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 text-sm text-gray-600">
            <p>
              <strong className="text-gray-900">Name:</strong> Always write &ldquo;Amana&rdquo; with a capital A. The full name is &ldquo;Amana Marketplace.&rdquo; Never abbreviate to &ldquo;AM&rdquo; or &ldquo;Amana Mkt.&rdquo;
            </p>
            <p>
              <strong className="text-gray-900">Description:</strong> Use &ldquo;Africa&apos;s trusted cross-border marketplace with built-in escrow protection&rdquo; as the standard one-line description.
            </p>
            <p>
              <strong className="text-gray-900">Logo Usage:</strong> Maintain clear space equal to the height of the &ldquo;A&rdquo; mark around the logo. Do not rotate, stretch, recolor, or add effects to the logo.
            </p>
            <p>
              <strong className="text-gray-900">Colors:</strong> Gold (#D4A843) is the primary brand color. Dark (#1A1A2E) is used for text and backgrounds. Green (#2E7D32) is used for success states and secondary CTAs.
            </p>
          </div>
        </div>
      </section>

      {/* Press Contact */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] rounded-2xl p-8 md:p-12 text-center">
            <Mail className="w-8 h-8 text-[#D4A843] mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-white mb-3">Press Inquiries</h2>
            <p className="text-white/60 mb-6 max-w-xl mx-auto">
              For interview requests, media inquiries, or additional information about Amana Marketplace,
              please contact our communications team.
            </p>
            <div className="bg-white/10 rounded-xl p-4 inline-block mb-6">
              <p className="text-white font-medium">press@amanamarket.com</p>
            </div>
            <p className="text-white/40 text-sm">
              We aim to respond to all press inquiries within 24 hours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
