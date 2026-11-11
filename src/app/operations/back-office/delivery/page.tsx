import {commerceActor} from '@/lib/commerce/access';
import {CommerceConsole} from '@/components/commerce/console';
import {BackOfficeSection} from '../section';

export default async function DeliveryPage() {
  const actor = await commerceActor();
  return <BackOfficeSection active="Delivery">
    <a className="my-5 inline-block font-semibold text-red-700 underline" href="/operations/back-office?view=delivery">View order tracking queue</a>
    {actor.admin || actor.grants.length ? <CommerceConsole initialTab="Fulfilment" initialMarket={actor.admin || actor.grants.some(grant => !grant.market_code) ? 'ZA' : actor.grants[0].market_code || 'ZA'} /> :
      <p className="mt-3">Shipment management requires commerce access.</p>}
  </BackOfficeSection>;
}
