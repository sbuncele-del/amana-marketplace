"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Shield, Truck, Clock, AlertTriangle, Package,
  ArrowRight, Loader2, Copy, ExternalLink, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag, timeAgo } from "@/lib/utils";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  escrowStatus: string;
  subtotal: number;
  shippingCost: number;
  escrowFee: number;
  platformFee: number;
  sellerPayout: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentLink: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  originCountry: string | null;
  destinationCountry: string | null;
  isCrossBorder: boolean;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { name: string; slug: string; images: string[] | null; originCountry: string };
  }[];
  buyer: { name: string; country: string; email?: string };
  seller: {
    name: string;
    country: string;
    sellerProfile?: { storeName: string; trustScore: number; isVerified: boolean };
  };
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string | null;
    zip: string | null;
    country: string;
  } | null;
  events: { id: string; type: string; description: string; createdAt: string }[];
  dispute: { status: string; reason: string } | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  PENDING: { icon: <Clock className="w-5 h-5" />, color: "text-gray-600", bg: "bg-gray-50", label: "Awaiting Payment" },
  PAID: { icon: <CheckCircle className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50", label: "Payment Received" },
  ESCROW_HELD: { icon: <Shield className="w-5 h-5" />, color: "text-amber-600", bg: "bg-amber-50", label: "Funds in Escrow" },
  SHIPPED: { icon: <Truck className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50", label: "Shipped" },
  IN_TRANSIT: { icon: <Truck className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50", label: "In Transit" },
  DELIVERED: { icon: <Package className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50", label: "Delivered — Verify Now" },
  BUYER_VERIFYING: { icon: <Clock className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-50", label: "Buyer Verifying" },
  COMPLETED: { icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50", label: "Completed" },
  DISPUTED: { icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-600", bg: "bg-red-50", label: "Disputed" },
  REFUNDED: { icon: <XCircle className="w-5 h-5" />, color: "text-red-600", bg: "bg-red-50", label: "Refunded" },
  CANCELLED: { icon: <XCircle className="w-5 h-5" />, color: "text-gray-600", bg: "bg-gray-50", label: "Cancelled" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderNumber = params.orderNumber as string;
  const paymentComplete = searchParams.get("payment") === "complete";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      } else {
        setError("Order not found");
      }
    } catch {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleAction = async (action: string, extra?: Record<string, string>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        await fetchOrder();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 bg-[#FAF8F5] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="pt-24 pb-16 bg-[#FAF8F5] min-h-screen flex flex-col items-center justify-center gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">{error || "Order not found"}</p>
        <Link href="/dashboard/orders">
          <Button>Go to Orders</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <div className="pt-24 pb-16 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Payment success banner */}
        {paymentComplete && order.status === "PENDING" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Payment Processing</h4>
              <p className="text-sm">Your payment is being confirmed. This page will update automatically once funds are secured in escrow.</p>
            </div>
          </div>
        )}

        {paymentComplete && order.status === "ESCROW_HELD" && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Payment Successful!</h4>
              <p className="text-sm">Your funds are securely held in escrow. The seller has been notified to prepare your order.</p>
            </div>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-extrabold">Order {order.orderNumber}</h1>
                <button onClick={copyOrderNumber} className="text-gray-400 hover:text-gray-600">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Placed {timeAgo(new Date(order.createdAt))} ·{" "}
                {order.isCrossBorder ? (
                  <span>
                    {getCountryFlag(order.originCountry || "")} → {getCountryFlag(order.destinationCountry || "")}{" "}
                    <Badge variant="gold" className="text-[10px]">Cross-border</Badge>
                  </span>
                ) : (
                  <span>Domestic shipment</span>
                )}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bg} ${status.color}`}>
              {status.icon}
              <span className="font-semibold text-sm">{status.label}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Items */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold mb-4">Order Items</h2>
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.product.slug}`} className="font-semibold text-sm hover:text-[#D4A843] truncate block">
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {getCountryFlag(item.product.originCountry)} {item.product.originCountry} · Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-bold">{formatCurrency(item.price * item.quantity, order.currency)}</div>
                </div>
              ))}
            </div>

            {/* Escrow Progress */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#D4A843]" /> Escrow Progress
              </h2>
              <div className="space-y-1">
                {[
                  { step: "Order Created", done: true },
                  { step: "Payment Received", done: ["ESCROW_HELD", "SHIPPED", "IN_TRANSIT", "DELIVERED", "BUYER_VERIFYING", "COMPLETED"].includes(order.status) },
                  { step: "Funds Held in Escrow", done: ["ESCROW_HELD", "SHIPPED", "IN_TRANSIT", "DELIVERED", "BUYER_VERIFYING", "COMPLETED"].includes(order.status) },
                  { step: "Seller Ships", done: ["SHIPPED", "IN_TRANSIT", "DELIVERED", "BUYER_VERIFYING", "COMPLETED"].includes(order.status) },
                  { step: "Delivery Confirmed", done: ["DELIVERED", "BUYER_VERIFYING", "COMPLETED"].includes(order.status) },
                  { step: "Buyer Approves (72hr window)", done: order.status === "COMPLETED" },
                  { step: "Funds Released to Seller", done: order.status === "COMPLETED" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      s.done ? "bg-[#2E7D32] text-white" : "bg-gray-100 text-gray-400"
                    }`}>
                      {s.done ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm ${s.done ? "text-gray-700 font-medium" : "text-gray-400"}`}>{s.step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer Actions */}
            {order.status === "PENDING" && order.paymentLink && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-bold text-amber-800 mb-2">Complete Your Payment</h3>
                <p className="text-sm text-amber-600 mb-4">Your order is reserved. Complete payment to secure it in escrow.</p>
                <a href={order.paymentLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full sm:w-auto">
                    Pay {formatCurrency(order.totalAmount, order.currency)} <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            )}

            {order.status === "DELIVERED" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-blue-800 mb-2">Verify Your Delivery</h3>
                <p className="text-sm text-blue-600 mb-4">
                  Your order has been delivered. You have 72 hours to inspect and approve, or open a dispute.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => handleAction("approve")} disabled={actionLoading}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve & Release Funds
                  </Button>
                  <Button variant="ghost" className="text-red-600" onClick={() => handleAction("dispute")} disabled={actionLoading}>
                    <AlertTriangle className="w-4 h-4 mr-2" /> Open Dispute
                  </Button>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold mb-4">Order Timeline</h2>
              <div className="space-y-4">
                {order.events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#D4A843] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{event.description}</p>
                      <p className="text-xs text-gray-400">{timeAgo(new Date(event.createdAt))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(order.subtotal || 0, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Escrow Fee (1.5%)</span>
                  <span>{formatCurrency(order.escrowFee || 0, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{order.shippingCost === 0 ? "Free" : formatCurrency(order.shippingCost, order.currency)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Total Paid</span>
                  <span className="text-[#D4A843]">{formatCurrency(order.totalAmount, order.currency)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Platform fee (5%)</span>
                    <span>{formatCurrency(order.platformFee || 0, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-600 font-medium mt-1">
                    <span>Seller receives</span>
                    <span>{formatCurrency(order.sellerPayout || 0, order.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping */}
            {order.shippingAddress && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold mb-3">Shipping To</h3>
                <p className="text-sm">{order.shippingAddress.fullName}</p>
                <p className="text-sm text-gray-500">{order.shippingAddress.street}</p>
                <p className="text-sm text-gray-500">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p className="text-sm text-gray-500">{order.shippingAddress.country}</p>
                {order.trackingNumber && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-400">Tracking Number</p>
                    <p className="text-sm font-mono font-bold">{order.trackingNumber}</p>
                  </div>
                )}
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4A843]/10 flex items-center justify-center font-bold text-[#D4A843]">
                  {(order.seller.sellerProfile?.storeName || order.seller.name)?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{order.seller.sellerProfile?.storeName || order.seller.name}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {getCountryFlag(order.seller.country)} {order.seller.country}
                    {order.seller.sellerProfile?.isVerified && (
                      <Badge variant="green" className="text-[10px] py-0 ml-1">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Back link */}
            <Link href="/dashboard/orders" className="flex items-center gap-2 text-sm text-[#D4A843] hover:underline">
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to all orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
