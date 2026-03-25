"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, Package, ShoppingCart, Shield,
  AlertTriangle, Globe, TrendingUp, Loader2, CheckCircle,
  XCircle, UserCheck, UserX, DollarSign, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag, timeAgo } from "@/lib/utils";

interface AdminData {
  stats: {
    totalUsers: number;
    newUsersThisMonth: number;
    totalProducts: number;
    newProductsThisMonth: number;
    totalOrders: number;
    gmv: number;
    openDisputes: number;
    pendingApproval: number;
  };
  platformHealth: {
    escrowResolutionRate: string;
    sellerVerificationRate: string;
    repeatBuyerRate: string;
  };
  platformRevenue: {
    totalCommission: number;
    completedGMV: number;
    completedOrders: number;
  };
  recentUsers: {
    id: string;
    name: string;
    email: string;
    country: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    _count: { buyerOrders: number; products: number };
  }[];
  disputes: {
    id: string;
    reason: string;
    description: string;
    status: string;
    createdAt: string;
    order: {
      orderNumber: string;
      totalAmount: number;
      currency: string;
      buyer: { name: string };
      seller: { name: string; sellerProfile: { storeName: string } | null };
    };
  }[];
  corridors: { origin: string; destination: string; orders: number; gmv: number }[];
  escrowBreakdown: { status: string; count: number; amount: number }[];
}

