'use client';
import {useEffect} from 'react';

// Tells the Google tag (loaded in the root layout, consent-gated) that a verified Ozow payment happened.
// Rendered only on the "Payment confirmed" state, which the webhook (not the browser return) controls.
// transaction_id is the order reference, so Google de-duplicates reloads; localStorage also guards re-fires.
export function PurchaseEvent({reference, value}: {reference: string; value: number}) {
  useEffect(() => {
    const key = 'plentovo-purchase-sent:' + reference;
    try { if (localStorage.getItem(key)) return; } catch {}
    const gtag = (window as unknown as {gtag?: (...args: unknown[]) => void}).gtag;
    if (typeof gtag !== 'function') return;
    gtag('event', 'purchase', {transaction_id: reference, value, currency: 'ZAR'});
    try { localStorage.setItem(key, '1'); } catch {}
  }, [reference, value]);
  return null;
}
