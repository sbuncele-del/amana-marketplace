import { Shield, BadgeCheck, Lock, Eye, AlertTriangle, Flag, UserCheck, Server } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Trust & Safety — Amana Marketplace" };

const verificationLevels = [
  {
    level: "Identity Verification",
    description: "Every seller must verify their identity with a government-issued ID. We use automated document verification combined with manual review for accuracy.",
    applied: "All sellers",
  },
  {
    level: "Business Verification",
    description: "Standard and Premium sellers must provide business registration documents. We verify these against national registries where possible.",
    applied: "Standard & Premium sellers",
  },
  {
    level: "Quality Certification",
    description: "Premium sellers submit product quality certificates, gemological reports, food safety certifications, or other relevant documentation.",
    applied: "Premium sellers",
  },
  {
    level: "Tax Compliance",
    description: "Premium sellers demonstrate tax compliance with certificates or registration numbers. This is verified against local tax authorities.",
    applied: "Premium sellers",
  },
];

const fraudPrevention = [
  { icon: UserCheck, title: "Seller Screening", desc: "Multi-step verification process before any seller can list products. Ongoing monitoring of seller activity and buyer feedback." },
  { icon: Lock, title: "Escrow Protection", desc: "100% of transactions are escrow-protected. Funds are never at risk — they remain in regulated trust accounts until orders are verified." },
  { icon: Eye, title: "Listing Moderation", desc: "AI-powered and human review of all listings. Counterfeit, misrepresented, and prohibited items are detected and removed." },
  { icon: Server, title: "Transaction Monitoring", desc: "Real-time monitoring for suspicious patterns: unusual transaction volumes, rapid account changes, or geographical anomalies." },
  { icon: Shield, title: "Buyer Verification", desc: "Account verification for buyers making high-value purchases. Multi-factor authentication available on all accounts." },
  { icon: Flag, title: "Community Reporting", desc: "Any user can report suspicious listings, sellers, or activities. Reports are reviewed within 24 hours." },
];

const securePayments = [
  "PCI-DSS Level 1 compliant payment processing",
  "256-bit SSL/TLS encryption on all transactions",
  "Tokenized card storage — we never store raw card numbers",
  "3D Secure authentication for card payments",
  "Multi-factor authentication for account access",
  "Regular security audits by independent third parties",
  "Fraud detection algorithms on all payment methods",
];

const dataProtection = [
  { title: "Encryption at Rest", desc: "All personal data is encrypted using AES-256 encryption when stored in our databases." },
  { title: "Encryption in Transit", desc: "All data transmitted between your device and our servers uses TLS 1.3 encryption." },
  { title: "Access Controls", desc: "Strict role-based access controls ensure only authorized personnel can access user data." },
  { title: "Data Minimization", desc: "We collect only the data necessary to provide our services. Unnecessary data is not collected or is anonymized." },
  { title: "Regular Audits", desc: "Annual security audits and penetration testing by certified third-party security firms." },
  { title: "POPIA & NDPR Compliance", desc: "Full compliance with South Africa's Protection of Personal Information Act and Nigeria's Data Protection Regulation." },
];

const bannedActivities = [
  "Creating fake accounts or providing false identity information",
  "Listing counterfeit, stolen, or misrepresented products",
  "Manipulating reviews or ratings",
  "Circumventing escrow by arranging off-platform payments",
  "Harassment, discrimination, or abuse of other users",
  "Price gouging or deceptive pricing practices",
  "Using the platform for money laundering or terrorist financing",
  "Scraping, data mining, or unauthorized automated access",
  "Interfering with platform operations or other users' accounts",
];

export default function TrustSafetyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Your Safety Matters</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Trust &<br />
            <span className="text-[#D4A843]">Safety</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Amana is built on trust. From verified sellers and escrow payments to fraud prevention and data
            protection — we invest heavily in keeping our marketplace safe for everyone.
          </p>
        </div>
      </section>

      {/* Verification System */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <BadgeCheck className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Verification System</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Our multi-layered verification process ensures that every seller on Amana is who they claim to be.
            Buyers can shop with confidence knowing that all sellers have been vetted.
          </p>
          <div className="space-y-4">
            {verificationLevels.map((v) => (
              <div key={v.level} className="border border-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">{v.level}</h3>
                  <span className="text-xs bg-[#D4A843]/10 text-[#D4A843] px-2.5 py-0.5 rounded-full">{v.applied}</span>
                </div>
                <p className="text-gray-600 text-sm">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fraud Prevention */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Fraud Prevention</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fraudPrevention.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#D4A843]" />
                  </div>
                  <h3 className="font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Secure Payments */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Lock className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Secure Payments</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <ul className="space-y-3">
              {securePayments.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-[#2E7D32]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Server className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Data Protection</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {dataProtection.map((d) => (
              <div key={d.title} className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-bold text-sm mb-1">{d.title}</h3>
                <p className="text-gray-600 text-sm">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banned Activities */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-extrabold">Banned Activities</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-gray-600 text-sm mb-4">
              The following activities are strictly prohibited and will result in immediate account suspension
              or permanent ban:
            </p>
            <ul className="space-y-2">
              {bannedActivities.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-red-400 mt-0.5">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Reporting */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Flag className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Reporting Abuse</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-gray-600 text-sm mb-4">
              If you encounter suspicious listings, fraudulent behavior, or policy violations:
            </p>
            <ol className="space-y-3 text-sm text-gray-600 list-decimal list-inside">
              <li>Click the <strong>&ldquo;Report&rdquo;</strong> button on any listing, seller profile, or message</li>
              <li>Select the reason for your report from the provided categories</li>
              <li>Add any additional details and evidence (screenshots, order IDs)</li>
              <li>Our Trust & Safety team will review within <strong>24 hours</strong></li>
              <li>You&apos;ll receive a notification when action has been taken</li>
            </ol>
            <p className="text-sm text-gray-500 mt-4">
              For urgent safety concerns, email us directly at{" "}
              <strong>safety@amanamarket.com</strong>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Trade With Confidence</h2>
          <p className="text-white/60 mb-8">
            Amana&apos;s Trust & Safety measures are designed to protect every member of our marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg">Start Shopping Safely</Button>
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
