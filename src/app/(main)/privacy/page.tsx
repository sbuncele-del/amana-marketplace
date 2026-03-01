import { Shield, Eye, Database, Cookie, UserCheck, Mail, Globe } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Privacy Policy — Amana Marketplace" };

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Your Data, Your Rights</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Privacy<br />
            <span className="text-[#D4A843]">Policy</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Last updated: January 15, 2026. This Privacy Policy explains how Amana Marketplace
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) collects, uses, shares, and protects your personal information.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        {/* 1. Data Collection */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">1. Information We Collect</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Information You Provide</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Account registration details: name, email address, phone number, country</li>
                <li>Seller verification documents: government-issued ID, business registration, tax certificates</li>
                <li>Transaction information: order details, shipping addresses, payment method selection</li>
                <li>Communications: messages to sellers/buyers, support tickets, feedback and reviews</li>
                <li>Profile information: profile photo, bio, store description (for sellers)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Information Collected Automatically</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Device information: browser type, operating system, device model</li>
                <li>Usage data: pages visited, search queries, products viewed, time on page</li>
                <li>Location data: country-level location from IP address (we do not collect precise GPS data)</li>
                <li>Cookies and similar technologies (see our <Link href="/cookies" className="text-[#D4A843] hover:underline">Cookie Policy</Link>)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Information from Third Parties</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Payment processors: transaction confirmation status (not full payment details)</li>
                <li>Identity verification services: document authentication results</li>
                <li>Shipping partners: delivery tracking and confirmation data</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Usage */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">2. How We Use Your Information</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>We use your personal information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Provide, maintain, and improve the Amana Marketplace platform</li>
              <li>Process transactions and manage escrow through our partner Vesicash</li>
              <li>Verify seller identities and maintain marketplace trust and safety</li>
              <li>Facilitate communication between buyers and sellers</li>
              <li>Send transactional notifications (order updates, escrow status, dispute updates)</li>
              <li>Send marketing communications (with your consent; you can opt out at any time)</li>
              <li>Detect and prevent fraud, abuse, and policy violations</li>
              <li>Comply with legal obligations across the jurisdictions we operate in</li>
              <li>Generate anonymized analytics to improve our services</li>
              <li>Calculate customs duties and AfCFTA eligibility for cross-border orders</li>
            </ul>
          </div>
        </section>

        {/* 3. Sharing */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">3. How We Share Your Information</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-3">
            <p>We do not sell your personal information. We share data only in these circumstances:</p>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">With Transaction Parties</h3>
              <p>Buyers see seller store names and locations. Sellers receive buyer shipping addresses for order fulfillment. Both parties see necessary transaction details.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">With Service Providers</h3>
              <p>We share data with Vesicash (escrow), Flutterwave (payments), shipping carriers, cloud infrastructure providers, and customer support tools — only as needed to provide our services.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">For Legal Compliance</h3>
              <p>We may disclose information to comply with applicable laws, legal processes, or enforceable government requests in the jurisdictions where we operate.</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">With Your Consent</h3>
              <p>We will share your information with third parties when you have given explicit consent to do so.</p>
            </div>
          </div>
        </section>

        {/* 4. Cookies */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">4. Cookies</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p>
              We use essential cookies to operate the platform, analytics cookies to understand usage patterns,
              and optional marketing cookies with your consent. For full details, see our{" "}
              <Link href="/cookies" className="text-[#D4A843] hover:underline">Cookie Policy</Link>.
            </p>
          </div>
        </section>

        {/* 5. POPIA Compliance */}
        <section className="bg-[#FAF8F5] rounded-2xl p-6">
          <h2 className="text-xl font-extrabold mb-3">5. POPIA Compliance (South Africa)</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              For users in South Africa, we comply with the Protection of Personal Information Act (POPIA).
              This means:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>We process personal information lawfully and in a reasonable manner</li>
              <li>We collect information for a specific, explicitly defined, and lawful purpose</li>
              <li>We take reasonable technical and organizational measures to protect your data</li>
              <li>You have the right to access, correct, or delete your personal information</li>
              <li>You have the right to object to the processing of your personal information</li>
              <li>You may lodge a complaint with the Information Regulator</li>
            </ul>
            <p className="mt-2">
              Our Information Officer can be reached at <strong>privacy@amanamarket.com</strong>.
            </p>
          </div>
        </section>

        {/* 6. NDPR Compliance */}
        <section className="bg-[#FAF8F5] rounded-2xl p-6">
          <h2 className="text-xl font-extrabold mb-3">6. NDPR Compliance (Nigeria)</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              For users in Nigeria, we comply with the Nigeria Data Protection Regulation (NDPR) and the
              Nigeria Data Protection Act 2023. This includes:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Obtaining consent before collecting personal data</li>
              <li>Providing clear notice about data collection purposes</li>
              <li>Conducting Data Protection Impact Assessments for high-risk processing</li>
              <li>Appointing a Data Protection Officer</li>
              <li>Filing annual audit reports with the Nigeria Data Protection Commission (NDPC)</li>
              <li>Ensuring any cross-border data transfers meet NDPR adequacy requirements</li>
            </ul>
            <p className="mt-2">
              Our Data Protection Officer can be reached at <strong>dpo@amanamarket.com</strong>.
            </p>
          </div>
        </section>

        {/* 7. Data Retention */}
        <section>
          <h2 className="text-xl font-extrabold mb-3">7. Data Retention</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Account data:</strong> Retained while your account is active, plus 2 years after deletion</li>
              <li><strong>Transaction records:</strong> Retained for 7 years for tax and regulatory compliance</li>
              <li><strong>Verification documents:</strong> Retained for 5 years after account closure</li>
              <li><strong>Communication logs:</strong> Retained for 3 years</li>
              <li><strong>Analytics data:</strong> Anonymized after 24 months</li>
            </ul>
          </div>
        </section>

        {/* 8. User Rights */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">8. Your Rights</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing of your data for marketing purposes</li>
              <li><strong>Withdrawal of consent:</strong> Withdraw consent at any time for optional data processing</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at <strong>privacy@amanamarket.com</strong> or
              through your account settings.
            </p>
          </div>
        </section>

        {/* 9. Contact */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">9. Contact Us</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-6">
            <p className="mb-2"><strong>Amana Marketplace Ltd.</strong></p>
            <p>Data Protection & Privacy</p>
            <p>P.O. Box 12345, Nairobi, Kenya</p>
            <p className="mt-2">Email: <strong>privacy@amanamarket.com</strong></p>
            <p>Phone: +254 xxx xxx xxx</p>
            <p className="mt-4 text-gray-400">
              This Privacy Policy may be updated from time to time. We will notify you of material changes
              via email or through a notice on the platform.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
