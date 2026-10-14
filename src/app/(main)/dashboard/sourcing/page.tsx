import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import catalogue from "@/data/sourcing/perfect-dealz-air-fryers.json";

export default async function SourcingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  // Commercial supplier costs remain on this authenticated server-rendered page.
  const money = (amount: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount);
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-28">
      <p className="text-sm font-semibold text-amber-700">Afrishelf · Supplier sourcing</p>
      <h1 className="mt-2 text-3xl font-bold">First appliance collection</h1>
      <p className="mt-3 text-gray-600">Two supplier product drafts, prepared for customer-first dropshipping. These are not published products and cannot be purchased.</p>
      <p className="mt-2 text-sm text-gray-500">Supplier: {catalogue.supplier} · Source checked: {catalogue.checkedAt}</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {catalogue.products.map((product) => {
          const shipping = catalogue.shipping.estimatedSmallParcel;
          const paymentAllowance = (product.proposedPrice + shipping) * catalogue.paymentAllowancePercent / 100;
          const contribution = product.proposedPrice - product.supplierCost - paymentAllowance - catalogue.returnsAllowance;
          return (
            <article key={product.slug} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Draft · Supplier confirmation pending</span>
              <h2 className="mt-4 text-xl font-bold">{product.name}</h2>
              <p className="mt-2 text-sm text-gray-500">SKU {product.supplierSku} · {product.colours.join(" / ")}</p>
              <p className="mt-4 text-sm text-gray-600">{product.description}</p>
              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><dt>Supplier cost</dt><dd>{money(product.supplierCost)}</dd></div>
                <div className="flex justify-between"><dt>Proposed item price</dt><dd>{money(product.proposedPrice)}</dd></div>
                <div className="flex justify-between"><dt>Provisional customer delivery</dt><dd>{money(shipping)}</dd></div>
                <div className="flex justify-between"><dt>Payment allowance (6% of collected total)</dt><dd>{money(paymentAllowance)}</dd></div>
                <div className="flex justify-between"><dt>Returns allowance</dt><dd>{money(catalogue.returnsAllowance)}</dd></div>
                <div className="flex justify-between border-t pt-2 font-bold"><dt>Estimated contribution</dt><dd>{money(contribution)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-gray-500">Assumes delivery collected equals supplier delivery cost. Excludes advertising, fixed costs and tax. Payment allowance is an estimate, not a verified fee. Source availability is not reserved stock.</p>
              <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block font-semibold text-amber-700 underline">View supplier product</a>
              <h3 className="mt-5 font-semibold">Before activation</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">{product.unresolved.map(item => <li key={item}>{item}</li>)}</ul>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-gray-600">{catalogue.fulfilment}</p>
    </main>
  );
}
