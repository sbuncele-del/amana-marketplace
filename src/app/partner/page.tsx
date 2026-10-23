import { redirect } from "next/navigation";
import { commerceActor, CommerceError } from "@/lib/commerce/access";
import { PartnerWorkspace } from "@/components/commerce/partner-workspace";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Partner workspace | Plentovo",
  robots: { index: false, follow: false },
};
export default async function Page() {
  try {
    await commerceActor();
  } catch (e) {
    if (e instanceof CommerceError && e.status === 401)
      redirect("/login?callbackUrl=%2Fpartner");
    return (
      <main className="p-10">
        Partner services are temporarily unavailable. Please try again shortly.
      </main>
    );
  }
  return <PartnerWorkspace />;
}
