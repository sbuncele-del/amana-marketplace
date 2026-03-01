import { Mail, Phone, MapPin, MessageSquare, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Contact Us — Amana Marketplace" };

const offices = [
  { city: "Nairobi, Kenya", flag: "🇰🇪", phone: "+254 700 AMANA", email: "nairobi@amana.market", role: "Headquarters" },
  { city: "Lagos, Nigeria", flag: "🇳🇬", phone: "+234 800 AMANA", email: "lagos@amana.market", role: "West Africa" },
  { city: "Accra, Ghana", flag: "🇬🇭", phone: "+233 302 AMANA", email: "accra@amana.market", role: "Francophone Bridge" },
];

export default function ContactPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Contact Us</h1>
          <p className="text-white/60 max-w-xl mx-auto">We&apos;re here to help. Reach out to our team for any questions about buying, selling, escrow, or partnerships.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-bold mb-6">Send us a message</h2>
              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A843]/30 focus:border-[#D4A843]" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A843]/30 focus:border-[#D4A843]" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A843]/30 focus:border-[#D4A843]">
                    <option>General Enquiry</option>
                    <option>Order Issue</option>
                    <option>Seller Support</option>
                    <option>Escrow / Payment</option>
                    <option>Partnership</option>
                    <option>Press / Media</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea rows={5} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A843]/30 focus:border-[#D4A843] resize-none" placeholder="How can we help?" />
                </div>
                <Button size="lg" type="submit">Send Message</Button>
              </form>
            </div>

            {/* Info sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#FAF8F5] rounded-xl p-6 border border-gray-100">
                <h3 className="font-bold mb-4">Quick Contact</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-gray-600"><Mail className="w-4 h-4 text-[#D4A843]" /> support@amana.market</div>
                  <div className="flex items-center gap-3 text-gray-600"><Phone className="w-4 h-4 text-[#D4A843]" /> +254 700 AMANA</div>
                  <div className="flex items-center gap-3 text-gray-600"><Clock className="w-4 h-4 text-[#D4A843]" /> Mon–Fri, 8AM – 6PM EAT</div>
                  <div className="flex items-center gap-3 text-gray-600"><MessageSquare className="w-4 h-4 text-[#D4A843]" /> Live chat available</div>
                </div>
              </div>

              <h3 className="font-bold">Our Offices</h3>
              {offices.map((o) => (
                <div key={o.city} className="bg-[#FAF8F5] rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{o.flag}</span>
                    <span className="font-semibold text-sm">{o.city}</span>
                    <span className="text-[10px] text-gray-400">({o.role})</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>{o.phone}</div>
                    <div>{o.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
