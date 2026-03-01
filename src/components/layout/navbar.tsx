"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Menu, X, Search, Heart, ShoppingCart, ChevronDown, ChevronRight,
  Package, HelpCircle, Store, LogIn, UserPlus, LayoutDashboard, Flame, Tag, Sparkles, Award, BadgePercent,
} from "lucide-react";

/* ────────── data ────────── */

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

const dealTabs = [
  { label: "Deals", href: "/browse?sort=deals", icon: Tag, color: "text-red-600" },
  { label: "New Arrivals", href: "/browse?sort=newest", icon: Sparkles, color: "text-[#D4A843]" },
  { label: "Fire Sale", href: "/browse?sale=true", icon: Flame, color: "text-orange-500" },
  { label: "Best Sellers", href: "/browse?sort=popular", icon: Award, color: "text-emerald-600" },
  { label: "Clearance", href: "/browse?clearance=true", icon: BadgePercent, color: "text-purple-600" },
  { label: "Sell on Amana", href: "/register?role=seller", icon: Store, color: "text-[#2E7D32]" },
];

/* ────────── component ────────── */

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 shadow-md">
      {/* ═══════════════ ROW 1 ─ Top utility bar (dark) ═══════════════ */}
      <div className="bg-[#1A1A2E]">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between h-10 text-[13px]">
          {/* Left ─ Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#D4A843] to-[#C4982F] flex items-center justify-center text-white font-black text-xs">
              A
            </div>
            <span className="text-white font-bold tracking-tight">amana</span>
          </Link>

          {/* Centre ─ Help / Sell */}
          <div className="hidden md:flex items-center gap-5 text-white/60">
            <Link href="/about" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" /> Help Centre
            </Link>
            <Link href="/register?role=seller" className="hover:text-white flex items-center gap-1.5 transition-colors">
              <Store className="w-3.5 h-3.5" /> Sell on Amana
            </Link>
          </div>

          {/* Right ─ Account, Wishlist, Cart */}
          <div className="flex items-center">
            {session?.user ? (
              <>
                <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-white/60 hover:text-white transition-colors">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{session.user.name?.split(" ")[0] || "Dashboard"}</span>
                </Link>
                <Link href="/dashboard/orders" className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-white/60 hover:text-white transition-colors">
                  <Package className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Orders</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-white/60 hover:text-white transition-colors">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <span className="hidden sm:inline text-white/20">|</span>
                <Link href="/register" className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-white/60 hover:text-white transition-colors">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </>
            )}
            <Link href="/wishlist" className="relative p-2 text-white/60 hover:text-pink-400 transition-colors">
              <Heart className="w-[18px] h-[18px]" />
            </Link>
            <Link href="/cart" className="relative flex items-center gap-1 p-2 text-white/60 hover:text-[#D4A843] transition-colors">
              <ShoppingCart className="w-[18px] h-[18px]" />
              <span className="absolute -top-0.5 -right-0.5 text-[10px] font-bold bg-[#D4A843] text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">0</span>
            </Link>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 text-white ml-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ ROW 2 ─ Department button + Search bar ═══════════════ */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center gap-0 h-[52px]">
          {/* "Shop by Department" */}
          <div ref={deptRef} className="relative hidden md:block shrink-0 h-full">
            <button
              onClick={() => setDeptOpen(!deptOpen)}
              className="flex items-center gap-2 bg-[#D4A843] hover:bg-[#C4982F] text-white px-5 h-full text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Menu className="w-4 h-4" />
              Shop by Department
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${deptOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {deptOpen && (
              <div className="absolute top-full left-0 w-[260px] bg-white border border-gray-200 shadow-2xl z-50 rounded-b-lg overflow-hidden">
                {departments.map((dept) => (
                  <Link
                    key={dept.slug}
                    href={`/browse?category=${dept.slug}`}
                    onClick={() => setDeptOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#D4A843]/10 hover:text-[#D4A843] transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base w-6 text-center">{dept.icon}</span>
                      {dept.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#D4A843] transition-colors" />
                  </Link>
                ))}
                <div className="border-t border-gray-100 p-2.5">
                  <Link
                    href="/browse"
                    onClick={() => setDeptOpen(false)}
                    className="block text-center text-sm font-semibold text-[#D4A843] hover:underline py-1"
                  >
                    View All Categories →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <form action="/browse" className="flex-1 flex items-center h-full">
            <input
              name="search"
              type="text"
              placeholder="Search products, brands, sellers across Africa..."
              className="flex-1 h-full px-4 text-sm text-gray-800 placeholder:text-gray-400 border-y border-l border-gray-200 md:border-l-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#D4A843]/30 transition-shadow"
            />
            <button
              type="submit"
              className="h-full px-6 bg-[#D4A843] hover:bg-[#C4982F] text-white transition-colors flex items-center gap-2 shrink-0"
            >
              <Search className="w-5 h-5" />
              <span className="hidden lg:inline text-sm font-medium">Search</span>
            </button>
          </form>
        </div>
      </div>

      {/* ═══════════════ ROW 3 ─ Deal tabs ═══════════════ */}
      <div className="bg-[#FAFAFA] border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="hidden md:flex items-center gap-0 overflow-x-auto">
            {dealTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-white border-r border-gray-200 last:border-r-0 whitespace-nowrap ${tab.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ MOBILE SLIDE-OUT ═══════════════ */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-10 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="bg-white w-[85%] max-w-xs h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Mobile search */}
            <form action="/browse" className="p-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <input name="search" type="text" placeholder="Search products..." className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                <button type="submit" className="px-3 py-2.5 bg-[#D4A843] text-white"><Search className="w-4 h-4" /></button>
              </div>
            </form>

            {/* Mobile account */}
            <div className="p-3 border-b border-gray-200">
              {session?.user ? (
                <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-gray-800" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="w-4 h-4 text-[#D4A843]" /> Dashboard
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full"><LogIn className="w-3.5 h-3.5" /> Login</Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full"><UserPlus className="w-3.5 h-3.5" /> Register</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile deal tabs */}
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Links</div>
              {dealTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 ${tab.color}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile departments */}
            <div>
              <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Departments</div>
              {departments.map((dept) => (
                <Link
                  key={dept.slug}
                  href={`/browse?category=${dept.slug}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="w-5 text-center">{dept.icon}</span> {dept.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
