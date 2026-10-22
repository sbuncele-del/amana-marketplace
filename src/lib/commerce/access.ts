import "server-only";
import { auth } from "@/lib/auth";
import { experiencePool } from "@/lib/experience/store";
import { ensureCommerce } from "./store";
import { permits, type Grant } from "./domain";
export class CommerceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type CommerceActor = {
  id: string;
  name: string;
  admin: boolean;
  grants: Grant[];
  partners: string[];
};
export async function commerceActor(): Promise<CommerceActor> {
  const session = await auth();
  if (!session?.user?.id) throw new CommerceError(401, "Please sign in.");
  await ensureCommerce();
  const user = (
    await experiencePool().query(
      'SELECT id,name,role,"isActive" FROM "User" WHERE id=$1',
      [session.user.id],
    )
  ).rows[0];
  if (!user?.isActive)
    throw new CommerceError(403, "Your account is inactive.");
  const [staff, partners] = await Promise.all([
    experiencePool().query(
      "SELECT role,market_code FROM commerce_staff WHERE user_id=$1 AND active=true",
      [user.id],
    ),
    experiencePool().query(
      "SELECT m.partner_id FROM commerce_partner_members m JOIN commerce_partners p ON p.id=m.partner_id WHERE m.user_id=$1 AND m.active=true AND p.status='APPROVED'",
      [user.id],
    ),
  ]);
  return {
    id: user.id,
    name: user.name,
    admin: user.role === "ADMIN",
    grants: staff.rows,
    partners: partners.rows.map((p) => p.partner_id),
  };
}
export function requireMarket(a: CommerceActor, market: string, write = false) {
  if (!permits(a.admin, a.grants, market, write))
    throw new CommerceError(
      403,
      "This market is outside your assigned access.",
    );
}
export function requireAdmin(a: CommerceActor) {
  if (!a.admin)
    throw new CommerceError(403, "An administrator must approve this change.");
}
export function requirePartner(a: CommerceActor, id: string) {
  if (!a.partners.includes(id))
    throw new CommerceError(
      403,
      "This fulfilment partner is outside your assigned access.",
    );
}
