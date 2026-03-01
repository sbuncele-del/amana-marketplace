"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Eye, EyeOff, Store, ShoppingBag } from "lucide-react";

const africanCountries = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Tanzania",
  "Ethiopia", "Rwanda", "Uganda", "Côte d'Ivoire", "Senegal",
  "Cameroon", "Morocco", "Egypt", "Algeria", "Tunisia",
  "DRC", "Mozambique", "Zambia", "Zimbabwe", "Botswana",
  "Namibia", "Angola", "Mali", "Burkina Faso", "Niger",
  "Chad", "Guinea", "Benin", "Togo", "Sierra Leone",
  "Liberia", "Mauritius", "Madagascar", "Malawi",
];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "";

  const [step, setStep] = useState(defaultRole ? 2 : 1);
  const [role, setRole] = useState<"BUYER" | "SELLER">(
    defaultRole === "seller" ? "SELLER" : "BUYER"
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    country: "",
    storeName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4A843] rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#2E7D32] rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12">
          <Link href="/" className="text-2xl font-extrabold text-white mb-8">
            <span className="text-[#D4A843]">Amana</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-4">
            Join Africa&apos;s Most<br />Trusted Marketplace
          </h2>
          <p className="text-white/50 mb-8 max-w-md">
            Start trading across borders with full escrow protection. Whether you&apos;re buying or selling, every transaction is safe.
          </p>
          <div className="space-y-4">
            {[
              "100% escrow-protected trades",
              "34 African countries connected",
              "Seller verification & trust scores",
              "Free to join — no hidden fees",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-[#D4A843]" />
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#FAF8F5]">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="text-2xl font-extrabold">
              <span className="text-[#D4A843]">Amana</span>
            </Link>
          </div>

          {/* Step 1: Choose Role */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-gray-500 mb-8">How do you want to use Amana?</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => { setRole("BUYER"); setStep(2); }}
                  className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-[#D4A843] hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[#D4A843]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-6 h-6 text-[#D4A843]" />
                  </div>
                  <h3 className="font-bold mb-1">I want to Buy</h3>
                  <p className="text-xs text-gray-400">Shop from verified sellers across Africa</p>
                </button>

                <button
                  onClick={() => { setRole("SELLER"); setStep(2); }}
                  className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-[#2E7D32] hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Store className="w-6 h-6 text-[#2E7D32]" />
                  </div>
                  <h3 className="font-bold mb-1">I want to Sell</h3>
                  <p className="text-xs text-gray-400">Open a store and reach 34 countries</p>
                </button>
              </div>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-[#D4A843] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
              >
                ← Back
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className={`p-2 rounded-lg ${role === "SELLER" ? "bg-[#2E7D32]/10" : "bg-[#D4A843]/10"}`}>
                  {role === "SELLER"
                    ? <Store className="w-5 h-5 text-[#2E7D32]" />
                    : <ShoppingBag className="w-5 h-5 text-[#D4A843]" />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {role === "SELLER" ? "Create Seller Account" : "Create Buyer Account"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {role === "SELLER" ? "Start selling across Africa" : "Shop with escrow protection"}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    required
                  />
                </div>

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />

                <div className="relative">
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none transition-all"
                  >
                    <option value="">Select your country</option>
                    {africanCountries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {role === "SELLER" && (
                  <Input
                    label="Store Name"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="e.g. Lagos Gemstone Gallery"
                    required
                  />
                )}

                <div className="pt-2">
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#D4A843] font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
