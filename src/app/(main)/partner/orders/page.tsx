import type { Metadata } from "next";
import { OrdersDesk } from "@/components/orders-desk/orders-desk";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };
export default function Page() {
  return <OrdersDesk />;
}
