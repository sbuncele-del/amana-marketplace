import { redirect } from "next/navigation";
import { commerceActor, CommerceError } from "@/lib/commerce/access";
import {BackOfficeSection} from "../section";
import { CommerceConsole } from "@/components/commerce/console";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Commerce operations | Plentovo",
  robots: { index: false, follow: false },
};
export default async function Page() {
  let actor;
  try {
    actor = await commerceActor();
  } catch (e) {
    if (e instanceof CommerceError && e.status === 401)
      redirect("/login?callbackUrl=%2Foperations%2Fback-office%2Fsuppliers");
    return (
      <main className="p-10">
        Commerce is temporarily unavailable. Please try again shortly.
      </main>
    );
  }
  if (!actor.admin && !actor.grants.length)
    return (
      <main className="p-10">
        Your administrator must assign commerce access to your account.
      </main>
    );
  return (
    <BackOfficeSection active="Suppliers">
      <CommerceConsole initialTab="Partners"
        initialMarket={
          actor.admin || actor.grants.some((g) => !g.market_code)
            ? "ZA"
            : actor.grants[0].market_code || "ZA"
        }
      />
    </BackOfficeSection>
  );
}
