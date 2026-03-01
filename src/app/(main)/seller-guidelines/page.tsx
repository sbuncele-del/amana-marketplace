import { BadgeCheck, Camera, MessageSquare, ShieldCheck, Star, AlertTriangle, Package, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Seller Guidelines — Amana Marketplace" };

const tiers = [
  {
    name: "Basic",
    badge: "🥉",
    requirements: [
      "Valid government-issued ID",
      "Phone number verification",
      "Email verification",
      "Profile completion",
    ],
    benefits: [
      "List up to 20 products",
      "Standard escrow processing",
      "Community support",
      "Basic analytics",
    ],
  },
  {
    name: "Standard",
    badge: "🥈",
    requirements: [
      "Everything in Basic",
      "Business registration document",
      "Bank account verification",
      "Minimum 10 completed sales",
      "4.0+ average rating",
    ],
    benefits: [
      "List up to 200 products",
      "Priority escrow processing (faster payouts)",
      "Email support with 24-hour response",
      "Featured in category listings",
      "Advanced analytics dashboard",
    ],
  },
  {
    name: "Premium",
    badge: "🥇",
    requirements: [
      "Everything in Standard",
      "Tax compliance certificate",
      "Quality certification (where applicable)",
      "Minimum 50 completed sales",
      "4.5+ average rating",
      "Less than 3% dispute rate",
    ],
    benefits: [
      "Unlimited product listings",
      "Express escrow processing (same-day payouts)",
      "Dedicated account manager",
      "Homepage feature eligibility",
      "Cross-border selling support",
      "Reduced commission rates",
      "Priority dispute resolution",
    ],
  },
];

const listingStandards = [
  { icon: Camera, title: "Product Photography", desc: "Minimum 3 photos per listing. Main image must be 1000×1000px minimum with a white or neutral background. No text overlays, watermarks, or collages on the main image." },
  { icon: Package, title: "Accurate Descriptions", desc: "Include material, dimensions, weight, color, origin country, and condition. Describe any imperfections honestly. Use the structured fields provided — don't put specs in the title." },
  { icon: DollarSign, title: "Transparent Pricing", desc: "All prices must be in the listed currency with shipping costs clearly stated. No bait-and-switch pricing. Volume discounts must be clearly communicated." },
  { icon: Star, title: "Quality Standards", desc: "Products must match their listings exactly. Items must be safe, functional, and meet the quality expectations set by your descriptions and images." },
];

const prohibitedItems = [
  "Counterfeit or replica goods",
  "Weapons, ammunition, or explosives",
  "Illegal drugs or controlled substances",
  "Stolen property",
  "Adult content or services",
  "Live animals (except with proper licensing)",
  "Products violating intellectual property rights",
  "Hazardous materials without proper certification",
  "Items prohibited by law in the seller's or buyer's country",
];

const communicationPolicies = [
  { title: "Response Time", desc: "Respond to buyer inquiries within 24 hours during business days. Premium sellers are expected to respond within 12 hours." },
  { title: "Professional Conduct", desc: "All communication must be professional and respectful. No harassment, discrimination, or abusive language. No sharing of personal contact details to arrange off-platform transactions." },
  { title: "Accurate Information", desc: "Provide truthful information about products, shipping timelines, and store policies. Misleading buyers is a violation that can result in account suspension." },
  { title: "Dispute Cooperation", desc: "If a dispute is opened, respond promptly with evidence. Failure to respond within 48 hours may result in an automatic ruling in the buyer's favor." },
];

export default function SellerGuidelinesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <BadgeCheck className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Seller Handbook</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Seller<br />
            <span className="text-[#D4A843]">Guidelines</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Everything you need to know to succeed as a seller on Amana. From verification requirements
            to listing standards and communication policies.
          </p>
        </div>
      </section>

      {/* Verification Tiers */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-4">Verification Tiers</h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Higher verification tiers unlock more features and build greater buyer trust. Progress through tiers
            by meeting requirements and maintaining quality.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div key={tier.name} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-3">{tier.badge}</div>
                <h3 className="text-xl font-bold mb-4">{tier.name} Seller</h3>
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Requirements</h4>
                  <ul className="space-y-1.5">
                    {tier.requirements.map((r) => (
                      <li key={r} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-[#D4A843] mt-1">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Benefits</h4>
                  <ul className="space-y-1.5">
                    {tier.benefits.map((b) => (
                      <li key={b} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-[#2E7D32] mt-1">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listing Standards */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Listing Standards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {listingStandards.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#D4A843]" />
                  </div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link href="/listing-standards" className="text-[#D4A843] font-medium text-sm hover:underline">
              Read detailed listing standards →
            </Link>
          </div>
        </div>
      </section>

      {/* Communication Policies */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Communication Policies</h2>
          </div>
          <div className="space-y-4">
            {communicationPolicies.map((p) => (
              <div key={p.title} className="border border-gray-100 rounded-xl p-6">
                <h3 className="font-bold mb-1">{p.title}</h3>
                <p className="text-gray-600 text-sm">{p.desc}</p>
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
            <p className="text-gray-600 text-sm mb-4">
              The following items are strictly prohibited on Amana Marketplace. Listing them will result
              in immediate removal and potential account suspension:
            </p>
            <ul className="space-y-2">
              {prohibitedItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-red-400 mt-0.5">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Ready to Start Selling?</h2>
          <p className="text-white/60 mb-8">
            Join thousands of verified sellers across 34+ African countries on Amana Marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/sell">
              <Button size="lg">Create Your Store</Button>
            </Link>
            <Link href="/shipping-guide">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Shipping Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
