"use client";

import { useEffect, useState } from "react";
import { User, Store, CreditCard, Shield, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SettingsData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  emailVerified: Date | null;
  store: {
    storeName: string;
    storeSlug: string;
    storeDescription: string | null;
    verification: string;
    isVerified: boolean;
    bankName: string | null;
    bankAccountNum: string | null;
    bankCountry: string | null;
    mobileMoneyNum: string | null;
    mobileMoneyProvider: string | null;
  } | null;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"bank" | "mobile">("bank");
  const [bankName, setBankName] = useState("");
  const [bankAccountNum, setBankAccountNum] = useState("");
  const [bankCountry, setBankCountry] = useState("");
  const [mobileMoneyNum, setMobileMoneyNum] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setData(d);
        setFirstName(d.firstName || "");
        setLastName(d.lastName || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
        setCity(d.city || "");
        if (d.store) {
          setStoreName(d.store.storeName || "");
          setStoreDescription(d.store.storeDescription || "");
          setBankName(d.store.bankName || "");
          setBankAccountNum(d.store.bankAccountNum || "");
          setBankCountry(d.store.bankCountry || "");
          setMobileMoneyNum(d.store.mobileMoneyNum || "");
          setMobileMoneyProvider(d.store.mobileMoneyProvider || "");
          if (d.store.mobileMoneyNum) setPayoutMethod("mobile");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, unknown> = {
        firstName,
        lastName,
        phone: phone || null,
        city: city || null,
      };
      if (data?.store) {
        body.store = {
          storeName,
          storeDescription: storeDescription || null,
          bankName: payoutMethod === "bank" ? bankName || null : null,
          bankAccountNum: payoutMethod === "bank" ? bankAccountNum || null : null,
          bankCountry: payoutMethod === "bank" ? bankCountry || null : null,
          mobileMoneyNum: payoutMethod === "mobile" ? mobileMoneyNum || null : null,
          mobileMoneyProvider: payoutMethod === "mobile" ? mobileMoneyProvider || null : null,
        };
      }
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-500">Failed to load settings.</div>
    );
  }

  const verificationItems = [
    {
      label: "Email Verification",
      status: data.emailVerified ? "Verified" : "Pending",
      done: !!data.emailVerified,
    },
    {
      label: "Identity (KYC)",
      status: data.store?.verification === "VERIFIED" ? "Verified" : data.store?.verification === "PENDING" ? "Pending" : "Not submitted",
      done: data.store?.verification === "VERIFIED",
    },
    {
      label: "Business Registration",
      status: data.store?.isVerified ? "Verified" : "Not submitted",
      done: !!data.store?.isVerified,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account and store settings</p>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#D4A843]" /> Personal Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Last Name" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input label="Email" name="email" type="email" value={email} disabled />
            <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
            <Input label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>

        {/* Store Info (only for sellers) */}
        {data.store && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-[#2E7D32]" /> Store Settings
            </h2>
            <div className="space-y-4">
              <Input label="Store Name" name="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Description</label>
                <textarea
                  name="storeDescription"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payout Settings (only for sellers) */}
        {data.store && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#D4A843]" /> Payout Settings
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              When escrow funds are released, they will be sent to this account.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payout Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as "bank" | "mobile")}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="mobile">Mobile Money</option>
                </select>
              </div>

              {payoutMethod === "bank" ? (
                <>
                  <Input label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                  <Input label="Account Number" value={bankAccountNum} onChange={(e) => setBankAccountNum(e.target.value)} />
                  <Input label="Bank Country" value={bankCountry} onChange={(e) => setBankCountry(e.target.value)} placeholder="e.g. Nigeria" />
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider</label>
                    <select
                      value={mobileMoneyProvider}
                      onChange={(e) => setMobileMoneyProvider(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none"
                    >
                      <option value="">Select provider</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="mtn_momo">MTN MoMo</option>
                      <option value="airtel_money">Airtel Money</option>
                      <option value="orange_money">Orange Money</option>
                    </select>
                  </div>
                  <Input label="Mobile Number" value={mobileMoneyNum} onChange={(e) => setMobileMoneyNum(e.target.value)} placeholder="+254..." />
                </>
              )}
            </div>
          </div>
        )}

        {/* Verification */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#2E7D32]" /> Verification
          </h2>
          <div className="space-y-3">
            {verificationItems.map((v) => (
              <div key={v.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-semibold">{v.label}</div>
                  <div className={`text-xs ${v.done ? "text-[#2E7D32]" : "text-gray-400"}`}>{v.status}</div>
                </div>
                {v.done ? (
                  <CheckCircle className="w-5 h-5 text-[#2E7D32]" />
                ) : (
                  <Button size="sm" variant="outline">Submit</Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-[#2E7D32] font-medium">Changes saved!</span>}
          <Button size="lg" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
