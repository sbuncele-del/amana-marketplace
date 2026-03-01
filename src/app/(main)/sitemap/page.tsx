import { Map, ShoppingBag, Store, HelpCircle, Building2, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Sitemap — Amana Marketplace" };

const sections = [
  {
    icon: ShoppingBag,
    title: "Shopping",
    links: [
      { label: "Browse Products", href: "/browse" },
      { label: "Track Your Order", href: "/track" },
      { label: "How Escrow Works", href: "/how-escrow-works" },
      { label: "Buyer Protection", href: "/buyer-protection" },
      { label: "Returns & Refunds", href: "/returns" },
      { label: "Shipping FAQ", href: "/shipping-faq" },
    ],
  },
  {
    icon: Store,
    title: "Selling",
    links: [
      { label: "Start Selling", href: "/dashboard/sell" },
      { label: "Seller Guidelines", href: "/seller-guidelines" },
      { label: "Listing Standards", href: "/listing-standards" },
      { label: "Shipping Guide", href: "/shipping-guide" },
      { label: "Seller Success Stories", href: "/seller-stories" },
      { label: "Seller Dashboard", href: "/dashboard" },
    ],
  },
  {
    icon: HelpCircle,
    title: "Help & Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Dispute Resolution", href: "/dispute-resolution" },
      { label: "Trust & Safety", href: "/trust-safety" },
      { label: "Shipping FAQ", href: "/shipping-faq" },
    ],
  },
  {
    icon: Building2,
    title: "Company",
    links: [
      { label: "About Amana", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press & Media", href: "/press" },
      { label: "Partners", href: "/partners" },
      { label: "Seller Stories", href: "/seller-stories" },
    ],
  },
  {
    icon: FileText,
    title: "Legal",
    links: [
      { label: "Terms of Use", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Escrow Agreement", href: "/escrow-agreement" },
      { label: "Acceptable Use Policy", href: "/acceptable-use" },
      { label: "Returns & Refunds", href: "/returns" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Map className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Navigate Amana</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Site<br />
            <span className="text-[#D4A843]">Map</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            A complete overview of all pages on Amana Marketplace, organized by category.
            Find what you&apos;re looking for quickly.
          </p>
        </div>
      </section>

      {/* Sitemap Grid */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#D4A843]" />
                    </div>
                    <h2 className="text-lg font-extrabold">{section.title}</h2>
                  </div>
                  <ul className="space-y-2.5">
                    {section.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4A843] transition-colors group"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#D4A843] transition-colors" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Links */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-8">Account Pages</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <Link href="/dashboard" className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-600 hover:text-[#D4A843] hover:shadow-md transition-all">
              My Dashboard
            </Link>
            <Link href="/dashboard/sell" className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-600 hover:text-[#D4A843] hover:shadow-md transition-all">
              Sell a Product
            </Link>
            <Link href="/checkout" className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-600 hover:text-[#D4A843] hover:shadow-md transition-all">
              Checkout
            </Link>
            <Link href="/track" className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-600 hover:text-[#D4A843] hover:shadow-md transition-all">
              Track Order
            </Link>
          </div>
        </div>
      </section>

      {/* XML Sitemap note */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            For search engines: The XML sitemap is available at{" "}
            <span className="font-mono text-gray-500">/sitemap.xml</span>
          </p>
        </div>
      </section>
    </div>
  );
}
