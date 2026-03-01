"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardCompact, ProductCardSkeleton, ProductCardCompactSkeleton } from "@/components/product-card";
import type { ProductCardData } from "@/components/product-card";
import {
  Shield, ArrowRight, ChevronLeft, ChevronRight, Globe, Truck, CreditCard,
  Star, Flame, TrendingUp, Sparkles, Store, Tag, ChevronRight as ChevRight,
  Zap, Clock, Award,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════ */

const heroBanners = [
  {
    title: "Tanzanite Direct from the Mine",
    subtitle: "AAA Grade • Escrow Protected • Certificate Included",
    cta: "Shop Gemstones",
    href: "/browse?category=gemstones",
    bg: "from-[#0F3460] to-[#1A1A2E]",
    image: "https://images.unsplash.com/photo-1551122089-4e3e72477432?w=1200&q=80",
  },
  {
    title: "Ethiopian Coffee, Farm to Cup",
    subtitle: "Grade 1 Yirgacheffe • Ships in 48hrs • From $18",
    cta: "Shop Coffee & Spice",
    href: "/browse?category=food-spice",
    bg: "from-[#2E1A00] to-[#1A1A2E]",
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=1200&q=80",
  },
  {
    title: "Handcrafted Leather from Nairobi",
    subtitle: "Full Grain • Made to Last • Free Shipping over $80",
    cta: "Shop Leather",
    href: "/browse?category=leather",
    bg: "from-[#3E1A00] to-[#1A1A2E]",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80",
  },
];

const departments = [
  { name: "Gemstones", slug: "gemstones", icon: "💎" },
  { name: "Fashion", slug: "fashion", icon: "👗" },
  { name: "Agriculture", slug: "agriculture", icon: "🌾" },
  { name: "Art & Craft", slug: "art-craft", icon: "🎨" },
  { name: "Beauty", slug: "beauty", icon: "✨" },
  { name: "Food & Spice", slug: "food-spice", icon: "🌶️" },
  { name: "Textiles", slug: "textiles", icon: "🧵" },
  { name: "Minerals", slug: "minerals", icon: "⛏️" },
  { name: "Leather", slug: "leather", icon: "👜" },
  { name: "Electronics", slug: "electronics", icon: "📱" },
  { name: "Home & Living", slug: "home-living", icon: "🏠" },
];

const promoBanners = [
  {
    title: "Gemstone Deal",
    subtitle: "Up to 30% off",
    tag: "HOT",
    href: "/browse?category=gemstones",
    image: "https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=600&q=80",
    color: "bg-gradient-to-br from-blue-900 to-indigo-900",
  },
  {
    title: "African Fashion",
    subtitle: "Ankara & Adire",
    tag: "TRENDING",
    href: "/browse?category=fashion",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    color: "bg-gradient-to-br from-rose-900 to-red-900",
  },
  {
    title: "Natural Beauty",
    subtitle: "Shea butter & more",
    tag: "BEST SELLER",
    href: "/browse?category=beauty",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80",
    color: "bg-gradient-to-br from-emerald-900 to-green-900",
  },
  {
    title: "Art & Craft",
    subtitle: "Handmade",
    tag: "UNIQUE FINDS",
    href: "/browse?category=art-craft",
    image: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80",
    color: "bg-gradient-to-br from-purple-900 to-violet-900",
  },
];

interface HomepageData {
  featured: ProductCardData[];
  bestSellers: ProductCardData[];
  newArrivals: ProductCardData[];
  deals: ProductCardData[];
  categories: { id: string; name: string; slug: string; icon: string | null; productCount: number }[];
}

/* ══════════════════════════════════════════════════════════════
   SCROLLABLE ROW COMPONENT
   ══════════════════════════════════════════════════════════════ */

function ScrollRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useCallback((dir: number) => {
    ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  }, []);

  return (
    <div className={`relative group/scroll ${className}`}>
      <div ref={ref} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {children}
      </div>
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-[#D4A843] transition opacity-0 group-hover/scroll:opacity-100 z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-[#D4A843] transition opacity-0 group-hover/scroll:opacity-100 z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION HEADER
   ══════════════════════════════════════════════════════════════ */

function SectionHeader({
  icon,
  title,
  href,
  accentColor = "text-[#D4A843]",
  bgColor = "",
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  accentColor?: string;
  bgColor?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-4 ${bgColor}`}>
      <h2 className="text-lg font-extrabold text-[#1A1A2E] flex items-center gap-2">
        <span className={accentColor}>{icon}</span> {title}
      </h2>
      <Link href={href} className="text-sm font-semibold text-[#D4A843] hover:underline flex items-center gap-1">
        View All <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════ */

export default function HomePage() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    fetch("/api/homepage")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % heroBanners.length), 5000);
    return () => clearInterval(t);
  }, []);

  const banner = heroBanners[bannerIdx];

  return (
    <div className="bg-[#F0F0F0] min-h-screen">

      {/* ════════════════════ TRUST BAR ════════════════════ */}
      <div className="bg-[#1A1A2E] text-white/60 text-[11px] py-1.5">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /> Escrow on every order</span>
          <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-[#D4A843]" /> M-Pesa · Cards · Bank</span>
          <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-emerald-400" /> Ships to 34 countries</span>
          <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-[#D4A843]" /> AfCFTA duty benefits</span>
        </div>
      </div>

      {/* ════════════════════ HERO: SIDEBAR + BANNER ════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 pt-4 pb-3">
        <div className="flex gap-4">

          {/* ── Left: Department sidebar (desktop) ── */}
          <aside className="hidden lg:block w-[230px] flex-shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden self-start">
            <div className="bg-[#D4A843] text-white text-sm font-bold px-4 py-2.5">
              Shop by Department
            </div>
            {departments.map((dept) => (
              <Link
                key={dept.slug}
                href={`/browse?category=${dept.slug}`}
                className="flex items-center justify-between px-3 py-2 text-[13px] text-gray-700 hover:bg-[#D4A843]/5 hover:text-[#D4A843] transition-colors border-b border-gray-50 last:border-b-0 group"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-5 text-center text-sm">{dept.icon}</span>
                  {dept.name}
                </span>
                <ChevRight className="w-3 h-3 text-gray-300 group-hover:text-[#D4A843]" />
              </Link>
            ))}
            <Link
              href="/browse"
              className="block text-center text-[13px] font-semibold text-[#D4A843] hover:underline py-2.5 border-t border-gray-100"
            >
              All Categories →
            </Link>
          </aside>

          {/* ── Right: Hero carousel ── */}
          <div className="flex-1 min-w-0">
            <div className={`relative bg-gradient-to-r ${banner.bg} rounded-lg overflow-hidden`}>
              <div className="grid md:grid-cols-2 gap-0 items-center">
                {/* Text */}
                <div className="p-6 sm:p-8 lg:p-10 relative z-10">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                    {banner.title}
                  </h1>
                  <p className="text-white/60 text-sm sm:text-base mb-5">{banner.subtitle}</p>
                  <Link href={banner.href}>
                    <Button size="lg" className="text-sm">
                      {banner.cta} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  {/* Dots */}
                  <div className="flex items-center gap-2 mt-6">
                    {heroBanners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setBannerIdx(i)}
                        className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-8 bg-[#D4A843]" : "w-4 bg-white/20 hover:bg-white/40"}`}
                      />
                    ))}
                  </div>
                </div>
                {/* Image */}
                <div className="hidden md:block relative h-[280px] lg:h-[320px]">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 600px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                </div>
              </div>
              {/* Arrows */}
              <button
                onClick={() => setBannerIdx((i) => (i - 1 + heroBanners.length) % heroBanners.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBannerIdx((i) => (i + 1) % heroBanners.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════ PROMO BANNER STRIPS ════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {promoBanners.map((promo) => (
            <Link
              key={promo.title}
              href={promo.href}
              className="group relative overflow-hidden rounded-lg aspect-[2.2/1] flex items-end"
            >
              <Image
                src={promo.image}
                alt={promo.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
              <div className="relative z-10 p-3 w-full">
                <span className="inline-block bg-red-600 text-[9px] font-bold text-white px-1.5 py-px rounded-sm mb-1 tracking-wider">
                  {promo.tag}
                </span>
                <h3 className="text-white font-bold text-sm leading-tight">{promo.title}</h3>
                <p className="text-white/60 text-[11px]">{promo.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ════════════════════ DEALS SECTION (Red header like Takealot) ════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between">
            <h2 className="text-white font-extrabold text-base flex items-center gap-2">
              <Flame className="w-5 h-5" /> Amana Deals
            </h2>
            <Link href="/browse?sort=deals" className="text-white/80 text-sm font-medium hover:text-white flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {data?.deals && data.deals.length > 0 ? (
              <ScrollRow>
                {data.deals.map((p) => (
                  <ProductCardCompact key={p.id} product={p} />
                ))}
              </ScrollRow>
            ) : data?.featured ? (
              <ScrollRow>
                {data.featured.map((p) => (
                  <ProductCardCompact key={p.id} product={p} />
                ))}
              </ScrollRow>
            ) : (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 7 }).map((_, i) => <ProductCardCompactSkeleton key={i} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════ FEATURED ON AMANA ════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader
            icon={<Zap className="w-5 h-5" />}
            title="Featured on Amana"
            href="/browse?featured=true"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {data?.featured
              ? data.featured.map((p) => <ProductCard key={p.id} product={p} />)
              : Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════ BEST SELLERS ════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-emerald-700 px-4 py-2.5 flex items-center justify-between">
            <h2 className="text-white font-extrabold text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Best Sellers
            </h2>
            <Link href="/browse?sort=popular" className="text-white/80 text-sm font-medium hover:text-white flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {data?.bestSellers
                ? data.bestSellers.map((p) => <ProductCard key={p.id} product={p} />)
                : Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ HOW ESCROW WORKS (slim) ════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 pb-4">
        <div className="bg-[#1A1A2E] rounded-lg px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Tag className="w-4 h-4" />, label: "Browse & Choose", sub: "1000s of products" },
              { icon: <Shield className="w-4 h-4" />, label: "Pay into Escrow", sub: "Your money is safe" },
              { icon: <Truck className="w-4 h-4" />, label: "Seller Ships", sub: "Track your order" },
              { icon: <Star className="w-4 h-4" />, label: "Approve & Rate", sub: "Release payment" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#D4A843]/15 flex items-center justify-center text-[#D4A843] flex-shrink-0">
                  {s.icon}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#D4A843] uppercase tracking-wider">Step {i + 1}</div>
                  <div className="text-sm font-semibold text-white leading-tight">{s.label}</div>
                  <div className="text-[10px] text-white/40">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ NEW ARRIVALS ════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-[#D4A843] px-4 py-2.5 flex items-center justify-between">
            <h2 className="text-white font-extrabold text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> New Arrivals
            </h2>
            <Link href="/browse?sort=newest" className="text-white/80 text-sm font-medium hover:text-white flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4">
            <ScrollRow>
              {data?.newArrivals
                ? data.newArrivals.map((p) => <ProductCardCompact key={p.id} product={p} />)
                : Array.from({ length: 7 }).map((_, i) => <ProductCardCompactSkeleton key={i} />)}
            </ScrollRow>
          </div>
        </div>
      </section>

      {/* ════════════════════ SHOP BY CATEGORY ════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader
            icon={<Award className="w-5 h-5" />}
            title="Shop by Category"
            href="/browse"
            accentColor="text-emerald-600"
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
            {(data?.categories || departments).map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse?category=${cat.slug}`}
                className="group bg-gray-50 hover:bg-[#D4A843]/5 border border-gray-100 hover:border-[#D4A843]/30 rounded-lg p-3 text-center transition-all"
              >
                <div className="text-2xl mb-1.5">{"icon" in cat && cat.icon ? cat.icon : "📦"}</div>
                <div className="text-[11px] font-semibold text-gray-700 group-hover:text-[#D4A843] leading-tight transition-colors">
                  {cat.name}
                </div>
                {"productCount" in cat && (
                  <div className="text-[9px] text-gray-400 mt-0.5">{(cat as { productCount: number }).productCount} items</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ SELLER CTA ════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 pb-6">
        <div className="bg-gradient-to-r from-[#1A1A2E] to-[#0F3460] rounded-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4A843]/15 flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-[#D4A843]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sell on Amana</h3>
                <p className="text-white/50 text-sm">Reach buyers in 34 African countries. Escrow-protected payments.</p>
              </div>
            </div>
            <Link href="/register?role=seller">
              <Button size="lg" className="text-sm whitespace-nowrap">
                Open Your Store <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
