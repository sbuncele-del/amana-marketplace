import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {title: 'Plentovo emails', robots: {index: false}};

const messages: Record<string, {title: string; body: string}> = {
  confirmed: {title: 'You are on the list', body: 'Thank you for confirming. We will keep our emails useful and occasional.'},
  unsubscribed: {title: 'You have been unsubscribed', body: 'You will not receive any more marketing emails from Plentovo. Order and account messages, where relevant, will still reach you.'},
  invalid: {title: 'This link is no longer valid', body: 'It may have expired or already been used. If you still want updates, sign up again from the Plentovo homepage.'},
  check: {title: 'Check your inbox', body: 'We have sent you an email. Open it and tap the confirmation button to finish signing up.'},
};

export default async function NewsletterPage({searchParams}: {searchParams: Promise<{s?: string}>}) {
  const {s} = await searchParams;
  const m = messages[s || ''] || messages.invalid;
  return (
    <main id="main-content" className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-extrabold">{m.title}</h1>
      <p className="mt-4 text-gray-600">{m.body}</p>
      <Link href="/browse" className="mt-8 inline-block rounded-lg bg-[#DA292B] px-6 py-3 font-bold text-white">Browse Plentovo</Link>
    </main>
  );
}
