import type {Metadata} from 'next';

export const metadata: Metadata = {title: 'Unsubscribe from Plentovo emails', robots: {index: false}};

// A button rather than an automatic unsubscribe, so link scanners that pre-fetch URLs cannot unsubscribe anyone.
export default async function UnsubscribePage({searchParams}: {searchParams: Promise<{token?: string}>}) {
  const {token = ''} = await searchParams;
  return (
    <main id="main-content" className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-extrabold">Unsubscribe from Plentovo emails?</h1>
      <p className="mt-4 text-gray-600">We are sorry to see you go. Confirm below and you will not receive any more marketing emails from us.</p>
      <form method="post" action="/api/marketing/unsubscribe" className="mt-8">
        <input type="hidden" name="token" value={token} />
        <button className="rounded-lg bg-[#171B20] px-6 py-3 font-bold text-white">Yes, unsubscribe me</button>
      </form>
    </main>
  );
}
