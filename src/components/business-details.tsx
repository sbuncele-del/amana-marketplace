import { business } from "@/lib/business";
export function BusinessDetails() {
  return (
    <section
      className="mt-7 rounded-xl border bg-white p-6"
      aria-labelledby="business-details"
    >
      <h2 id="business-details" className="text-xl font-bold">
        Who operates Plentovo?
      </h2>
      <p className="mt-3 text-sm leading-6">
        Plentovo is the trading brand of <strong>{business.legalName}</strong>.
      </p>
      <dl className="mt-4 space-y-3 text-sm leading-6">
        <div>
          <dt className="font-semibold">Company registration</dt>
          <dd>{business.registrationNumber}</dd>
        </div>
        <div>
          <dt className="font-semibold">
            Registered office — South Africa
          </dt>
          <dd>{business.registeredOffice}</dd>
        </div>
        <div>
          <dt className="font-semibold">Customer care</dt>
          <dd>
            <a
              className="text-red-700 underline"
              href={"tel:" + business.phoneHref}
            >
              {business.phone}
            </a>
            <br />
            <a
              className="text-red-700 underline"
              href={"mailto:" + business.email}
            >
              {business.email}
            </a>
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-gray-500">
        This is our registered office, not an automatic returns or collection point. Contact customer support for the correct return instructions.
      </p>
    </section>
  );
}
