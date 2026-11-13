'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useCart} from '@/contexts/cart-context';

export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}

export function ClearCartWhenPaid() {
  const {clearCart} = useCart();
  useEffect(() => { clearCart(); try { sessionStorage.removeItem('plentovo-ozow-checkout'); } catch {} }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
