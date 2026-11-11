'use client';

import {useEffect, useState} from 'react';
import {ImageOff} from 'lucide-react';
import type {BackOfficeOrder, Market} from '@/lib/back-office';
import type {OrderItemPhoto} from '@/lib/order-item-image';
import styles from '../../experience-preview/preview.module.css';

function ItemPhoto({photo, name}: {photo?: OrderItemPhoto; name: string}) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed) return <div className={styles.thumbnail} title="Photo unavailable" aria-label="Photo unavailable" role="img">
    <ImageOff size={23} aria-hidden="true" />
  </div>;
  return <a className={styles.thumbnail} href={photo.url} target="_blank" rel="noreferrer" aria-label={`Open photo of ${name} in a new tab`}>
    {/* Use the original order or supplier asset without introducing an image proxy. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={photo.url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  </a>;
}

export function OrderItems({order, market, formatAmount}: {order: BackOfficeOrder; market: Market; formatAmount: (amount: number) => string}) {
  const [photos, setPhotos] = useState<(OrderItemPhoto | null)[]>([]);
  const needsLookup = market === 'ZA' && order.items.some(item => item.hasCartId && !item.photo);
  useEffect(() => {
    if (!needsLookup) return;
    const controller = new AbortController();
    fetch(`/api/operations/back-office/item-images?order=${encodeURIComponent(order.id)}`, {signal: controller.signal, cache: 'no-store'})
      .then(async response => response.ok ? await response.json() as {photos: (OrderItemPhoto | null)[]} : null)
      .then(data => {if (!controller.signal.aborted && data) setPhotos(data.photos);})
      .catch(() => { /* Order details remain usable if a supplier photo is unavailable. */ });
    return () => controller.abort();
  }, [needsLookup, order.id]);

  return <section className={styles.items}>
    <h3>{market === 'ZA' && order.bucket === 'quote' ? 'Quote items' : 'Order items'}</h3>
    {order.items.map((item, index) => {
      const photo = item.photo ?? photos[index] ?? undefined;
      return <div className={styles.line} key={index}>
        <ItemPhoto key={photo?.url} photo={photo} name={item.name} />
        <div className="min-w-0 break-words">
          <strong>{item.name} × {item.quantity}</strong>
          {(item.option || item.sku) && <small>{[item.option, item.sku].filter(Boolean).join(' · ')}</small>}
          {photo && !photo.variant && <small>Product photo</small>}
        </div>
        {item.unit !== null && <span>{formatAmount(item.unit * item.quantity)}</span>}
      </div>;
    })}
  </section>;
}
