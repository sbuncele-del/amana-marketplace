import Link from "next/link";
import {
  Shield,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Smartphone,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const categories = [
  { name: "Gemstones", slug: "gemstones" },
  { name: "Fashion", slug: "fashion" },
  { name: "Agriculture", slug: "agriculture" },
  { name: "Art & Craft", slug: "art-craft" },
  { name: "Beauty", slug: "beauty" },
  { name: "Food & Spice", slug: "food-spice" },
  { name: "Textiles", slug: "textiles" },
  { name: "Minerals", slug: "minerals" },
  { name: "Leather", slug: "leather" },
  { name: "Electronics", slug: "electronics" },
  { name: "Home & Living", slug: "home-living" },
];

const shopLinks = [
  { label: "Featured Products", href: "/browse?featured=true" },
  { label: "New Arrivals", href: "/browse?sort=newest" },
  { label: "Best Sellers", href: "/browse?sort=popular" },
  { label: "Browse by Country", href: "/browse?view=countries" },
  { label: "AfCFTA Deals", href: "/browse?afcfta=true" },
  { label: "Daily Deals", href: "/browse?deals=true" },
];

const sellerLinks = [
  { label: "Seller Hub", href: "/dashboard" },
  { label: "Start Selling", href: "/register?role=seller" },
  { label: "Seller Guidelines", href: "/seller-guidelines" },
  { label: "Product Listing Standards", href: "/listing-standards" },
  { label: "Shipping Guide", href: "/shipping-guide" },
  { label: "Success Stories", href: "/seller-stories" },
];

const helpLinks = [
  { label: "Help Centre", href: "/help" },
  { label: "How Escrow Works", href: "/how-escrow-works" },
  { label: "Buyer Protection", href: "/buyer-protection" },
  { label: "Dispute Resolution", href: "/dispute-resolution" },
  { label: "Shipping & Delivery", href: "/shipping-faq" },
  { label: "Track Your Order", href: "/track" },
];

const companyLinks = [
  { label: "About Amana", href: "/about" },
  { label: "Trust & Safety", href: "/trust-safety" },
  { label: "Careers", href: "/careers" },
  { label: "Press & Media", href: "/press" },
  { label: "Partner With Us", href: "/partners" },
  { label: "Contact Us", href: "/contact" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Returns & Refunds", href: "/returns" },
  { label: "Escrow Agreement", href: "/escrow-agreement" },
  { label: "Acceptable Use", href: "/acceptable-use" },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/amanamarket", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com/amanamarket", label: "X (Twitter)" },
  { icon: Instagram, href: "https://instagram.com/amanamarket", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@amanamarket", label: "YouTube" },
  { icon: Linkedin, href: "https://linkedin.com/company/amanamarket", label: "LinkedIn" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-4 text-white/90 uppercase tracking-wider">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-white/45 hover:text-white/80 transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-white">
      {/* Category Strip */}
      <div className="border-b border-white/5 bg-[#1A1A2E]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs text-white/40 font-medium whitespace-nowrap mr-1">
              Shop by:
            </span>
            {categories.map((cat, i) => (
              <span key={cat.slug} className="flex items-center gap-2">
                <Link
                  href={`/browse?category=${cat.slug}`}
                  className="text-xs text-white/50 hover:text-[#D4A843] transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
                {i < categories.length - 1 && (
                  <span className="text-white/15">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#2E7D32] flex items-center justify-center text-white font-black text-sm">
                A
              </div>
              <span className="text-lg font-bold">amana</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              Africa&apos;s trusted cross-border marketplace. Trade across 54
              countries with built-in escrow protection.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#D4A843] mb-6">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-semibold">Every Transaction Protected</span>
            </div>

            {/* App Download Badges */}
            <div className="space-y-2 mb-6">
              <p className="text-xs text-white/40 font-medium">Get the app</p>
              <div className="flex flex-col gap-2">
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors w-fit"
                >
                  <Smartphone className="w-4 h-4 text-white/60" />
                  <div className="text-left">
                    <div className="text-[9px] text-white/40 leading-none">
                      Download on the
                    </div>
                    <div className="text-xs font-semibold text-white/80 leading-tight">
                      App Store
                    </div>
                  </div>
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors w-fit"
                >
                  <Smartphone className="w-4 h-4 text-white/60" />
                  <div className="text-left">
                    <div className="text-[9px] text-white/40 leading-none">
                      Get it on
                    </div>
                    <div className="text-xs font-semibold text-white/80 leading-tight">
                      Google Play
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-white/50" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Link Columns */}
          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn title="Sell" links={sellerLinks} />
          <FooterColumn title="Help" links={helpLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Policies" links={policyLinks} />
        </div>
      </div>

      {/* Contact Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs text-white/30">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>support@amana.market</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>+254 700 AMANA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Nairobi, Kenya · Lagos, Nigeria · Accra, Ghana</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-4 text-[10px] text-white/20 font-medium">
            <span>We accept:</span>
            <span className="text-white/30">Visa</span>
            <span className="text-white/15">•</span>
            <span className="text-white/30">Mastercard</span>
            <span className="text-white/15">•</span>
            <span className="text-white/30">M-Pesa</span>
            <span className="text-white/15">•</span>
            <span className="text-white/30">MTN MoMo</span>
            <span className="text-white/15">•</span>
            <span className="text-white/30">Airtel Money</span>
            <span className="text-white/15">•</span>
            <span className="text-white/30">Bank Transfer</span>
            <span className="text-white/15">•</span>
            <span className="text-white/30">Flutterwave</span>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/25">
            &copy; {new Date().getFullYear()} Amana Marketplace Ltd. All rights
            reserved. Built for Africa, by Africa.
          </p>
          <div className="flex items-center gap-5 text-[11px] text-white/25">
            <Link href="/privacy" className="hover:text-white/50 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white/50 transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-white/50 transition-colors">
              Cookies
            </Link>
            <Link href="/returns" className="hover:text-white/50 transition-colors">
              Returns
            </Link>
            <Link href="/sitemap" className="hover:text-white/50 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
