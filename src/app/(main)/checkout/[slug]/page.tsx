"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Shield, ChevronRight, Lock, Truck, CreditCard, Smartphone,
  Building2, ArrowRight, CheckCircle, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

const sampleProduct = {
  name: "Tanzanite Rough Stone — 12ct AAA Grade",
  slug: "tanzanite-rough-stone-12ct",
  price: 480,
  currency: "USD",
  originCountry: "Tanzania",
  seller: { storeName: "Arusha Gems Ltd", country: "Tanzania", trustScore: 92, isVerified: true },
};

const paymentMethods = [
  { id: "card", name: "Card Payment", icon: <CreditCard className="w-5 h-5" />, desc: "Visa, Mastercard, Verve" },
  { id: "mpesa", name: "M-Pesa", icon: <Smartphone className="w-5 h-5" />, desc: "Kenya, Tanzania" },
  { id: "momo", name: "MTN MoMo", icon: <Smartphone className="w-5 h-5" />, desc: "Ghana, Uganda, Cameroon" },
  { id: "bank", name: "Bank Transfer", icon: <Building2 className="w-5 h-5" />, desc: "Direct bank transfer" },
];

type CheckoutStep = "shipping" | "payment" | "review";

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;
  const quantity = parseInt(searchParams.get("qty") || "1");

  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [placing, setPlacing] = useState(false);
  const [product] = useState(sampleProduct);

  const [shippingData, setShippingData] = useState({
    fullName: session?.user?.name || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    zip: "",
  });

  useEffect(() => {
    if (!session) {
      router.push(`/login?callbackUrl=/checkout/${slug}?qty=${quantity}`);
    }
  }, [session, router, slug, quantity]);

  const subtotal = product.price * quantity;
  const escrowFee = subtotal * 0.015; // 1.5% Vesicash fee
  const shippingEstimate = 25; // Estimated DHL
  const total = subtotal + escrowFee + shippingEstimate;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: slug,
          quantity,
          paymentMethod,
          shippingAddress: shippingData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/order/${data.order.orderNumber}?success=true`);
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setPlacing(false);
    }
  };

  const steps: { key: CheckoutStep; label: string }[] = [
    { key: "shipping", label: "Shipping" },
    { key: "payment", label: "Payment" },
    { key: "review", label: "Review" },
  ];

  return (
    <div className="pt-24 pb-16 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href={`/product/${slug}`} className="hover:text-[#D4A843]">{product.name}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600">Checkout</span>
        </nav>

        {/* Step Progress */}
        <div className="flex items-center justify-center mb-12">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => {
                  const currentIdx = steps.findIndex(st => st.key === step);
                  if (i <= currentIdx) setStep(s.key);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  step === s.key
                    ? "bg-[#D4A843] text-white"
                    : steps.findIndex(st => st.key === step) > i
                    ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {steps.findIndex(st => st.key === step) > i ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                )}
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-200 mx-2" />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            {step === "shipping" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#D4A843]" />
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input label="Full Name" name="fullName" value={shippingData.fullName} onChange={handleChange} required />
                  </div>
                  <Input label="Phone Number" name="phone" type="tel" value={shippingData.phone} onChange={handleChange} placeholder="+234..." required />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                    <select name="country" value={shippingData.country} onChange={handleChange} required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none">
                      <option value="">Select country</option>
                      {["Nigeria","Kenya","South Africa","Ghana","Tanzania","Ethiopia","Rwanda","Uganda","Morocco","Egypt","Senegal","Côte d'Ivoire","Cameroon"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Street Address" name="street" value={shippingData.street} onChange={handleChange} placeholder="123 Main Street" required />
                  </div>
                  <Input label="City" name="city" value={shippingData.city} onChange={handleChange} required />
                  <Input label="State / Province" name="state" value={shippingData.state} onChange={handleChange} />
                  <Input label="ZIP / Postal Code" name="zip" value={shippingData.zip} onChange={handleChange} />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setStep("payment")} size="lg">
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#D4A843]" />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id
                          ? "border-[#D4A843] bg-[#D4A843]/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        paymentMethod === method.id ? "bg-[#D4A843]/10 text-[#D4A843]" : "bg-gray-50 text-gray-400"
                      }`}>
                        {method.icon}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-sm">{method.name}</div>
                        <div className="text-xs text-gray-400">{method.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        paymentMethod === method.id ? "border-[#D4A843] bg-[#D4A843]" : "border-gray-200"
                      }`}>
                        {paymentMethod === method.id && (
                          <CheckCircle className="w-full h-full text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Escrow notice */}
                <div className="mt-6 bg-[#2E7D32]/5 border border-[#2E7D32]/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-[#2E7D32] mb-1">Your Payment Goes to Escrow</h4>
                      <p className="text-xs text-gray-500">
                        Funds are held securely by Vesicash. The seller is notified to ship. You have a 72-hour
                        inspection window after delivery to approve or dispute.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={() => setStep("shipping")}>← Back</Button>
                  <Button onClick={() => setStep("review")} size="lg">
                    Review Order <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === "review" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#D4A843]" />
                  Review Your Order
                </h2>

                {/* Product summary */}
                <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">💎</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-400">
                      {getCountryFlag(product.originCountry)} {product.originCountry} ·
                      Qty: {quantity} · by {product.seller.storeName}
                    </p>
                  </div>
                  <div className="text-lg font-bold">{formatCurrency(subtotal, product.currency)}</div>
                </div>

                {/* Shipping summary */}
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Shipping To</h3>
                  <p className="text-sm">{shippingData.fullName}</p>
                  <p className="text-sm text-gray-500">{shippingData.street}, {shippingData.city}</p>
                  <p className="text-sm text-gray-500">{shippingData.state} {shippingData.zip}, {shippingData.country}</p>
                </div>

                {/* Payment summary */}
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Payment</h3>
                  <div className="flex items-center gap-2">
                    {paymentMethods.find(m => m.id === paymentMethod)?.icon}
                    <span className="text-sm">{paymentMethods.find(m => m.id === paymentMethod)?.name}</span>
                  </div>
                </div>

                {/* Escrow flow reminder */}
                <div className="bg-[#FAF8F5] rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#D4A843]" /> Escrow Flow
                  </h3>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-[#D4A843]/10 text-[#D4A843] flex items-center justify-center text-[10px] font-bold">1</span> Payment held in Vesicash escrow</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-[#D4A843]/10 text-[#D4A843] flex items-center justify-center text-[10px] font-bold">2</span> Seller ships with tracking</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-[#D4A843]/10 text-[#D4A843] flex items-center justify-center text-[10px] font-bold">3</span> You verify delivery (72hr window)</div>
                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center text-[10px] font-bold">✓</span> Funds released to seller (or refunded)</div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep("payment")}>← Back</Button>
                  <Button onClick={handlePlaceOrder} size="lg" disabled={placing}>
                    <Lock className="w-4 h-4" />
                    {placing ? "Processing..." : `Pay ${formatCurrency(total, product.currency)} via Escrow`}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary Sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-28">
              <h3 className="font-bold mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal ({quantity} item{quantity > 1 ? "s" : ""})</span>
                  <span>{formatCurrency(subtotal, product.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    Escrow Fee <Shield className="w-3 h-3 text-[#2E7D32]" />
                  </span>
                  <span>{formatCurrency(escrowFee, product.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    Shipping <Truck className="w-3 h-3 text-[#D4A843]" />
                  </span>
                  <span>{formatCurrency(shippingEstimate, product.currency)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#D4A843]">{formatCurrency(total, product.currency)}</span>
                </div>
              </div>

              {/* Trade corridor */}
              <div className="mt-6 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Globe className="w-3 h-3" />
                  <span>
                    {getCountryFlag(product.originCountry)} {product.originCountry} →
                    {shippingData.country ? ` ${getCountryFlag(shippingData.country)} ${shippingData.country}` : " Your country"}
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 space-y-2">
                {[
                  { icon: <Shield className="w-3 h-3 text-[#2E7D32]" />, text: "Vesicash Escrow Protected" },
                  { icon: <Lock className="w-3 h-3 text-[#D4A843]" />, text: "256-bit SSL Encrypted" },
                  { icon: <Truck className="w-3 h-3 text-[#2E7D32]" />, text: "Insured DHL Shipping" },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    {badge.icon}
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>

              {/* Seller badge */}
              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="w-8 h-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center text-sm font-bold text-[#D4A843]">
                  A
                </div>
                <div>
                  <div className="text-xs font-semibold">{product.seller.storeName}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {product.seller.isVerified && <Badge variant="green" className="text-[10px] py-0">Verified</Badge>}
                    <span>Trust: {product.seller.trustScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
