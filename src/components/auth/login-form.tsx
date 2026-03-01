"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/browse";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
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
            Welcome Back to<br />Africa&apos;s Trusted Marketplace
          </h2>
          <p className="text-white/50 mb-8 max-w-md">
            Continue trading across 34 African countries with full escrow protection on every transaction.
          </p>
          <div className="space-y-4">
            {[
              "Every trade escrow-protected",
              "15+ African payment methods",
              "Real-time shipment tracking",
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

          <h1 className="text-2xl font-bold mb-2">Sign in to your account</h1>
          <p className="text-gray-500 mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#D4A843] font-semibold hover:underline">
              Create one free
            </Link>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-[#D4A843] focus:ring-[#D4A843]" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="#" className="text-sm text-[#D4A843] hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
