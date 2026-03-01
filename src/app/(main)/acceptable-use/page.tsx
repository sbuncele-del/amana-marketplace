import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, Flag, Scale, Ban } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Acceptable Use Policy — Amana Marketplace" };

const permittedActivities = [
  "Buying and selling legitimate products through the Platform",
  "Creating accurate product listings with truthful descriptions and real product images",
  "Communicating with buyers and sellers through the Platform's messaging system",
  "Leaving honest reviews and ratings based on actual transaction experiences",
  "Using the Platform's tools to manage orders, shipping, and payments",
  "Participating in promotions, sales events, and featured listings programs",
  "Reporting policy violations and suspicious activities through the Platform's reporting tools",
];

const prohibitedItems = [
  { category: "Counterfeit Goods", examples: "Fake designer items, replica watches, counterfeit electronics, knock-off branded goods" },
  { category: "Weapons & Ammunition", examples: "Firearms, knives (except kitchen/utility), ammunition, explosives, tactical weapons" },
  { category: "Drugs & Controlled Substances", examples: "Illegal drugs, prescription medications without license, drug paraphernalia" },
  { category: "Stolen Property", examples: "Any goods known or suspected to be stolen, goods without proof of legitimate ownership" },
  { category: "Wildlife Products", examples: "Ivory, rhino horn, protected animal skins, products from CITES-listed species" },
  { category: "Hazardous Materials", examples: "Explosives, toxic chemicals, radioactive materials, flammable liquids (without certification)" },
  { category: "Adult Content", examples: "Pornographic material, adult toys (in jurisdictions where prohibited), explicit services" },
  { category: "Financial Instruments", examples: "Cryptocurrency mining equipment used for fraud, counterfeit currency, stolen financial credentials" },
  { category: "Human Remains & Body Parts", examples: "Human organs, bones, or tissue (except medically approved, certified items)" },
  { category: "Tobacco & Alcohol", examples: "Cigarettes, vape products, alcoholic beverages (unless seller has appropriate licensing)" },
];

const prohibitedConduct = [
  {
    title: "Fraud & Deception",
    items: [
      "Creating fake accounts or providing false identity information",
      "Listing products with intentionally misleading descriptions or images",
      "Manipulating prices, reviews, ratings, or search results",
      "Filing fraudulent disputes or making false claims",
      "Bait-and-switch tactics — advertising one product and delivering another",
    ],
  },
  {
    title: "Escrow Circumvention",
    items: [
      "Requesting or arranging off-platform payments",
      "Asking buyers to pay via direct bank transfer, Western Union, or cryptocurrency",
      "Offering discounts for off-platform transactions",
      "Including payment instructions in product listings or messages",
    ],
  },
  {
    title: "Harassment & Abuse",
    items: [
      "Threatening, harassing, or intimidating other users",
      "Discriminating based on race, ethnicity, gender, religion, nationality, or other protected characteristics",
      "Sharing personal information of other users without consent (doxxing)",
      "Using abusive language in messages, reviews, or disputes",
    ],
  },
  {
    title: "Platform Manipulation",
    items: [
      "Scraping, data mining, or automated collection of Platform data",
      "Creating automated accounts (bots) for purchasing or listing",
      "Interfering with other users' accounts or transactions",
      "Exploiting bugs or vulnerabilities instead of reporting them",
      "Reverse engineering or decompiling the Platform's software",
    ],
  },
  {
    title: "Legal Violations",
    items: [
      "Money laundering or terrorist financing through the Platform",
      "Violating export controls, sanctions, or trade embargoes",
      "Infringing on patents, trademarks, copyrights, or other intellectual property",
      "Evading taxes or customs duties through misrepresentation",
    ],
  },
];

const enforcement = [
  { level: "Warning", desc: "First offense for minor violations. A notice is sent explaining the violation and required corrective action.", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { level: "Listing Removal", desc: "Individual listings that violate policies are removed immediately. Repeated violations lead to escalation.", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { level: "Account Suspension", desc: "Temporary suspension (7–30 days) for serious or repeated violations. Escrow funds for pending transactions are held until resolution.", color: "bg-red-50 text-red-700 border-red-200" },
  { level: "Permanent Ban", desc: "Account permanently terminated for severe violations (fraud, counterfeit goods, safety threats). All pending escrow funds are frozen pending investigation.", color: "bg-red-100 text-red-800 border-red-300" },
];

export default function AcceptableUsePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <ShieldAlert className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Community Standards</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Acceptable Use<br />
            <span className="text-[#D4A843]">Policy</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Last updated: January 15, 2026. This policy defines what is and isn&apos;t allowed on Amana
            Marketplace. These standards exist to keep our community safe and trustworthy for everyone.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-14">
        {/* Permitted Activities */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-6 h-6 text-[#2E7D32]" />
            <h2 className="text-2xl font-extrabold">Permitted Activities</h2>
          </div>
          <div className="bg-green-50/50 rounded-xl border border-green-100 p-6">
            <ul className="space-y-2">
              {permittedActivities.map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-[#2E7D32] mt-0.5">✓</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Prohibited Items */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Ban className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-extrabold">Prohibited Items</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            The following categories of items may not be listed or sold on Amana Marketplace.
            This list is not exhaustive — we reserve the right to remove any listing we determine
            to be inappropriate, harmful, or illegal.
          </p>
          <div className="space-y-4">
            {prohibitedItems.map((item) => (
              <div key={item.category} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm mb-0.5">{item.category}</h3>
                    <p className="text-gray-500 text-xs">{item.examples}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prohibited Conduct */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-extrabold">Prohibited Conduct</h2>
          </div>
          <div className="space-y-8">
            {prohibitedConduct.map((section) => (
              <div key={section.title}>
                <h3 className="font-bold text-lg mb-3">{section.title}</h3>
                <div className="bg-red-50/30 rounded-xl border border-red-100 p-5">
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-red-400 mt-0.5">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enforcement */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Enforcement</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Violations are handled proportionally based on severity, intent, and repeat offenses:
          </p>
          <div className="space-y-4">
            {enforcement.map((e) => (
              <div key={e.level} className={`rounded-xl border p-5 ${e.color}`}>
                <h3 className="font-bold mb-1">{e.level}</h3>
                <p className="text-sm opacity-80">{e.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            All enforcement actions can be appealed by contacting <strong>compliance@amanamarket.com</strong> within
            14 days of the action.
          </p>
        </section>

        {/* Reporting */}
        <section className="bg-[#FAF8F5] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Flag className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">Reporting Violations</h2>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>If you encounter a violation of this policy, report it immediately:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Click the <strong>&ldquo;Report&rdquo;</strong> button on any listing, profile, or message</li>
              <li>Email <strong>safety@amanamarket.com</strong> with relevant details and evidence</li>
              <li>Use the reporting form in your dashboard under Help &gt; Report a Problem</li>
            </ul>
            <p className="mt-2">
              All reports are reviewed within 24 hours. You will be notified when action is taken.
              Reports can be made anonymously.
            </p>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-400">
            See also: <Link href="/terms" className="text-[#D4A843] hover:underline">Terms of Use</Link> · <Link href="/trust-safety" className="text-[#D4A843] hover:underline">Trust & Safety</Link> · <Link href="/seller-guidelines" className="text-[#D4A843] hover:underline">Seller Guidelines</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
