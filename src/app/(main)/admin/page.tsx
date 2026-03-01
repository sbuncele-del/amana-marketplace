"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Users, Package, ShoppingCart, Shield,
  AlertTriangle, Settings, Globe, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

const adminStats = [
  { label: "Total Users", value: "2,847", change: "+124 this month", icon: <Users className="w-5 h-5" /> },
  { label: "Active Products", value: "1,234", change: "+89 this month", icon: <Package className="w-5 h-5" /> },
  { label: "Total Orders", value: "856", change: "$128,400 GMV", icon: <ShoppingCart className="w-5 h-5" /> },
  { label: "Open Disputes", value: "12", change: "3 urgent", icon: <AlertTriangle className="w-5 h-5" /> },
];

const recentUsers = [
  { name: "Kwame Asante", email: "kwame@gmail.com", country: "Ghana", role: "BUYER", date: "2 hours ago" },
  { name: "Amina Kimani", email: "amina@yahoo.com", country: "Kenya", role: "SELLER", date: "5 hours ago" },
  { name: "Emmanuel Mbeki", email: "emmanuel@outlook.com", country: "Tanzania", role: "SELLER", date: "1 day ago" },
  { name: "Fatima Hassan", email: "fatima@gmail.com", country: "Ethiopia", role: "BUYER", date: "1 day ago" },
  { name: "Pierre Nkunda", email: "pierre@gmail.com", country: "Rwanda", role: "BUYER", date: "2 days ago" },
];

const openDisputes = [
  { id: "DSP-001", order: "AMN-7816", buyer: "Fatima H.", seller: "Arusha Gems", amount: 420, reason: "Item not as described", priority: "high", date: "1 day ago" },
  { id: "DSP-002", order: "AMN-7810", buyer: "James K.", seller: "Lagos Textiles", amount: 85, reason: "Not received", priority: "medium", date: "3 days ago" },
  { id: "DSP-003", order: "AMN-7805", buyer: "Sarah M.", seller: "Addis Coffee", amount: 170, reason: "Damaged in transit", priority: "low", date: "5 days ago" },
];

const topCorridors = [
  { route: "Nigeria → Ghana", orders: 234, gmv: "$67,200" },
  { route: "Kenya → Tanzania", orders: 189, gmv: "$52,400" },
  { route: "South Africa → Nigeria", orders: 156, gmv: "$89,100" },
  { route: "Ethiopia → Kenya", orders: 98, gmv: "$28,700" },
];

type Tab = "overview" | "users" | "disputes" | "corridors";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs = [
    { key: "overview" as Tab, label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "users" as Tab, label: "Users", icon: <Users className="w-4 h-4" /> },
    { key: "disputes" as Tab, label: "Disputes", icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "corridors" as Tab, label: "Corridors", icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">Admin Panel</h1>
            <p className="text-gray-500 text-sm">Manage the Amana marketplace</p>
          </div>
          <Badge variant="gold">Admin Access</Badge>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 pb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "text-[#D4A843] border-[#D4A843]"
                  : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {adminStats.map(stat => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843]">
                      {stat.icon}
                    </div>
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
                  { label: "Escrow Resolution Rate", value: "98.2%", color: "text-[#2E7D32]" },
                  { label: "Avg Dispute Resolution", value: "2.4 days", color: "text-[#D4A843]" },
                  { label: "Seller Verification Rate", value: "87%", color: "text-[#2E7D32]" },
                  { label: "Repeat Buyer Rate", value: "64%", color: "text-[#D4A843]" },
                ].map(metric => (
                  <div key={metric.label} className="bg-[#FAF8F5] rounded-lg p-4 text-center">
                    <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="font-bold">Recent Users</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Country</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Joined</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(user => (
                  <tr key={user.email} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center font-bold text-sm text-[#D4A843]">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{getCountryFlag(user.country)} {user.country}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === "SELLER" ? "green" : "blue"}>{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.date}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="ghost">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Disputes */}
        {activeTab === "disputes" && (
          <div className="space-y-4">
            {openDisputes.map(dispute => (
              <div key={dispute.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">{dispute.id}</span>
                    <Badge variant={dispute.priority === "high" ? "red" : dispute.priority === "medium" ? "orange" : "gray"}>
                      {dispute.priority}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-400">{dispute.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm"><strong>Order:</strong> {dispute.order}</p>
                    <p className="text-sm text-gray-500">{dispute.buyer} vs {dispute.seller}</p>
                    <p className="text-sm text-gray-500 mt-1">Reason: {dispute.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(dispute.amount, "USD")}</div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="secondary">Resolve</Button>
                      <Button size="sm" variant="ghost">Details</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Corridors */}
        {activeTab === "corridors" && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D4A843]" /> Top Trade Corridors
            </h2>
            <div className="space-y-4">
              {topCorridors.map((corridor, i) => (
                <div key={corridor.route} className="flex items-center gap-4 p-4 bg-[#FAF8F5] rounded-xl">
                  <span className="w-8 h-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center text-sm font-bold text-[#D4A843]">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold">{corridor.route}</div>
                    <div className="text-sm text-gray-400">{corridor.orders} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#D4A843]">{corridor.gmv}</div>
                    <div className="text-xs text-gray-400">GMV</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
