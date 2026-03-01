import { Briefcase, Heart, MapPin, Globe, Zap, Users, Coffee, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Careers — Amana Marketplace" };

const values = [
  { icon: Globe, title: "Pan-African First", desc: "We build for the continent. Every decision considers the diverse needs of 54 nations, from payment methods to language support." },
  { icon: Heart, title: "Trust as a Product", desc: "Trust isn't a feature — it's our core product. We obsess over building systems that make cross-border trade feel as safe as buying from a neighbor." },
  { icon: Zap, title: "Ship & Iterate", desc: "We move fast and learn from real usage. We ship MVPs, gather feedback from sellers in Lagos and buyers in Nairobi, and iterate rapidly." },
  { icon: Users, title: "Radical Transparency", desc: "Open communication, honest feedback, and transparent decision-making. We share context, not just tasks." },
];

const positions = [
  {
    title: "Product Manager — Marketplace",
    location: "Nairobi, Kenya",
    type: "Full-time",
    team: "Product",
    description: "Own the buyer and seller marketplace experience. Drive feature development for search, discovery, and transaction flows. Work closely with engineering and design teams.",
  },
  {
    title: "Senior Frontend Engineer",
    location: "Remote (Africa)",
    type: "Full-time",
    team: "Engineering",
    description: "Build the next generation of our marketplace UI using Next.js, React, and TypeScript. Focus on performance, accessibility, and mobile-first design for African network conditions.",
  },
  {
    title: "Backend Engineer — Payments",
    location: "Lagos, Nigeria",
    type: "Full-time",
    team: "Engineering",
    description: "Integrate and maintain payment providers including M-Pesa, Flutterwave, and Vesicash escrow. Build reliable, fault-tolerant payment processing for cross-border transactions.",
  },
  {
    title: "Operations Manager — West Africa",
    location: "Accra, Ghana",
    type: "Full-time",
    team: "Operations",
    description: "Manage seller onboarding, verification processes, and logistics partnerships across West Africa. Build processes that scale for the fastest-growing region on the platform.",
  },
  {
    title: "UX Designer",
    location: "Remote (Africa)",
    type: "Full-time",
    team: "Design",
    description: "Design intuitive experiences for African e-commerce. Conduct user research across diverse markets. Create design systems that work across devices and bandwidth constraints.",
  },
  {
    title: "Customer Support Lead",
    location: "Dar es Salaam, Tanzania",
    type: "Full-time",
    team: "Support",
    description: "Build and lead the customer support team handling disputes, escrow inquiries, and seller onboarding support. Fluency in Swahili and English required.",
  },
  {
    title: "Data Analyst",
    location: "Remote (Africa)",
    type: "Full-time",
    team: "Data",
    description: "Analyze marketplace health metrics, buyer/seller behavior, and cross-border trade patterns. Provide insights that drive product and business decisions.",
  },
  {
    title: "Content Marketing Manager",
    location: "Nairobi, Kenya",
    type: "Full-time",
    team: "Marketing",
    description: "Create compelling content for African entrepreneurs: seller guides, success stories, trade insights. Manage our blog, social media, and email marketing.",
  },
];

const benefits = [
  { icon: Globe, title: "Remote-Friendly", desc: "Work from anywhere in Africa. We provide co-working stipends and home office allowances." },
  { icon: GraduationCap, title: "Learning Budget", desc: "$1,500/year for courses, conferences, and books. We invest in your growth." },
  { icon: Heart, title: "Health Coverage", desc: "Comprehensive health insurance for you and your dependents." },
  { icon: Coffee, title: "Flexible Hours", desc: "We care about output, not hours. Work when you're most productive." },
  { icon: Zap, title: "Equity Options", desc: "Early-stage employee stock options. Build wealth as Amana grows." },
  { icon: Users, title: "Team Retreats", desc: "Annual all-hands retreat in a different African city each year." },
];

export default function CareersPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Briefcase className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Join Our Team</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Build the Future of<br />
            <span className="text-[#D4A843]">African Commerce</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            We&apos;re on a mission to unlock the $3.4 trillion intra-African trade opportunity. 
            Join a passionate team building the infrastructure for trusted cross-border commerce across the continent.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold mb-6">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
            Africa trades less with itself than any other continent. Only 15% of African trade is intra-continental,
            compared to 58% in Asia and 67% in Europe. The reason? Trust. Amana exists to change this by providing
            the digital infrastructure — escrow protection, verified sellers, multi-currency payments — that makes
            cross-border trade safe and accessible for everyone.
          </p>
        </div>
      </section>

      {/* Culture Values */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">How We Work</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#D4A843]" />
                  </div>
                  <h3 className="font-bold mb-2">{v.title}</h3>
                  <p className="text-gray-600 text-sm">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-4">Open Positions</h2>
          <p className="text-gray-500 text-center mb-10">
            We&apos;re hiring across engineering, product, design, operations, and marketing.
          </p>
          <div className="space-y-4">
            {positions.map((p) => (
              <div key={p.title} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{p.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {p.location}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span>{p.type}</span>
                      <span className="text-gray-300">|</span>
                      <span>{p.team}</span>
                    </div>
                  </div>
                  <Button size="sm">Apply Now</Button>
                </div>
                <p className="text-gray-600 text-sm">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-10">Benefits & Perks</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-[#2E7D32]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#2E7D32]" />
                  </div>
                  <h3 className="font-bold mb-1">{b.title}</h3>
                  <p className="text-gray-600 text-sm">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Don&apos;t See Your Role?</h2>
          <p className="text-white/60 mb-8">
            We&apos;re always looking for talented people passionate about African commerce.
            Send us your CV and tell us how you&apos;d contribute.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg">Send Us Your CV</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Learn About Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
