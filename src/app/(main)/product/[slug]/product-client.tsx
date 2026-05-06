"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Truck, ChevronRight, Minus, Plus,
  ShoppingCart, Heart, Share2, Globe, MapPin, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import type { ShopifyProduct, ShopifyVariant } from "@/lib/shopify";

export default function ProductPageClient() {
  const params = useParams();
  const handle = params.slug as string;
  const { addToCart, loading: cartLoading } = useCart();

  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ShopifyVariant | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "shipping">("description");
  const [notFound, setNotFound] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/shopify/products/${handle}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setProduct(data.product);
            setSelectedVariant(data.product.variants?.[0] ?? null);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [handle]);

  const handleBuyNow = async () => {
    if (!selectedVariant) return;
    setBuyingNow(true);
    try {
      const { checkoutUrl } = await addToCart(selectedVariant.id, quantity);
      window.location.href = checkoutUrl;
    } catch {
      setBuyingNow(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    try {
      await addToCart(selectedVariant.id, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded w-3/4" />
            <div className="h-8 bg-gray-100 rounded w-1/3" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">This product may have been removed or does not exist.</p>
        <Link href="/browse"><Button>Browse Products</Button></Link>
      </div>
    );
  }

  const price = parseFloat(selectedVariant?.price.amount ?? product.priceRange.minVariantPrice.amount);
  const comparePrice = selectedVariant?.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice.amount)
    : parseFloat(product.compareAtPriceRange.minVariantPrice.amount);
  const currency = selectedVariant?.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode;
  const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const inStock = selectedVariant ? selectedVariant.availableForSale : product.availableForSale;
  const stockCount = selectedVariant?.quantityAvailable ?? null;

  const countryTag = product.tags.find(t => t.toLowerCase().startsWith("country:"));
  const originCountry = product.originCountry ?? countryTag?.split(":")[1] ?? "";

  const hasMultipleVariants = product.variants.length > 1;

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/browse" className="hover:text-[#D4A843]">Browse</Link>
          <ChevronRight className="w-3 h-3" />
          {product.productType && (
            <>
              <Link href={`/browse?collection=${product.productType.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-[#D4A843]">
                {product.productType}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-gray-600 truncate">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-50 rounded-2xl relative overflow-hidden">
              {product.images?.[selectedImage] ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.images[selectedImage].altText || product.title}
                  fill
                  className="object-cover rounded-2xl"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl opacity-20">📦</span>
                </div>
              )}
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-2 py-1 rounded-lg">
                  -{discount}%
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden relative border-2 transition-all ${
                      selectedImage === i ? "border-[#D4A843]" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image src={img.url} alt={img.altText || `${product.title} ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.productType && <Badge variant="gold">{product.productType}</Badge>}
              {originCountry && (
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {getCountryFlag(originCountry)} {originCountry}
                </span>
              )}
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {product.vendor}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold mb-4">{product.title}</h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-extrabold text-[#1A1A2E]">
                {formatCurrency(price * quantity, currency)}
              </span>
              {discount > 0 && (
                <span className="text-lg text-gray-400 line-through">
                  {formatCurrency(comparePrice * quantity, currency)}
                </span>
              )}
            </div>

            {/* Variants */}
            {hasMultipleVariants && (
              <div className="mb-6">
                <p className="text-sm font-semibold mb-2">Options</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={!v.availableForSale}
                      className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                        selectedVariant?.id === v.id
                          ? "border-[#D4A843] bg-[#D4A843]/5 font-semibold"
                          : "border-gray-200 hover:border-gray-400"
                      } ${!v.availableForSale ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              {inStock ? (
                <span className="text-sm text-green-600 font-medium">
                  ✓ In stock{stockCount !== null && stockCount > 0 && stockCount <= 10 ? ` — only ${stockCount} left` : ""}
                </span>
              ) : (
                <span className="text-sm text-red-500 font-medium">✗ Out of stock</span>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!inStock}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(stockCount !== null && stockCount > 0 ? Math.min(stockCount, quantity + 1) : quantity + 1)}
                  disabled={!inStock}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 mb-8">
              <Button
                size="xl"
                className="flex-1"
                onClick={handleBuyNow}
                disabled={!inStock || buyingNow || cartLoading}
              >
                <ShoppingCart className="w-5 h-5" />
                {buyingNow ? "Redirecting…" : `Buy Now — ${formatCurrency(price * quantity, currency)}`}
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={handleAddToCart}
                disabled={!inStock || cartLoading}
                className={addedToCart ? "border-green-500 text-green-600" : ""}
              >
                {addedToCart ? "✓ Added" : "Add to Cart"}
              </Button>
              <Button variant="outline" size="xl"><Heart className="w-5 h-5" /></Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() => navigator.share?.({ title: product.title, url: window.location.href })}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Truck className="w-4 h-4" />, label: "Shopify Shipping", sub: "Rates shown at checkout" },
                { icon: <Globe className="w-4 h-4" />, label: "Ships to", sub: product.shipsTo.length > 0 ? `${product.shipsTo.length} countries` : "Worldwide" },
                { icon: <ShoppingCart className="w-4 h-4" />, label: "Secure Checkout", sub: "Powered by Shopify" },
                { icon: <MapPin className="w-4 h-4" />, label: "Origin", sub: originCountry || "Africa" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="text-[#D4A843]">{item.icon}</div>
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex border-b border-gray-200">
            {(["description", "shipping"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "text-[#D4A843] border-[#D4A843]"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              product.descriptionHtml ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              ) : (
                <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
              )
            )}

            {activeTab === "shipping" && (
              <div className="grid md:grid-cols-2 gap-6">
                {product.shipsTo.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-4">Ships To</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.shipsTo.map((country) => (
                        <Badge key={country} variant="gray">
                          {getCountryFlag(country)} {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="font-bold mb-4">Shipping Details</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#D4A843]" />
                      Shipping rates calculated at Shopify checkout
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#D4A843]" />
                      International shipping available
                    </div>
                    {product.hsCode && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        HS Code: {product.hsCode}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vendor */}
        <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#D4A843]/10 flex items-center justify-center text-xl font-bold text-[#D4A843]">
            {product.vendor.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold">{product.vendor}</h3>
            {originCountry && (
              <p className="text-sm text-gray-400">{getCountryFlag(originCountry)} {originCountry}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
