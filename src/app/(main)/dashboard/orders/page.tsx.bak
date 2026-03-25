"use client";

import { useState, useEffect } from "react";
import { Search, Truck, Shield, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

interface OrderData {
  id: string;
  orderNumber: string;
  product: string;
  buyer: string;
  buyerCountry: string;
  amount: number;
  currency: string;
  status: string;
  escrowStatus: string;
  escrowTransactionId: string | null;
  trackingNumber: string | null;
  destinationCountry: string | null;
  date: string;
}

const statusColors: Record<string, "gold" | "blue" | "orange" | "green" | "red" | "gray"> = {
  PENDING: "gray", ESCROW_HELD: "gold", SHIPPED: "blue", IN_TRANSIT: "blue",
  BUYER_VERIFYING: "orange", COMPLETED: "green", DISPUTED: "red",
  DELIVERED: "blue", REFUNDED: "gray", CANCELLED: "gray",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending", ESCROW_HELD: "Escrow Held", SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit", DELIVERED: "Delivered",
  BUYER_VERIFYING: "Buyer Verifying", COMPLETED: "Completed",
  DISPUTED: "Disputed", REFUNDED: "Refunded", CANCELLED: "Cancelled",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.orders || []).map((o: Record<string, unknown>) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          product: ((o.items as Record<string, unknown>[])?.[0] as Record<string, unknown>)
            ? (((o.items as Record<string, unknown>[])[0] as Record<string, unknown>).product as Record<string, unknown>)?.name ?? "—"
            : "—",
          buyer: (o.buyer as Record<string, unknown>)?.name ?? "—",
          buyerCountry: (o.buyer as Record<string, unknown>)?.country ?? "",
          amount: o.totalAmount,
          currency: o.currency,
          status: o.status,
          escrowStatus: o.escrowStatus,
          escrowTransactionId: o.escrowTransactionId,
          trackingNumber: o.trackingNumber,
          destinationCountry: o.destinationCountry,
          date: o.createdAt,
        }));
        setOrders(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search && !o.product.toLowerCase().includes(search.toLowerCase()) && !o.buyer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">Orders</h1>
        <p className="text-gray-500 text-sm">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "All" },
          { key: "ESCROW_HELD", label: "In Escrow" },
          { key: "SHIPPED", label: "Shipped" },
          { key: "BUYER_VERIFYING", label: "Verifying" },
          { key: "COMPLETED", label: "Completed" },
          { key: "DISPUTED", label: "Disputed" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.key ? "bg-[#D4A843] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-[#D4A843]/30"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product or buyer..." className="flex-1 text-sm focus:outline-none" />
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
                <Badge variant={statusColors[order.status] || "gray"}>{statusLabels[order.status] || order.status}</Badge>
              </div>
              <span className="text-sm text-gray-400">{new Date(order.date).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">{order.product}</h3>
                <p className="text-sm text-gray-500">
                  {order.buyer} · {getCountryFlag(order.buyerCountry)} {order.buyerCountry}
                  {order.destinationCountry ? ` → ${order.destinationCountry}` : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatCurrency(order.amount as number, order.currency)}</div>
                {order.escrowTransactionId && (
                  <div className="text-xs text-gray-400">Escrow: {order.escrowTransactionId}</div>
                )}
              </div>
            </div>

            {/* Action buttons based on status */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
              {order.status === "ESCROW_HELD" && (
                <>
                  <Button size="sm" variant="secondary"><Truck className="w-3 h-3" /> Mark as Shipped</Button>
                  <Button size="sm" variant="ghost"><Eye className="w-3 h-3" /> View Details</Button>
                </>
              )}
              {order.status === "SHIPPED" && order.trackingNumber && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" /> Tracking: {order.trackingNumber}
                </div>
              )}
              {order.status === "BUYER_VERIFYING" && (
                <div className="text-sm text-orange-600 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Buyer is inspecting the order (72hr window)
                </div>
              )}
              {order.status === "COMPLETED" && (
                <div className="text-sm text-[#2E7D32] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Funds released to your account
                </div>
              )}
              {order.status === "DISPUTED" && (
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Dispute opened — respond within 48hrs
                  <Button size="sm" variant="destructive" className="ml-auto">Respond</Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            {search || filter !== "all" ? "No orders match your filters." : "No orders yet."}
          </div>
        )}
      </div>
    </div>
  );
}
