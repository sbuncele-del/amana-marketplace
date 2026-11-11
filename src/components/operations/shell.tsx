"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Globe, House, HeartHandshake, ShoppingBag, Store } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const nav = [
  { href: "/operations/back-office", label: "Back Office", icon: House },
  { href: "/operations/orders", label: "Orders", icon: ShoppingBag },
  { href: "/operations", label: "Customer service", icon: HeartHandshake },
  { href: "/operations/store", label: "Store management", icon: Store },
  { href: "/operations/commerce", label: "Markets & fulfilment", icon: Globe },
];

// One frame for every office page, so moving between orders, the store and the markets feels like one tool.
export function OpsShell({ title, children }: { title: string; children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex min-h-screen bg-slate-50 text-sm text-slate-900">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white px-3 py-5 lg:block">
        <Link href="/operations" className="block px-2"><BrandLogo className="h-auto w-36" /></Link>
        <nav aria-label="Office" className="mt-6 space-y-0.5">
          {nav.map((n) => {
            const on = n.href === "/operations" ? path === "/operations" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 ${on ? "bg-slate-100 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                <n.icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/browse" className="mt-8 flex items-center gap-2 px-2.5 text-xs text-slate-500"><ArrowLeft size={13} /> Back to the store</Link>
      </aside>
      <div className="min-w-0 flex-1">
        <nav aria-label="Office" className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${path === n.href ? "bg-slate-100 font-semibold" : "text-slate-600"}`}>{n.label}</Link>
          ))}
        </nav>
        <header className="border-b border-slate-200 bg-white px-5 py-3 lg:px-8"><h1 className="text-base font-semibold">{title}</h1></header>
        <main id="main-content" className="px-5 py-5 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
