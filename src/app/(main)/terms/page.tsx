import { FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const metadata = { alternates: { canonical: "/terms" }, title: "Terms of Use — Plentovo" };

export default function TermsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#171B20] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <FileText className="w-4 h-4 text-[#DA292B]" />
            <span className="text-sm text-white/80">Legal Agreement</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Terms of<br />
            <span className="text-[#DA292B]">Use</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Last updated: January 15, 2026. Please read these Terms of Use carefully before using
            Plentovo. By accessing or using our platform, you agree to be bound by these terms.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
        <section>
          <h2 className="text-xl font-extrabold mb-3">1. Acceptance of Terms</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              By creating an account, browsing, or making any transaction on Plentovo (&ldquo;the Platform&rdquo;),
              you agree to these Terms of Use, our <Link href="/privacy" className="text-[#DA292B] hover:underline">Privacy Policy</Link>,
              our <Link href="/contact" className="text-[#DA292B] hover:underline">Customer care</Link>,
              and our <Link href="/acceptable-use" className="text-[#DA292B] hover:underline">Acceptable Use Policy</Link>.
              If you do not agree to any of these terms, do not use the Platform.
            </p>
            <p>
              You must be at least 18 years old to use Plentovo. By using the Platform, you represent
              and warrant that you are at least 18 years of age and have the legal capacity to enter into binding agreements.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">2. Account Responsibilities</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>When you create an account on Plentovo, you agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Provide accurate, current, and complete registration information</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Not create more than one account per individual or entity</li>
              <li>Not transfer your account to another person without our written consent</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, provide false
              information, or engage in fraudulent activity.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">3. Buyer Obligations</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>As a buyer on Plentovo, you agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Make payments using the options displayed at checkout</li>
              <li>Review product listings carefully before purchasing, including descriptions, images, and seller ratings</li>
              <li>Provide an accurate shipping address and contact information for delivery</li>
              <li>Inspect delivered products within the 72-hour inspection window</li>
              <li>Confirm receipt or open a dispute in good faith with truthful evidence</li>
              <li>Not abuse the dispute system or make fraudulent claims</li>
              <li>Comply with your country&apos;s import regulations and customs requirements</li>
              <li>Leave honest, factual reviews and ratings for completed transactions</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">4. Seller Obligations</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>As a seller on Plentovo, you agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Complete the seller verification process honestly and maintain accurate business information</li>
              <li>List products with accurate descriptions, images, and pricing as per our <Link href="/listing-standards" className="text-[#DA292B] hover:underline">Listing Standards</Link></li>
              <li>Ship orders within the stated preparation time after payment confirmation</li>
              <li>Provide valid tracking information for all shipments</li>
              <li>Respond to buyer inquiries within 24 hours during business days</li>
              <li>Cooperate in dispute resolution by providing evidence within 48 hours</li>
              <li>Not sell prohibited items as defined in our <Link href="/acceptable-use" className="text-[#DA292B] hover:underline">Acceptable Use Policy</Link></li>
              <li>Comply with all applicable laws in your jurisdiction, including export regulations and tax obligations</li>
              <li>Accept returns and process refunds in accordance with our <Link href="/returns" className="text-[#DA292B] hover:underline">Returns Policy</Link></li>
              <li>Not direct buyers to unauthorised payment channels</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border p-6"><h2 className="text-xl font-bold">5. Payments</h2><p className="mt-3 text-sm text-gray-600">Use the payment options displayed at checkout. Review the order total and delivery charges before confirming payment. For order or payment questions, contact customer care through our contact page.</p></section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">6. Prohibited Conduct</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>You may not use Plentovo to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Engage in fraud, deception, or misrepresentation</li>
              <li>List or sell counterfeit, stolen, or illegal products</li>
              <li>Harass, threaten, or discriminate against other users</li>
              <li>Manipulate product reviews, ratings, or search results</li>
              <li>Request unauthorised payments outside checkout</li>
              <li>Use the Platform for money laundering or terrorist financing</li>
              <li>Scrape, data mine, or reverse engineer the Platform</li>
              <li>Impersonate another person or entity</li>
              <li>Upload malicious software or interfere with Platform operations</li>
            </ul>
            <p>
              See our <Link href="/acceptable-use" className="text-[#DA292B] hover:underline">Acceptable Use Policy</Link> for a complete list.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">7. Intellectual Property Rights</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              The Plentovo platform, including its design, software, logos, and content, is the
              intellectual property of Plentovo You may not reproduce, distribute, or create
              derivative works without our written permission.
            </p>
            <p>
              By listing products on Plentovo, sellers grant us a non-exclusive, royalty-free license to display
              their product images, descriptions, and store information on the Platform and in marketing materials.
            </p>
            <p>
              If you believe your intellectual property is being infringed on Plentovo, report it to
              <a href="/contact" className="font-semibold underline">our contact form</a> with the relevant details and we will investigate promptly.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">8. Limitation of Liability</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              Plentovo is a platform that facilitates transactions between buyers and sellers.
              We are not a party to the sale itself. To the maximum extent permitted by law:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>We do not guarantee the quality, safety, or legality of listed items</li>
              <li>We do not guarantee the truth or accuracy of product listings</li>
              <li>We do not guarantee that sellers will complete transactions</li>
              <li>Our total liability for any claim arising from use of the Platform shall not exceed the
                fees paid by you to Plentovo in the 12 months preceding the claim</li>
              <li>We are not liable for indirect, incidental, special, or consequential damages</li>
            </ul>
            <p>
              Contact customer care if you have concerns about a transaction
              associated with online commerce.
            </p>
          </div>
        </section>

        <section className="bg-[#FAF8F5] rounded-2xl p-6">
          <h2 className="text-xl font-extrabold mb-3">9. Governing Law & Jurisdiction</h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              These Terms of Use shall be governed by and construed in accordance with the laws of the
              Republic of South Africa, without regard to its conflict of law provisions.
            </p>
            <p>
              Please contact customer care about a dispute. Nothing in these terms limits rights or remedies available under applicable consumer protection law.
            </p>
            <p>
              For users in countries with mandatory consumer protection laws, those local protections
              apply in addition to these terms.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">10. Changes to These Terms</h2>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p>
              We may update these Terms of Use from time to time. We will notify you of material changes
              at least 30 days before they take effect through email or a notice on the Platform. Your
              continued use of Plentovo after the effective date constitutes acceptance of the updated terms.
            </p>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#DA292B] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-500">
              <p>
                Questions about these Terms? Contact our legal team at <a href="/contact" className="font-semibold underline">our contact form</a>.
              </p>
              <p className="mt-2">
                See also: <Link href="/privacy" className="text-[#DA292B] hover:underline">Privacy Policy</Link> · <Link href="/contact" className="text-[#DA292B] hover:underline">Customer care</Link> · <Link href="/acceptable-use" className="text-[#DA292B] hover:underline">Acceptable Use Policy</Link> · <Link href="/cookies" className="text-[#DA292B] hover:underline">Cookie Policy</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
