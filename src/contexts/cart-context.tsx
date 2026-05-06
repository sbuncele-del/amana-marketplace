"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: { title: string; handle: string; images: { url: string }[] };
  };
}

interface CartState {
  cartId: string | null;
  checkoutUrl: string | null;
  lines: CartLine[];
  totalAmount: { amount: string; currencyCode: string } | null;
  itemCount: number;
  loading: boolean;
}

interface CartContextValue extends CartState {
  addToCart: (merchandiseId: string, quantity?: number) => Promise<{ checkoutUrl: string }>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  goToCheckout: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_ID_KEY = "amana_shopify_cart_id";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({
    cartId: null,
    checkoutUrl: null,
    lines: [],
    totalAmount: null,
    itemCount: 0,
    loading: false,
  });

  // Restore cart from localStorage on mount
  useEffect(() => {
    const savedCartId = localStorage.getItem(CART_ID_KEY);
    if (savedCartId) {
      fetch(`/api/shopify/cart?cartId=${encodeURIComponent(savedCartId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.cartId) {
            setState(s => ({
              ...s,
              cartId: data.cartId,
              checkoutUrl: data.checkoutUrl,
              lines: data.lines ?? [],
              totalAmount: data.totalAmount,
              itemCount: (data.lines ?? []).reduce((sum: number, l: CartLine) => sum + l.quantity, 0),
            }));
          } else {
            localStorage.removeItem(CART_ID_KEY);
          }
        })
        .catch(() => localStorage.removeItem(CART_ID_KEY));
    }
  }, []);

  const addToCart = useCallback(async (merchandiseId: string, quantity = 1) => {
    setState(s => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/shopify/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchandiseId,
          quantity,
          cartId: state.cartId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to add to cart");
      const data = await res.json();

      localStorage.setItem(CART_ID_KEY, data.cartId);
      setState(s => ({
        ...s,
        cartId: data.cartId,
        checkoutUrl: data.checkoutUrl,
        lines: data.lines ?? [],
        totalAmount: data.totalAmount,
        itemCount: (data.lines ?? []).reduce((sum: number, l: CartLine) => sum + l.quantity, 0),
        loading: false,
      }));

      return { checkoutUrl: data.checkoutUrl };
    } catch (err) {
      setState(s => ({ ...s, loading: false }));
      throw err;
    }
  }, [state.cartId]);

  const updateLine = useCallback(async (lineId: string, quantity: number) => {
    if (!state.cartId) return;
    setState(s => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/shopify/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: state.cartId, lineId, quantity }),
      });
      const data = await res.json();
      setState(s => ({
        ...s,
        lines: data.lines ?? [],
        totalAmount: data.totalAmount,
        itemCount: (data.lines ?? []).reduce((sum: number, l: CartLine) => sum + l.quantity, 0),
        loading: false,
      }));
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [state.cartId]);

  const removeLine = useCallback(async (lineId: string) => {
    if (!state.cartId) return;
    setState(s => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/shopify/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: state.cartId, removeLineIds: [lineId] }),
      });
      const data = await res.json();
      setState(s => ({
        ...s,
        lines: data.lines ?? [],
        totalAmount: data.totalAmount,
        itemCount: (data.lines ?? []).reduce((sum: number, l: CartLine) => sum + l.quantity, 0),
        loading: false,
      }));
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [state.cartId]);

  const goToCheckout = useCallback(() => {
    if (state.checkoutUrl) window.location.href = state.checkoutUrl;
  }, [state.checkoutUrl]);

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_ID_KEY);
    setState({ cartId: null, checkoutUrl: null, lines: [], totalAmount: null, itemCount: 0, loading: false });
  }, []);

  return (
    <CartContext.Provider value={{ ...state, addToCart, updateLine, removeLine, goToCheckout, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
