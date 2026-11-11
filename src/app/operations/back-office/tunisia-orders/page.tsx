import { redirect } from "next/navigation";
import { commerceActor, CommerceError, requireMarket } from "@/lib/commerce/access";
import { operator, ExperienceError } from "@/lib/experience/access";
import {BackOfficeSection} from "../section";
import { OrdersDesk } from "@/components/orders-desk/orders-desk";

export const metadata = { title: "Orders desk | Plentovo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await operator();
  } catch (e) {
    if (e instanceof ExperienceError && e.status === 401) redirect("/login?callbackUrl=%2Foperations%2Fback-office%2Ftunisia-orders");
    try {
      requireMarket(await commerceActor(), 'TN');
    } catch (error) {
      return <main className="mx-auto max-w-xl px-6 py-24"><p>{error instanceof CommerceError ? error.message : "The orders desk is temporarily unavailable."}</p></main>;
    }
  }
  return (
    <BackOfficeSection active="Orders">
      <OrdersDesk embedded />
    </BackOfficeSection>
  );
}
