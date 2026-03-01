import { Cookie, Settings, Shield, BarChart3, Megaphone, Globe } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Cookie Policy — Amana Marketplace" };

const essentialCookies = [
  { name: "session_id", purpose: "Maintains your login session", duration: "Session (deleted when browser closes)" },
  { name: "csrf_token", purpose: "Protects against cross-site request forgery attacks", duration: "Session" },
  { name: "cart_id", purpose: "Remembers items in your shopping cart", duration: "30 days" },
  { name: "currency_pref", purpose: "Stores your selected currency preference", duration: "1 year" },
  { name: "country_code", purpose: "Stores your country for shipping and duty calculations", duration: "1 year" },
  { name: "cookie_consent", purpose: "Remembers your cookie consent preferences", duration: "1 year" },
];

const analyticsCookies = [
  { name: "_ga", purpose: "Google Analytics — distinguishes unique users", duration: "2 years" },
  { name: "_gid", purpose: "Google Analytics — identifies user sessions", duration: "24 hours" },
  { name: "_amana_metrics", purpose: "Internal analytics — page views, search queries, conversion tracking", duration: "1 year" },
  { name: "ab_variant", purpose: "Assigns you to A/B test groups to improve our platform", duration: "30 days" },
];

const marketingCookies = [
  { name: "_fbp", purpose: "Facebook Pixel — tracks conversions from Facebook ads", duration: "90 days" },
  { name: "_tw_pixel", purpose: "Twitter/X Pixel — measures ad campaign performance", duration: "30 days" },
  { name: "ref_source", purpose: "Tracks which marketing channel referred you to Amana", duration: "30 days" },
];

export default function CookiesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Cookie className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Transparency</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Cookie<br />
            <span className="text-[#D4A843]">Policy</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Last updated: January 15, 2026. This policy explains what cookies we use, why we use them,
            and how you can control your preferences.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        {/* What are cookies */}
        <section>
          <h2 className="text-xl font-extrabold mb-3">What Are Cookies?</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Cookies are small text files placed on your device when you visit a website. They are widely
            used to make websites work efficiently, provide a better browsing experience, and give site
            owners usage information. Cookies do not contain personal information like your name or email
            unless you have provided it to us (e.g., by logging in).
          </p>
        </section>

        {/* Essential Cookies */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-[#2E7D32]" />
            <h2 className="text-xl font-extrabold">Essential Cookies</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These cookies are necessary for the Platform to function. They cannot be disabled without
            breaking core functionality. They do not store personally identifiable information.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-4 text-left font-bold">Cookie</th>
                  <th className="py-2.5 px-4 text-left font-bold">Purpose</th>
                  <th className="py-2.5 px-4 text-left font-bold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {essentialCookies.map((c) => (
                  <tr key={c.name} className="border-b border-gray-100">
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-700">{c.name}</td>
                    <td className="py-2.5 px-4 text-gray-600">{c.purpose}</td>
                    <td className="py-2.5 px-4 text-gray-500">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Analytics Cookies */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">Analytics Cookies</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These cookies help us understand how visitors use the Platform — which pages are popular,
            how users navigate, and where they experience issues. All data is aggregated and anonymized.
            These cookies require your consent.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-4 text-left font-bold">Cookie</th>
                  <th className="py-2.5 px-4 text-left font-bold">Purpose</th>
                  <th className="py-2.5 px-4 text-left font-bold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {analyticsCookies.map((c) => (
                  <tr key={c.name} className="border-b border-gray-100">
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-700">{c.name}</td>
                    <td className="py-2.5 px-4 text-gray-600">{c.purpose}</td>
                    <td className="py-2.5 px-4 text-gray-500">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Marketing Cookies */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Megaphone className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">Marketing Cookies</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These cookies are used to track the effectiveness of our advertising campaigns and to show
            you relevant ads on other platforms. These cookies are only set with your explicit consent.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-4 text-left font-bold">Cookie</th>
                  <th className="py-2.5 px-4 text-left font-bold">Purpose</th>
                  <th className="py-2.5 px-4 text-left font-bold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {marketingCookies.map((c) => (
                  <tr key={c.name} className="border-b border-gray-100">
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-700">{c.name}</td>
                    <td className="py-2.5 px-4 text-gray-600">{c.purpose}</td>
                    <td className="py-2.5 px-4 text-gray-500">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Managing Preferences */}
        <section className="bg-[#FAF8F5] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">Managing Your Preferences</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              You can manage your cookie preferences at any time:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>On Amana:</strong> Click the cookie settings icon in the footer or visit your account privacy settings</li>
              <li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies through their settings menu</li>
              <li><strong>Opt-out tools:</strong> Use the Digital Advertising Alliance opt-out tool or the NAI Consumer Opt-Out to manage third-party advertising cookies</li>
            </ul>
            <p>
              Note: Blocking essential cookies will prevent you from logging in, adding items to your cart,
              and completing purchases on Amana.
            </p>
          </div>
        </section>

        {/* Third-Party Cookies */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-[#D4A843]" />
            <h2 className="text-xl font-extrabold">Third-Party Cookies</h2>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>
              Some cookies on our Platform are placed by third-party services we use, including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Google Analytics:</strong> Website usage statistics and user journey analysis</li>
              <li><strong>Facebook/Meta:</strong> Ad campaign measurement and remarketing</li>
              <li><strong>Twitter/X:</strong> Ad campaign measurement</li>
              <li><strong>Flutterwave/Paystack:</strong> Payment processing security tokens</li>
            </ul>
            <p>
              These third parties have their own privacy and cookie policies. We encourage you to review them.
              We do not control the cookies set by third-party services.
            </p>
          </div>
        </section>

        {/* Updates */}
        <section>
          <h2 className="text-xl font-extrabold mb-3">Updates to This Policy</h2>
          <div className="text-sm text-gray-600 leading-relaxed">
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or
              for legal, technical, or regulatory reasons. We will notify you of material changes through
              a banner on the Platform or by updating the &ldquo;Last updated&rdquo; date at the top of this page.
            </p>
            <p className="mt-3">
              Questions? Contact us at <strong>privacy@amanamarket.com</strong>.
            </p>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-400">
            See also: <Link href="/privacy" className="text-[#D4A843] hover:underline">Privacy Policy</Link> · <Link href="/terms" className="text-[#D4A843] hover:underline">Terms of Use</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
