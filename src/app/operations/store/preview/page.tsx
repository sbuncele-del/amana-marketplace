import Storefront from "@/components/shop/storefront";
import { commerceActor, CommerceError } from "@/lib/commerce/access";
import { canCms, storeSchema } from "@/lib/cms/domain";
import { cmsDocument } from "@/lib/cms/store";
import { defaultStore } from "@/lib/cms/defaults";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Draft storefront preview",
  robots: { index: false, follow: false },
};
export default async function Preview() {
  const a = await commerceActor();
  if (!canCms(a.admin, a.grants, "storefront"))
    throw new CommerceError(403, "Marketing access required.");
  const doc = await cmsDocument("storefront", "plentovo");
  return (
    <>
      <aside className="bg-amber-100 p-3 text-center text-sm">
        Saved draft preview · Products use published catalogue data.{" "}
        <Link href="/operations/store" className="underline">
          Back to editor
        </Link>
      </aside>
      <Storefront config={doc ? storeSchema.parse(doc.draft) : defaultStore} />
    </>
  );
}
