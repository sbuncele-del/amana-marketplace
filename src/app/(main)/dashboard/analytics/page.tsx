"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, Globe, BarChart3, Loader2, Eye,
} from "lucide-react";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

interface AnalyticsData {
  monthlyRevenue: { month: string; amount: number }[];
  topProducts: { name: string; revenue: number; orders: number }[];
  topCorridors: { from: string; to: string; orders: number; revenue: number }[];
  totalViews: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-500">
        Failed to load analytics data.
      </div>
    );
  }

  const { monthlyRevenue, topProducts, topCorridors, totalViews } = data;
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.amount), 1);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Analytics</h1>
          <p className="text-gray-500 text-sm">Track your store performance and trade corridors</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Eye className="w-4 h-4" />
          {totalViews.toLocaleString()} total views
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D4A843]" /> Monthly Revenue
          </h2>
          <span className="text-sm text-gray-400">Last 6 months</span>
        </div>
        {monthlyRevenue.every((m) => m.amount === 0) ? (
          <div className="text-center py-12 text-gray-400 text-sm">No revenue data yet</div>
        ) : (
          <div className="flex items-end gap-4 h-48">
            {monthlyRevenue.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold">{formatCurrency(m.amount, "USD")}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#D4A843] to-[#D4A843]/60 transition-all hover:from-[#D4A843] hover:to-[#D4A843]"
                  style={{ height: `${(m.amount / maxRevenue) * 100}%`, minHeight: m.amount > 0 ? "4px" : "0" }}
                />
                <span className="text-xs text-gray-400">{m.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2E7D32]" /> Top Products
          </h2>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No product data yet</div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-[#D4A843]/10 flex items-center justify-center text-xs font-bold text-[#D4A843]">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{product.name}</div>
                    <div className="text-xs text-gray-400">{product.orders} orders</div>
                  </div>
                  <span className="font-bold text-sm">{formatCurrency(product.revenue, "USD")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trade Corridors */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#D4A843]" /> Trade Corridors
          </h2>
          {topCorridors.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No cross-border trades yet</div>
          ) : (
            <div className="space-y-4">
              {topCorridors.map((corridor) => (
                <div key={`${corridor.from}-${corridor.to}`} className="flex items-center gap-4">
                  <div className="text-lg">
                    {getCountryFlag(corridor.from)} → {getCountryFlag(corridor.to)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{corridor.from} → {corridor.to}</div>
                    <div className="text-xs text-gray-400">{corridor.orders} orders</div>
                  </div>
                  <span className="font-bold text-sm">{formatCurrency(corridor.revenue, "USD")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
