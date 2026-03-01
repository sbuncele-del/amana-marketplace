"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Settings, Plus, Shield, Store,
} from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/dashboard/products", label: "Products", icon: <Package className="w-5 h-5" /> },
  { href: "/dashboard/orders", label: "Orders", icon: <ShoppingCart className="w-5 h-5" /> },
  { href: "/dashboard/analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
  { href: "/dashboard/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="pt-20 min-h-screen bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-28">
              {/* Store info */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#D4A843]/10 flex items-center justify-center font-bold text-[#D4A843]">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{session?.user?.name || "Your Store"}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Shield className="w-3 h-3 text-[#2E7D32]" /> Seller Dashboard
                  </div>
                </div>
              </div>

              <nav className="space-y-1">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      pathname === link.href
                        ? "bg-[#D4A843]/10 text-[#D4A843]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link href="/dashboard/products/new">
                  <button className="w-full flex items-center justify-center gap-2 bg-[#D4A843] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#c49a3a] transition-colors">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
