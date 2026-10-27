import { NextRequest, NextResponse } from "next/server";
import { commerceActor } from "@/lib/commerce/access";
import { safeReturnPath } from "@/lib/access/domain";
export async function GET(r: NextRequest) {
  try {
    const a = await commerceActor();
    const requested = safeReturnPath(r.nextUrl.searchParams.get("next"));
    const cms =
      a.admin ||
      a.grants.some(
        (g) =>
          (!g.market_code || g.market_code === "ZA") &&
          ["MANAGER", "CATALOGUE", "MARKETING"].includes(g.role),
      );
    let destination =
      requested ||
      (cms
        ? "/operations/store"
        : a.grants.length
          ? "/operations/commerce"
          : a.partners.length
            ? "/partner"
            : "/account");
    if (!requested && destination === "/account") {
      const { experiencePool } = await import("@/lib/experience/store");
      const membership = await experiencePool().query(
        "SELECT 1 FROM experience_members WHERE user_id=$1 AND active=true LIMIT 1",
        [a.id],
      );
      if (membership.rowCount) destination = "/operations";
    }
    return NextResponse.json(
      { destination },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { destination: "/account" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
