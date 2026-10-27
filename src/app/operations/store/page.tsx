import { StoreConsole } from "@/components/cms/store-console";
import { commerceActor } from "@/lib/commerce/access";
import { canCms } from "@/lib/cms/domain";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Store management | Plentovo",
  robots: { index: false, follow: false },
};
export default async function StorePage() {
  const a = await commerceActor();
  if (
    !canCms(a.admin, a.grants, "product") &&
    !canCms(a.admin, a.grants, "storefront")
  )
    return (
      <main className="p-8">
        Your administrator must assign catalogue, marketing or manager access.
      </main>
    );
  return (
    <StoreConsole
      readOnly={process.env.VERCEL_ENV === "preview"}
      initialKind={
        canCms(a.admin, a.grants, "product") ? "product" : "storefront"
      }
    />
  );
}
