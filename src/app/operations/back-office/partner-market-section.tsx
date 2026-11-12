import { redirect } from "next/navigation";
import { commerceActor, CommerceError, type CommerceActor } from "@/lib/commerce/access";
import { permits } from "@/lib/commerce/domain";
import { experiencePool } from "@/lib/experience/store";
import { BackOfficeSection } from "./section";
import { PartnerDirectory } from "./partner-directory";

export async function PartnerMarketSection() {
  const active = "Suppliers";
  let actor: CommerceActor;
  let markets;
  try {
    actor = await commerceActor();
    const { rows } = await experiencePool().query<{ code: string; name: string; currency: string }>(
      "SELECT code,name,currency FROM commerce_markets ORDER BY code='ZA' DESC,name",
    );
    markets = rows.filter(market => permits(actor.admin, actor.grants, market.code));
  } catch (error) {
    if (error instanceof CommerceError && error.status === 401) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/operations/back-office/${active.toLowerCase()}`)}`);
    }
    return <BackOfficeSection active={active}><p>{error instanceof CommerceError ? error.message : "Commerce is temporarily unavailable."}</p></BackOfficeSection>;
  }
    return <BackOfficeSection active={active}>
      <PartnerDirectory markets={markets} admin={actor.admin} />
    </BackOfficeSection>;
}
