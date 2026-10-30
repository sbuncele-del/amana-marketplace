'use client';
import {useEffect} from 'react';
import {useCart} from '@/contexts/cart-context';

export function ClearCart() {
  const {clearCart} = useCart();
  useEffect(() => { clearCart(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
