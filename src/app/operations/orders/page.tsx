import { redirect } from "next/navigation";
import { operator, ExperienceError } from "@/lib/experience/access";
import { OpsShell } from "@/components/operations/shell";
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
    <OpsShell title="Orders">
      <OrdersDesk embedded />
    </OpsShell>
  );
}