type Tab = "overview" | "users" | "products" | "disputes" | "corridors";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin");
      if (res.status === 403) { setError("Admin access required"); return; }
      if (res.ok) { setData(await res.json()); }
      else { setError("Failed to load admin data"); }
    } catch { setError("Failed to connect"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAction(action: string, targetId: string, extra?: Record<string, unknown>) {
    setActionLoading(`${action}_${targetId}`);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetId, data: extra }),
      });
      if (res.ok) { await fetchData(); }
      else { const d = await res.json(); alert(d.error || "Action failed"); }
    } catch { alert("Action failed"); }
    finally { setActionLoading(null); }
  }

  const isActioning = (action: string, id: string) => actionLoading === `${action}_${id}`;

  const tabs = [
    { key: "overview" as Tab, label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "users" as Tab, label: "Users", icon: <Users className="w-4 h-4" /> },
    { key: "disputes" as Tab, label: "Disputes", icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "corridors" as Tab, label: "Corridors", icon: <Globe className="w-4 h-4" /> },
  ];

  if (loading) return (
    <div className="pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
    </div>
  );

  if (error) return (
    <div className="pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { stats, platformHealth, platformRevenue } = data;

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), change: `+${stats.newUsersThisMonth} this month`, icon: <Users className="w-5 h-5" /> },
    { label: "Active Products", value: stats.totalProducts.toLocaleString(), change: `+${stats.newProductsThisMonth} this month · ${stats.pendingApproval} pending`, icon: <Package className="w-5 h-5" /> },
    { label: "Total Orders", value: stats.totalOrders.toLocaleString(), change: `${formatCurrency(stats.gmv)} GMV`, icon: <ShoppingCart className="w-5 h-5" /> },
    { label: "Open Disputes", value: stats.openDisputes.toString(), change: "Requires attention", icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">Admin Panel</h1>
            <p className="text-gray-500 text-sm">Manage the Amana marketplace</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-bold text-[#2E7D32]">{formatCurrency(platformRevenue.totalCommission)}</div>
              <div className="text-xs text-gray-400">Commission earned ({platformRevenue.completedOrders} orders)</div>
            </div>
            <Badge variant="gold">Admin</Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 pb-px overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-[#D4A843] border-[#D4A843]"
                  : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              {tab.icon} {tab.label}
              {tab.key === "disputes" && stats.openDisputes > 0 && (
                <span className="ml-1 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{stats.openDisputes}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(stat => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843]">{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-extrabold">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.change}</div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Platform Health */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#2E7D32]" /> Platform Health
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Escrow Resolution Rate", value: platformHealth.escrowResolutionRate, color: "text-[#2E7D32]" },
                  { label: "Platform Commission", value: formatCurrency(platformRevenue.totalCommission), color: "text-[#D4A843]" },
                  { label: "Seller Verification Rate", value: platformHealth.sellerVerificationRate, color: "text-[#2E7D32]" },
                  { label: "Repeat Buyer Rate", value: platformHealth.repeatBuyerRate, color: "text-[#D4A843]" },
                ].map(metric => (
                  <div key={metric.label} className="bg-[#FAF8F5] rounded-lg p-4 text-center">
                    <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escrow Breakdown */}
            {data.escrowBreakdown.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#D4A843]" /> Escrow Pipeline
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {data.escrowBreakdown.map(e => (
                    <div key={e.status} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold">{e.count}</div>
                      <div className="text-xs text-gray-500">{e.status.replace(/_/g, " ")}</div>
                      <div className="text-xs font-semibold text-[#D4A843] mt-1">{formatCurrency(e.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="font-bold">Users ({stats.totalUsers})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Country</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Role</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Activity</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Joined</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map(user => (
                    <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center font-bold text-sm text-[#D4A843]">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold flex items-center gap-1.5">
                              {user.name}
                              {!user.isActive && <span className="text-xs text-red-500">(suspended)</span>}
                            </div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{getCountryFlag(user.country)} {user.country}</td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role === "SELLER" ? "green" : user.role === "ADMIN" ? "gold" : "blue"}>{user.role}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {user.role === "SELLER" ? `${user._count.products} products` : `${user._count.buyerOrders} orders`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{timeAgo(new Date(user.createdAt))}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.role === "SELLER" && (
                            <Button
                              size="sm" variant="ghost" title="Verify Seller"
                              onClick={() => handleAction("verify_seller", user.id)}
                              disabled={isActioning("verify_seller", user.id)}
                            >
                              <UserCheck className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {user.isActive ? (
                            <Button
                              size="sm" variant="ghost" title="Suspend"
                              onClick={() => handleAction("suspend_user", user.id)}
                              disabled={isActioning("suspend_user", user.id)}
                            >
                              <UserX className="w-4 h-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button
                              size="sm" variant="ghost" title="Activate"
                              onClick={() => handleAction("activate_user", user.id)}
                              disabled={isActioning("activate_user", user.id)}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Disputes ── */}
        {activeTab === "disputes" && (
          <div className="space-y-4">
            {data.disputes.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="font-bold text-lg">No Open Disputes</h3>
                <p className="text-gray-400 text-sm mt-1">All disputes have been resolved</p>
              </div>
            ) : (
              data.disputes.map(dispute => (
                <div key={dispute.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm">{dispute.order.orderNumber}</span>
                      <Badge variant={
                        dispute.status === "OPEN" ? "red" :
                        dispute.status === "ESCALATED" ? "red" :
                        dispute.status === "UNDER_REVIEW" ? "orange" : "gray"
                      }>
                        {dispute.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-400">{timeAgo(new Date(dispute.createdAt))}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm">
                        <strong>{dispute.order.buyer.name}</strong>
                        <span className="text-gray-400 mx-1">vs</span>
                        <strong>{dispute.order.seller.sellerProfile?.storeName || dispute.order.seller.name}</strong>
                      </p>
                      <p className="text-sm text-gray-500 mt-1"><strong>Reason:</strong> {dispute.reason}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{dispute.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold">{formatCurrency(dispute.order.totalAmount, dispute.order.currency)}</div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm" variant="secondary"
                          onClick={() => handleAction("resolve_dispute_buyer", dispute.id, { resolution: "Resolved in favor of buyer — refund issued" })}
                          disabled={!!actionLoading}
                        >
                          {isActioning("resolve_dispute_buyer", dispute.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refund Buyer"}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => handleAction("resolve_dispute_seller", dispute.id, { resolution: "Resolved in favor of seller — escrow released" })}
                          disabled={!!actionLoading}
                        >
                          {isActioning("resolve_dispute_seller", dispute.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pay Seller"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Corridors ── */}
        {activeTab === "corridors" && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D4A843]" /> Top Trade Corridors
            </h2>
            {data.corridors.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No cross-border trade data yet</p>
            ) : (
              <div className="space-y-4">
                {data.corridors.map((corridor, i) => (
                  <div key={`${corridor.origin}-${corridor.destination}`} className="flex items-center gap-4 p-4 bg-[#FAF8F5] rounded-xl">
                    <span className="w-8 h-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center text-sm font-bold text-[#D4A843]">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {getCountryFlag(corridor.origin)} {corridor.origin} → {getCountryFlag(corridor.destination)} {corridor.destination}
                      </div>
                      <div className="text-sm text-gray-400">{corridor.orders} orders</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#D4A843]">{formatCurrency(corridor.gmv)}</div>
                      <div className="text-xs text-gray-400">GMV</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
