"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign, Package, ShoppingCart,
  ArrowUpRight, Shield, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalRevenue: number;
    activeProducts: number;
    totalProducts: number;
    openOrders: number;
    trustScore: number;
    avgRating: number;
    totalSales: number;
  };
  pipeline: {
    awaitingPayment: number;
    awaitingPaymentAmount: number;
    inEscrow: number;
    inEscrowAmount: number;
    buyerVerifying: number;
    buyerVerifyingAmount: number;
    readyToRelease: number;
    readyToReleaseAmount: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    product: string;
    buyer: string;
    buyerCountry: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
  }[];
}

const statusColors: Record<string, "gold" | "blue" | "orange" | "green" | "red" | "gray"> = {
  ESCROW_HELD: "gold",
  SHIPPED: "blue",
  BUYER_VERIFYING: "orange",
  COMPLETED: "green",
  DISPUTED: "red",
  PENDING: "gray",
};

const statusLabels: Record<string, string> = {
  ESCROW_HELD: "Escrow Held",
  SHIPPED: "Shipped",
  BUYER_VERIFYING: "Buyer Verifying",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  PENDING: "Pending",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500 text-center py-20">Failed to load dashboard</p>;

  const statCards = [
    { label: "Total Revenue", value: formatCurrency(data.stats.totalRevenue, "USD"), icon: <DollarSign className="w-5 h-5" /> },
    { label: "Active Products", value: String(data.stats.activeProducts), icon: <Package className="w-5 h-5" /> },
    { label: "Open Orders", value: String(data.stats.openOrders), icon: <ShoppingCart className="w-5 h-5" /> },
    { label: "Trust Score", value: String(data.stats.trustScore), icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {session?.user?.name || "Seller"}</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button size="sm"><Package className="w-4 h-4" /> Add Product</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843]">
                {stat.icon}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#2E7D32]">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div className="text-2xl font-extrabold">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Escrow Pipeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#D4A843]" />
          Escrow Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Awaiting Payment", count: data.pipeline.awaitingPayment, amount: data.pipeline.awaitingPaymentAmount },
            { label: "In Escrow", count: data.pipeline.inEscrow, amount: data.pipeline.inEscrowAmount },
            { label: "Buyer Verifying", count: data.pipeline.buyerVerifying, amount: data.pipeline.buyerVerifyingAmount },
            { label: "Ready to Release", count: data.pipeline.readyToRelease, amount: data.pipeline.readyToReleaseAmount },
          ].map((pipeline) => (
            <div key={pipeline.label} className="bg-[#FAF8F5] rounded-lg p-4 text-center">
              <div className="text-xl font-bold">{pipeline.count}</div>
              <div className="text-xs text-gray-500 mb-1">{pipeline.label}</div>
              <div className="text-sm font-semibold text-[#D4A843]">{formatCurrency(pipeline.amount, "USD")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-bold">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-[#D4A843] hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Order</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Buyer</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-mono font-semibold">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm">{order.product}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.buyer} · {order.buyerCountry}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(order.amount, order.currency)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusColors[order.status] || "gray"}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{timeAgo(order.date)}</td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No orders yet. Products will appear here once buyers place orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
