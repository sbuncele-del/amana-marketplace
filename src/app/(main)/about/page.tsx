import { Shield, Globe, Users, TrendingUp, MapPin, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "About Amana — Africa's Trusted Marketplace" };

const values = [
  { icon: Shield, title: "Trust First", desc: "Every transaction is escrow-protected. Buyers and sellers trade with complete confidence." },
  { icon: Globe, title: "Pan-African", desc: "We serve 34+ African countries with local payments, multi-currency support, and AfCFTA compliance." },
  { icon: Users, title: "Community-Driven", desc: "Built by Africans, for African trade. Our seller verification system ensures quality and accountability." },
  { icon: Heart, title: "Fair Commerce", desc: "Transparent fees, no hidden charges. We succeed only when our sellers and buyers succeed." },
];

const stats = [
  { value: "34+", label: "Countries Served" },
  { value: "15+", label: "Payment Methods" },
  { value: "100%", label: "Escrow Protected" },
  { value: "11", label: "Trade Sectors" },
];

const team = [
  { name: "Nairobi, Kenya", role: "Headquarters", flag: "🇰🇪" },
  { name: "Lagos, Nigeria", role: "West Africa Hub", flag: "🇳🇬" },
  { name: "Accra, Ghana", role: "Francophone Bridge", flag: "🇬🇭" },
  { name: "Dar es Salaam, Tanzania", role: "East Africa Hub", flag: "🇹🇿" },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Trade Across Africa,<br /><span className="text-[#D4A843]">With Zero Risk</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Amana is Africa&apos;s first cross-border marketplace with built-in escrow protection on every transaction. 
            We connect buyers and sellers across the continent, making pan-African trade safe, simple, and accessible.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-[#D4A843]">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold mb-6 text-center">Our Mission</h2>
          <p className="text-gray-600 text-center text-lg leading-relaxed max-w-3xl mx-auto">
            To unlock the $3.4 trillion intra-African trade opportunity by removing the trust barrier. 
            Under the African Continental Free Trade Area (AfCFTA), we provide the digital infrastructure 
            for sellers and buyers to transact safely across borders — with escrow protection, local payments, 
            and AfCFTA-compliant duty calculations built right in.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold mb-10 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#D4A843]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold mb-10 text-center">Our Presence</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((t) => (
              <div key={t.name} className="bg-[#FAF8F5] rounded-xl p-5 text-center border border-gray-100">
                <div className="text-3xl mb-2">{t.flag}</div>
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs text-gray-400 mt-1">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1A1A2E]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Ready to Trade?</h2>
          <p className="text-white/50 mb-8">Join thousands of traders across Africa. Every transaction is escrow-protected.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse"><Button size="lg">Start Shopping</Button></Link>
            <Link href="/register?role=seller"><Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/5">Open a Store</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
