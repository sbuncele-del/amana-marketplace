import Link from "next/link";
import { redirect } from "next/navigation";
import { operator, ExperienceError } from "@/lib/experience/access";
import { OrdersDesk } from "@/components/orders-desk/orders-desk";

export const metadata = { title: "Orders desk | Plentovo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await operator();
  } catch (e) {
    if (e instanceof ExperienceError && e.status === 401) redirect("/login?callbackUrl=%2Foperations%2Forders");
    return <main className="mx-auto max-w-xl px-6 py-24"><p>{e instanceof ExperienceError ? e.message : "The orders desk is temporarily unavailable."}</p></main>;
  }
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex gap-5 border-b border-slate-200 px-4 py-3 text-sm" aria-label="Operations">
        <Link href="/operations" className="underline">Operations</Link>
        <Link href="/operations/commerce" className="underline">Markets &amp; fulfilment</Link>
        <Link href="/operations/store" className="underline">Store management</Link>
        <span className="font-semibold">Orders desk</span>
      </nav>
      <OrdersDesk embedded />
    </div>
  );
}
