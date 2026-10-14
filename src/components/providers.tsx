"use client";

import { SessionProvider } from "next-auth/react";
import {DeliveryProvider} from "@/contexts/delivery-context";
import { CartProvider } from "@/contexts/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DeliveryProvider><CartProvider>{children}</CartProvider></DeliveryProvider>
    </SessionProvider>
  );
}
