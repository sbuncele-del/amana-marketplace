"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Truck, Shield, CheckCircle, XCircle, Loader2, Eye,
  Package, Clock, AlertTriangle, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  PENDING: "gray", PAID: "blue", ESCROW_HELD: "gold", SHIPPED: "blue", IN_TRANSIT: "blue",
  BUYER_VERIFYING: "orange", COMPLETED: "green", DISPUTED: "red",
  DELIVERED: "blue", REFUNDED: "gray", CANCELLED: "gray",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending", PAID: "Paid", ESCROW_HELD: "Escrow Held", SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit", DELIVERED: "Delivered",
  BUYER_VERIFYING: "Buyer Verifying", COMPLETED: "Completed",
  DISPUTED: "Disputed", REFUNDED: "Refunded", CANCELLED: "Cancelled",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [shipModal, setShipModal] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
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
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleShip(orderNumber: string) {
    setActionLoading(orderNumber);
    setActionError("");
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship", trackingNumber: trackingInput || undefined }),
      });
      if (res.ok) {
        setShipModal(null);
        setTrackingInput("");
        await fetchOrders();
      } else {
        const data = await res.json();
        setActionError(data.error || "Failed to mark as shipped");
      }
    } catch {
      setActionError("Network error — please try again");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkDelivered(orderNumber: string) {
    setActionLoading(orderNumber);
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delivered" }),
      });
      if (res.ok) await fetchOrders();
    } catch { /* retry later */ }
    finally { setActionLoading(null); }
  }

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search && !o.product.toLowerCase().includes(search.toLowerCase()) && !o.buyer.toLowerCase().includes(search.toLowerCase()) && !o.orderNumber.toLowerCase().includes(search.toLowerCase())) return false;
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
          { key: "all", label: "All", icon: <Package className="w-3.5 h-3.5" /> },
          { key: "PENDING", label: "Pending", icon: <Clock className="w-3.5 h-3.5" /> },
          { key: "ESCROW_HELD", label: "In Escrow", icon: <Shield className="w-3.5 h-3.5" /> },
          { key: "SHIPPED", label: "Shipped", icon: <Truck className="w-3.5 h-3.5" /> },
          { key: "DELIVERED", label: "Delivered", icon: <Package className="w-3.5 h-3.5" /> },
          { key: "COMPLETED", label: "Completed", icon: <CheckCircle className="w-3.5 h-3.5" /> },
          { key: "DISPUTED", label: "Disputed", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.key ? "bg-[#D4A843] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-[#D4A843]/30"
            }`}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, buyer, or order number..." className="flex-1 text-sm focus:outline-none" />
        </div>
      </div>

      {/* Ship Modal */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="font-bold text-lg mb-1">Mark Order as Shipped</h3>
            <p className="text-sm text-gray-500 mb-4">Order {shipModal}</p>
            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
                {actionError}
              </div>
            )}
            <Input label="Tracking Number (optional)" value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)} placeholder="e.g. DHL1234567890" />
            <p className="text-xs text-gray-400 mt-1 mb-4">Enter the carrier tracking number so the buyer can track their shipment.</p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => handleShip(shipModal)} disabled={actionLoading === shipModal}>
                {actionLoading === shipModal ? <><Loader2 className="w-4 h-4 animate-spin" /> Shipping...</> : <><Send className="w-4 h-4" /> Confirm Shipped</>}
              </Button>
              <Button variant="outline" onClick={() => { setShipModal(null); setTrackingInput(""); setActionError(""); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

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
                  {order.destinationCountry ? ` → ${getCountryFlag(order.destinationCountry)} ${order.destinationCountry}` : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatCurrency(order.amount as number, order.currency)}</div>
                {order.escrowTransactionId && (
                  <div className="text-xs text-gray-400 font-mono">ESC: {order.escrowTransactionId.slice(0, 12)}...</div>
                )}
              </div>
            </div>

            {/* Action buttons based on status */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
              {order.status === "PENDING" && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Awaiting buyer payment
                </div>
              )}
              {order.status === "ESCROW_HELD" && (
                <>
                  <Button size="sm" onClick={() => setShipModal(order.orderNumber)} disabled={actionLoading === order.orderNumber}>
                    {actionLoading === order.orderNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />} Mark as Shipped
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/orders/${order.orderNumber}`)}>
                    <Eye className="w-3 h-3" /> View Details
                  </Button>
                </>
              )}
              {order.status === "SHIPPED" && (
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-blue-600 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> {order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "Shipped — no tracking"}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleMarkDelivered(order.orderNumber)} disabled={actionLoading === order.orderNumber}>
                    {actionLoading === order.orderNumber ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />} Mark Delivered
                  </Button>
                </div>
              )}
              {(order.status === "DELIVERED" || order.status === "BUYER_VERIFYING") && (
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
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-red-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Dispute opened — respond within 48hrs
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => router.push(`/orders/${order.orderNumber}`)}>
                    <AlertTriangle className="w-3 h-3" /> View & Respond
                  </Button>
                </div>
              )}
              {!["PENDING", "ESCROW_HELD", "DISPUTED"].includes(order.status) && (
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => router.push(`/orders/${order.orderNumber}`)}>
                  <Eye className="w-3 h-3" /> Details
                </Button>
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
