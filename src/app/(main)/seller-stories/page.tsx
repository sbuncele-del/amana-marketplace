import { Star, TrendingUp, Quote, MapPin, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Seller Success Stories — Amana Marketplace" };

const stories = [
  {
    name: "Kilimanjaro Gems",
    seller: "Joseph Mwangi",
    country: "Tanzania",
    flag: "🇹🇿",
    location: "Arusha",
    category: "Gemstones & Minerals",
    image: "/images/sellers/kilimanjaro-gems.jpg",
    quote: "Before Amana, I could only sell to tourists who visited our shop. Now I ship tanzanite to buyers in 12 countries. The escrow system gives my international customers the confidence to buy high-value gems online.",
    stats: { revenue: "340%", orders: "180+", countries: 12, rating: 4.9 },
    story: "Joseph started as a small gemstone dealer in Arusha's mineral market. By joining Amana as an early seller, he was able to reach buyers across Africa and beyond. His verified Premium seller status and gemological certificates helped build instant trust with international buyers.",
  },
  {
    name: "Adire Lagos",
    seller: "Funke Adeyemi",
    country: "Nigeria",
    flag: "🇳🇬",
    location: "Lagos",
    category: "Fashion & Apparel",
    image: "/images/sellers/adire-lagos.jpg",
    quote: "Amana helped me transform my grandmother's adire tradition into a continental brand. Buyers in Kenya, Ghana, and South Africa now wear our hand-dyed fabrics. The platform handles the cross-border complexity so I can focus on creating.",
    stats: { revenue: "520%", orders: "450+", countries: 8, rating: 4.8 },
    story: "Funke learned traditional adire (indigo dyeing) from her grandmother in Abeokuta. She launched on Amana with just 15 products and now has over 200 listings. Her hand-dyed fabrics and ready-to-wear pieces have become best-sellers in the Fashion category.",
  },
  {
    name: "Savanna Shea",
    seller: "Amina Diallo",
    country: "Ghana",
    flag: "🇬🇭",
    location: "Tamale",
    category: "Beauty & Wellness",
    image: "/images/sellers/savanna-shea.jpg",
    quote: "Our women's cooperative produces the finest raw shea butter in Northern Ghana. Amana connected us to buyers who value quality and ethical sourcing. Revenue from Amana has funded a new processing facility and employed 30 more women.",
    stats: { revenue: "280%", orders: "620+", countries: 15, rating: 4.9 },
    story: "Amina leads a cooperative of 45 women who harvest and process shea butter using traditional methods. Through Amana, their products reach beauty brands and individual customers across the continent. The AfCFTA badge on their listings reduced cross-border duties, making their products even more competitive.",
  },
  {
    name: "Kigali Coffee Co.",
    seller: "Jean-Pierre Habimana",
    country: "Rwanda",
    flag: "🇷🇼",
    location: "Kigali",
    category: "Food & Beverages",
    image: "/images/sellers/kigali-coffee.jpg",
    quote: "Rwandan specialty coffee is world-class, but we struggled to sell directly to African consumers. Amana's marketplace changed that. We now ship single-origin beans to coffee lovers from Nairobi to Cape Town.",
    stats: { revenue: "190%", orders: "340+", countries: 9, rating: 4.7 },
    story: "Jean-Pierre's family has grown coffee on the shores of Lake Kivu for three generations. He joined Amana to sell directly to consumers instead of through commodity brokers. His detailed listings with tasting notes, altitude data, and processing methods attract specialty coffee enthusiasts across Africa.",
  },
  {
    name: "Ubuntu Leather",
    seller: "Thabo Mokoena",
    country: "South Africa",
    flag: "🇿🇦",
    location: "Johannesburg",
    category: "Fashion & Apparel",
    image: "/images/sellers/ubuntu-leather.jpg",
    quote: "I was selling at weekend markets in Joburg. Amana opened up the entire continent. My leather bags are now in wardrobes from Accra to Dar es Salaam. The verified seller badge was the key to winning cross-border trust.",
    stats: { revenue: "410%", orders: "290+", countries: 11, rating: 4.8 },
    story: "Thabo hand-crafts leather bags, wallets, and accessories from his workshop in Maboneng. His premium seller status and detailed product photography — showing the leather grain, stitching details, and scale — helped him stand out. He now employs 8 craftspeople and has a 6-week waitlist for custom orders.",
  },
  {
    name: "Nile Spice House",
    seller: "Fatima Hassan",
    country: "Ethiopia",
    flag: "🇪🇹",
    location: "Addis Ababa",
    category: "Food & Beverages",
    image: "/images/sellers/nile-spice.jpg",
    quote: "Ethiopian spices like berbere and mitmita are essential to our cuisine, but nearly impossible to find outside Ethiopia. Amana let me share these flavors with the African diaspora and adventurous cooks across the continent.",
    stats: { revenue: "260%", orders: "510+", countries: 14, rating: 4.9 },
    story: "Fatima sources spices from small farms across Ethiopia and blends them using family recipes passed down through generations. Her phytosanitary certifications and detailed origin stories make her listings among the most popular in the Food & Beverages category. She recently launched a subscription box for monthly spice deliveries.",
  },
];

export default function SellerStoriesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Real Sellers, Real Growth</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Seller Success<br />
            <span className="text-[#D4A843]">Stories</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            From artisans in Arusha to coffee growers in Kigali, these sellers are building thriving
            businesses on Amana Marketplace. Here are their stories.
          </p>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {stories.map((s) => (
              <div key={s.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1A1A2E] to-[#0F3460] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{s.flag}</span>
                      <div>
                        <h3 className="text-white font-bold text-lg">{s.name}</h3>
                        <p className="text-white/60 text-sm">{s.seller}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-[#D4A843]/20 text-[#D4A843] px-2 py-1 rounded-full">
                      {s.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/50 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    {s.location}, {s.country}
                  </div>
                </div>

                {/* Quote */}
                <div className="p-6 bg-[#FAF8F5] border-b border-gray-100">
                  <div className="flex gap-3">
                    <Quote className="w-5 h-5 text-[#D4A843] flex-shrink-0 mt-1" />
                    <p className="text-gray-600 text-sm italic leading-relaxed">{s.quote}</p>
                  </div>
                </div>

                {/* Story */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{s.story}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[#2E7D32] font-extrabold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {s.stats.revenue}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Revenue Growth</p>
                    </div>
                    <div className="text-center">
                      <div className="font-extrabold text-[#1A1A2E]">{s.stats.orders}</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Orders</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 font-extrabold text-[#1A1A2E]">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        {s.stats.countries}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Countries</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 font-extrabold text-[#D4A843]">
                        <Star className="w-3.5 h-3.5" />
                        {s.stats.rating}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aggregate Stats */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold mb-10">Seller Community Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-extrabold text-[#D4A843]">2,400+</div>
              <p className="text-sm text-gray-500 mt-1">Active Sellers</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#D4A843]">34+</div>
              <p className="text-sm text-gray-500 mt-1">Countries</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#D4A843]">$2.8M+</div>
              <p className="text-sm text-gray-500 mt-1">GMV Processed</p>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#D4A843]">4.7</div>
              <p className="text-sm text-gray-500 mt-1">Avg Seller Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Write Your Own Success Story</h2>
          <p className="text-white/60 mb-8">
            Join these sellers and thousands more who are building thriving businesses on Amana Marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/sell">
              <Button size="lg">Start Selling Today</Button>
            </Link>
            <Link href="/seller-guidelines">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Seller Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
