import { Shield, Lock, Scale, DollarSign, AlertTriangle, FileText, Handshake } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Escrow Agreement — Amana Marketplace" };

export default function EscrowAgreementPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Powered by Vesicash</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Escrow<br />
            <span className="text-[#D4A843]">Agreement</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Last updated: January 15, 2026. This Escrow Agreement governs the escrow services provided
            for all transactions on Amana Marketplace through our partnership with Vesicash.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        {/* Vesicash Partnership */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Handshake className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">1. Vesicash Partnership</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              Amana Marketplace partners with Vesicash, a licensed escrow service provider, to hold and
              manage transaction funds on behalf of buyers and sellers. Vesicash operates under applicable
              financial regulations and maintains funds in regulated trust accounts separate from operational funds.
            </p>
            <p>
              By using Amana Marketplace, you agree to the terms of this Escrow Agreement and acknowledge
              that Vesicash acts as a neutral third party in the escrow process. Vesicash is not a party
              to the sale between buyer and seller — it solely holds and disburses funds according to the
              conditions set forth in this agreement.
            </p>
            <p>
              The escrow service is provided automatically for all transactions on Amana Marketplace.
              There is no opt-out from escrow protection — this is a fundamental feature of the Platform
              designed to protect all parties.
            </p>
          </div>
        </section>

        {/* Fund Holding */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">2. Fund Holding</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>When a buyer completes a purchase on Amana Marketplace:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The full transaction amount (product price + shipping costs) is transferred to a Vesicash escrow account</li>
              <li>Funds are held in a regulated trust account at a licensed commercial bank</li>
              <li>Escrow funds are segregated from Amana&apos;s and Vesicash&apos;s operational accounts</li>
              <li>Neither Amana nor Vesicash may use escrow funds for their own purposes</li>
              <li>The seller is notified that funds are in escrow and can proceed with order fulfillment</li>
              <li>Both buyer and seller can view the escrow status in their respective dashboards at all times</li>
            </ul>
            <p>
              Funds are held in the transaction currency. For cross-border transactions, currency conversion
              occurs at the point of disbursement using the prevailing exchange rate at that time.
            </p>
          </div>
        </section>

        {/* Release Conditions */}
        <section className="bg-[#FAF8F5] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">3. Release Conditions</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-3">
            <p><strong className="text-gray-900">Funds are released to the seller when:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The buyer explicitly confirms satisfaction with the delivered order through the Platform</li>
              <li>The 72-hour inspection window expires after confirmed delivery without the buyer opening a dispute</li>
              <li>A dispute is resolved in the seller&apos;s favor by the Amana dispute resolution team</li>
              <li>A partial refund is agreed/determined — the remaining amount is released to the seller</li>
            </ul>

            <p className="mt-4"><strong className="text-gray-900">Funds are returned to the buyer when:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The seller fails to ship within the agreed timeframe (typically 5–7 business days after escrow confirmation)</li>
              <li>A dispute is resolved in the buyer&apos;s favor with a full refund determination</li>
              <li>The seller cancels the order before shipment</li>
              <li>A partial refund is agreed/determined — the partial amount is returned to the buyer</li>
            </ul>

            <p className="mt-4"><strong className="text-gray-900">Automatic release:</strong></p>
            <p>
              If the buyer does not confirm receipt or open a dispute within 72 hours of confirmed delivery
              (as determined by carrier tracking data), the funds are automatically released to the seller.
              This automatic release mechanism protects sellers from indefinite fund holds.
            </p>
          </div>
        </section>

        {/* Dispute Triggers */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">4. Dispute Triggers & Escrow Holds</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              When a dispute is opened, the escrow hold is extended until the dispute is resolved.
              A dispute can be triggered by:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Buyer reports product not as described</li>
              <li>Buyer reports product damaged in transit</li>
              <li>Buyer reports wrong item delivered</li>
              <li>Buyer reports missing items from order</li>
              <li>Buyer reports product not delivered (despite tracking showing delivery)</li>
              <li>Seller reports suspicious buyer behavior</li>
            </ul>
            <p>
              During a dispute, funds remain securely in escrow. Neither party can access the funds until
              the dispute is resolved. The dispute resolution process follows the procedures described in our{" "}
              <Link href="/dispute-resolution" className="text-[#D4A843] hover:underline">Dispute Resolution</Link> page.
            </p>
            <p>
              Resolution timeline: Most disputes are resolved within 3–5 business days. Complex cases
              involving cross-border returns or high-value items may take up to 10 business days.
            </p>
          </div>
        </section>

        {/* Fee Structure */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">5. Fee Structure</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              The escrow service fee is included in Amana Marketplace&apos;s standard commission. There are
              no additional escrow fees charged to either buyers or sellers.
            </p>
            <div className="bg-gray-50 rounded-xl p-5 mt-3">
              <h3 className="font-bold text-gray-900 text-sm mb-2">Fee Breakdown</h3>
              <ul className="space-y-2">
                <li className="flex justify-between border-b border-gray-100 pb-2">
                  <span>Buyer escrow fee</span>
                  <span className="font-medium text-[#2E7D32]">$0 (included in product price)</span>
                </li>
                <li className="flex justify-between border-b border-gray-100 pb-2">
                  <span>Seller commission (includes escrow)</span>
                  <span className="font-medium text-gray-900">5–8% per transaction</span>
                </li>
                <li className="flex justify-between border-b border-gray-100 pb-2">
                  <span>Currency conversion</span>
                  <span className="font-medium text-gray-900">1.5% markup on mid-market rate</span>
                </li>
                <li className="flex justify-between">
                  <span>Dispute filing</span>
                  <span className="font-medium text-[#2E7D32]">$0 (free for both parties)</span>
                </li>
              </ul>
            </div>
            <p className="mt-2">
              Premium sellers may qualify for reduced commission rates. See{" "}
              <Link href="/seller-guidelines" className="text-[#D4A843] hover:underline">Seller Guidelines</Link> for tier details.
            </p>
          </div>
        </section>

        {/* Liability */}
        <section className="bg-[#FAF8F5] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">6. Liability</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              <strong className="text-gray-900">Amana&apos;s Role:</strong> Amana Marketplace operates the platform
              and facilitates the escrow process. Amana is responsible for the dispute resolution process and
              for communicating escrow instructions to Vesicash.
            </p>
            <p>
              <strong className="text-gray-900">Vesicash&apos;s Role:</strong> Vesicash holds and disburses funds
              according to the instructions received from Amana based on transaction outcomes. Vesicash is
              responsible for the security and regulatory compliance of fund custody.
            </p>
            <p>
              <strong className="text-gray-900">Limitations:</strong> Neither Amana nor Vesicash is liable for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The quality, safety, or legality of items sold on the Platform</li>
              <li>Delays in payment processing caused by third-party payment providers or banks</li>
              <li>Currency exchange rate fluctuations between the time of purchase and fund release</li>
              <li>Indirect, incidental, or consequential damages arising from escrow-related delays</li>
            </ul>
            <p>
              <strong className="text-gray-900">Force Majeure:</strong> Neither party shall be liable for delays
              or failure to perform due to circumstances beyond reasonable control, including but not limited to
              natural disasters, government actions, bank failures, or internet infrastructure failures.
            </p>
          </div>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-xl font-extrabold mb-3">7. Governing Law</h2>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p>
              This Escrow Agreement is governed by the laws of the Republic of Kenya. Any disputes related
              to the escrow service shall be resolved in accordance with the dispute resolution procedures
              outlined in our <Link href="/terms" className="text-[#D4A843] hover:underline">Terms of Use</Link>.
            </p>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-400">
            Questions about escrow? Contact <strong>escrow@amanamarket.com</strong>.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            See also: <Link href="/how-escrow-works" className="text-[#D4A843] hover:underline">How Escrow Works</Link> · <Link href="/buyer-protection" className="text-[#D4A843] hover:underline">Buyer Protection</Link> · <Link href="/terms" className="text-[#D4A843] hover:underline">Terms of Use</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
