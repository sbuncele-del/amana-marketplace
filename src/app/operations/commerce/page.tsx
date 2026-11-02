import { redirect } from "next/navigation";
import { commerceActor, CommerceError } from "@/lib/commerce/access";
import { OpsShell } from "@/components/operations/shell";
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
      redirect("/login?callbackUrl=%2Foperations%2Fcommerce");
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
    <OpsShell title="Markets & fulfilment">
      <CommerceConsole
        initialMarket={
          actor.admin || actor.grants.some((g) => !g.market_code)
            ? "ZA"
            : actor.grants[0].market_code || "ZA"
        }
      />
    </OpsShell>
  );
}
