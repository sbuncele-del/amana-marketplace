"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Shield, ChevronRight, Lock, Truck, CreditCard, Smartphone,
  Building2, ArrowRight, CheckCircle, Globe, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

interface ProductData {
  name: string;
  slug: string;
  price: number;
  currency: string;
  images: string[];
  originCountry: string;
  stock: number;
  moq: number;
  seller: {
    name: string;
    country: string;
    sellerProfile?: {
      storeName: string;
      trustScore: number;
      isVerified: boolean;
    };
  };
}

const PLATFORM_COMMISSION_RATE = 0.05; // 5% platform commission
const ESCROW_FEE_RATE = 0.015; // 1.5% Vesicash escrow fee

const shippingRates: Record<string, { domestic: number; crossBorder: number; label: string }> = {
  dhl_express: { domestic: 15, crossBorder: 35, label: "DHL Express (3-5 days)" },
  dhl_ecommerce: { domestic: 10, crossBorder: 25, label: "DHL eCommerce (7-14 days)" },
  aramex: { domestic: 12, crossBorder: 30, label: "Aramex (5-10 days)" },
  sendy: { domestic: 8, crossBorder: 0, label: "Sendy (1-3 days, local only)" },
  self_ship: { domestic: 0, crossBorder: 0, label: "Seller Ships Directly" },
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
  const [shippingMethod, setShippingMethod] = useState("dhl_ecommerce");
  const [placing, setPlacing] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [orderError, setOrderError] = useState("");

  const [shippingData, setShippingData] = useState({
    fullName: session?.user?.name || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    zip: "",
  });

  // Fetch real product data
  useEffect(() => {
    if (!session) {
      router.push(`/login?callbackUrl=/checkout/${slug}?qty=${quantity}`);
      return;
    }

    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        } else {
          router.push(`/product/${slug}`);
        }
      } catch {
        router.push("/browse");
      } finally {
        setLoadingProduct(false);
      }
    }
    fetchProduct();
  }, [session, router, slug, quantity]);

  // Fill name from session
  useEffect(() => {
    if (session?.user?.name && !shippingData.fullName) {
      setShippingData(prev => ({ ...prev, fullName: session.user?.name || "" }));
    }
  }, [session, shippingData.fullName]);

  if (loadingProduct || !product) {
    return (
      <div className="pt-24 pb-16 bg-[#FAF8F5] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  const isCrossBorder = product.originCountry.toLowerCase() !== shippingData.country.toLowerCase() && shippingData.country !== "";
  const selectedShipping = shippingRates[shippingMethod] || shippingRates.dhl_ecommerce;
  const shippingCost = shippingMethod === "self_ship" ? 0 : (isCrossBorder ? selectedShipping.crossBorder : selectedShipping.domestic);
  // If local-only carrier selected for cross border, fall back
  const shippingAvailable = !(isCrossBorder && selectedShipping.crossBorder === 0 && shippingMethod !== "self_ship");

  const subtotal = product.price * quantity;
  const platformFee = Math.round(subtotal * PLATFORM_COMMISSION_RATE * 100) / 100;
  const escrowFee = Math.round(subtotal * ESCROW_FEE_RATE * 100) / 100;
  const total = subtotal + escrowFee + shippingCost;
  // Platform fee is deducted from seller payout, not charged to buyer
  const sellerPayout = subtotal - platformFee;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setOrderError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: slug,
          quantity,
          paymentMethod,
          shippingMethod,
          shippingAddress: shippingData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // If payment link returned, redirect to Flutterwave hosted payment page
        if (data.paymentLink) {
          window.location.href = data.paymentLink;
        } else {
          // Fallback: go to order confirmation
          router.push(`/orders/${data.order.orderNumber}`);
        }
      } else {
        setOrderError(data.error || "Failed to place order. Please try again.");
      }
    } catch {
      setOrderError("Something went wrong. Please try again.");
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

        {/* Error banner */}
        {orderError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            {orderError}
          </div>
        )}

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
              <div className="space-y-6">
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
                </div>

                {/* Shipping Method Selection */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#D4A843]" />
                    Shipping Method
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(shippingRates).map(([id, rate]) => {
                      const cost = id === "self_ship" ? 0 : (isCrossBorder ? rate.crossBorder : rate.domestic);
                      const disabled = isCrossBorder && rate.crossBorder === 0 && id !== "self_ship";
                      return (
                        <button
                          key={id}
                          onClick={() => !disabled && setShippingMethod(id)}
                          disabled={disabled}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            disabled ? "opacity-40 cursor-not-allowed border-gray-100" :
                            shippingMethod === id
                              ? "border-[#D4A843] bg-[#D4A843]/5"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-semibold text-sm">{rate.label}</div>
                            {disabled && <div className="text-xs text-red-400">Not available for cross-border</div>}
                          </div>
                          <div className="text-sm font-bold">
                            {cost === 0 ? "Free" : formatCurrency(cost, product.currency)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
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
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-400">
                      {getCountryFlag(product.originCountry)} {product.originCountry} ·
                      Qty: {quantity} · by {product.seller.sellerProfile?.storeName || product.seller.name}
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
                  <span>{shippingCost === 0 ? "Free" : formatCurrency(shippingCost, product.currency)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#D4A843]">{formatCurrency(total, product.currency)}</span>
                </div>
              </div>

              {/* Commission notice (transparency) */}
              <div className="mt-4 bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600">
                  <strong>Seller receives:</strong> {formatCurrency(sellerPayout, product.currency)} ({(100 - PLATFORM_COMMISSION_RATE * 100)}% of subtotal after 5% platform fee)
                </p>
              </div>

              {/* Trade corridor */}
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Globe className="w-3 h-3" />
                  <span>
                    {getCountryFlag(product.originCountry)} {product.originCountry} →
                    {shippingData.country ? ` ${getCountryFlag(shippingData.country)} ${shippingData.country}` : " Your country"}
                  </span>
                  {isCrossBorder && <Badge variant="gold" className="text-[10px] py-0">Cross-border</Badge>}
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 space-y-2">
                {[
                  { icon: <Shield className="w-3 h-3 text-[#2E7D32]" />, text: "Vesicash Escrow Protected" },
                  { icon: <Lock className="w-3 h-3 text-[#D4A843]" />, text: "256-bit SSL Encrypted" },
                  { icon: <Truck className="w-3 h-3 text-[#2E7D32]" />, text: "Insured Shipping" },
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
                  {(product.seller.sellerProfile?.storeName || product.seller.name)?.[0] || "S"}
                </div>
                <div>
                  <div className="text-xs font-semibold">{product.seller.sellerProfile?.storeName || product.seller.name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {product.seller.sellerProfile?.isVerified && <Badge variant="green" className="text-[10px] py-0">Verified</Badge>}
                    {product.seller.sellerProfile?.trustScore && <span>Trust: {product.seller.sellerProfile.trustScore}%</span>}
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
