"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Shield, Star, MapPin, Truck, ChevronRight, Minus, Plus,
  ShoppingCart, Heart, Share2, CheckCircle, Globe, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

// Sample product for demo
const sampleProduct = {
  id: "1",
  name: "Tanzanite Rough Stone — 12ct AAA Grade",
  slug: "tanzanite-rough-stone-12ct",
  description: `Premium quality rough Tanzanite sourced directly from the Merelani hills in Northern Tanzania. This 12-carat stone exhibits exceptional violet-blue color saturation, characteristic of the finest AAA-grade Tanzanite specimens.

**Stone Details:**
- Weight: 12.3 carats (certified)
- Color: Deep violet-blue with trichroic flashes
- Clarity: Eye-clean, suitable for faceting
- Origin: Block D, Merelani Hills, Manyara Region

**Certificate:** Accompanied by Tanzania Gemological Laboratory certificate of authenticity and origin verification.

**Shipping:** Insured international shipping via DHL Express. Typical delivery 3-5 business days to major African cities.`,
  price: 480,
  currency: "USD",
  images: ["https://images.unsplash.com/photo-1551122089-4e3e72477432?w=800&q=80", "https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=800&q=80"],
  originCountry: "Tanzania",
  shipsTo: ["Kenya", "Nigeria", "South Africa", "Ghana", "Ethiopia", "Rwanda", "Uganda"],
  stock: 5,
  moq: 1,
  weight: 0.05,
  hsCode: "7103.10",
  tags: ["tanzanite", "gemstone", "rough", "mining"],
  viewCount: 847,
  seller: {
    id: "seller-1",
    name: "Emmanuel Mbeki",
    country: "Tanzania",
    image: null,
    sellerProfile: {
      storeName: "Arusha Gems Ltd",
      storeSlug: "arusha-gems",
      storeDescription: "Direct-from-mine Tanzanite and other precious gemstones. Licensed by the Tanzania Mining Commission. 15+ years in the gemstone trade.",
      trustScore: 92,
      isVerified: true,
      totalSales: 342,
    },
  },
  category: { name: "Gemstones", slug: "gemstones" },
  reviews: [
    {
      id: "r1",
      rating: 5,
      comment: "Exceptional quality stone. Exactly as described. The escrow system gave me confidence to buy from Tanzania.",
      buyer: { name: "Kwame A.", country: "Ghana", image: null },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "r2",
      rating: 4,
      comment: "Beautiful stone, shipping was fast via DHL. Would buy again from this seller.",
      buyer: { name: "Sarah M.", country: "Kenya", image: null },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState(sampleProduct);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "shipping">("description");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) {
            setProduct(data.product);
          }
        }
      } catch {
        // Use sample product
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

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

  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/browse" className="hover:text-[#D4A843]">Browse</Link>
          <ChevronRight className="w-3 h-3" />
          {product.category && (
            <>
              <Link href={`/browse?category=${product.category.slug}`} className="hover:text-[#D4A843]">
                {product.category.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-gray-600 truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left: Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-50 rounded-2xl relative overflow-hidden">
              {product.images?.[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
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
              {product.seller.sellerProfile?.isVerified && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="green"><Shield className="w-3 h-3 mr-1" />Verified Seller</Badge>
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden relative border-2 transition-all ${
                      selectedImage === i ? "border-[#D4A843]" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="gold">{product.category?.name}</Badge>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {getCountryFlag(product.originCountry)} {product.originCountry}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold mb-3">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-[#D4A843] text-[#D4A843]" : "text-gray-200"}`} />
                ))}
                <span className="text-sm text-gray-500 ml-1">({product.reviews.length} reviews)</span>
              </div>
              <span className="text-sm text-gray-400">{product.viewCount} views</span>
            </div>

            <div className="text-3xl font-extrabold text-[#1A1A2E] mb-6">
              {formatCurrency(product.price, product.currency)}
            </div>

            {/* Escrow Trust Badge */}
            <div className="bg-[#2E7D32]/5 border border-[#2E7D32]/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2E7D32]/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#2E7D32]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#2E7D32] mb-1">Escrow Protected</h4>
                  <p className="text-xs text-gray-500">Your payment is held by Vesicash until you receive and approve the product. 72-hour inspection window included.</p>
                </div>
              </div>
            </div>

            {/* Quantity & Buy */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(product.moq, quantity - 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-400">{product.stock} in stock · MOQ: {product.moq}</span>
            </div>

            <div className="flex gap-3 mb-8">
              <Link href={`/checkout/${product.slug}?qty=${quantity}`} className="flex-1">
                <Button size="xl" className="w-full">
                  <ShoppingCart className="w-5 h-5" />
                  Buy Now — {formatCurrency(product.price * quantity, product.currency)}
                </Button>
              </Link>
              <Button variant="outline" size="xl"><Heart className="w-5 h-5" /></Button>
              <Button variant="outline" size="xl"><Share2 className="w-5 h-5" /></Button>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Truck className="w-4 h-4" />, label: "DHL Express", sub: "3-5 days to major cities" },
                { icon: <Globe className="w-4 h-4" />, label: "Ships to", sub: `${product.shipsTo.length} countries` },
                { icon: <Shield className="w-4 h-4" />, label: "100% Protected", sub: "Vesicash escrow" },
                { icon: <Clock className="w-4 h-4" />, label: "72hr Inspection", sub: "Buyer verification window" },
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
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="flex border-b border-gray-200">
            {(["description", "reviews", "shipping"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "text-[#D4A843] border-[#D4A843]"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {tab} {tab === "reviews" && `(${product.reviews.length})`}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="prose prose-sm max-w-none">
                {product.description.split("\n").map((line, i) => {
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return <h3 key={i} className="font-bold mt-4 mb-2">{line.replace(/\*\*/g, "")}</h3>;
                  }
                  if (line.startsWith("- ")) {
                    return <li key={i} className="text-gray-600 ml-4">{line.substring(2)}</li>;
                  }
                  return line ? <p key={i} className="text-gray-600 mb-2">{line}</p> : <br key={i} />;
                })}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {product.reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D4A843]/10 flex items-center justify-center font-bold text-[#D4A843]">
                          {review.buyer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{review.buyer.name}</div>
                          <div className="text-xs text-gray-400">{getCountryFlag(review.buyer.country)} {review.buyer.country}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-[#D4A843] text-[#D4A843]" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <CheckCircle className="w-3 h-3 text-[#2E7D32]" />
                      <span className="text-xs text-[#2E7D32]">Verified purchase via escrow</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="grid md:grid-cols-2 gap-6">
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
                <div>
                  <h3 className="font-bold mb-4">Shipping Details</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#D4A843]" /> DHL Express (3-5 business days)</div>
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#2E7D32]" /> Fully insured shipment</div>
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-[#D4A843]" /> HS Code: {product.hsCode || "N/A"}</div>
                    {product.weight && (
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#2E7D32]" /> Weight: {product.weight}kg</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seller Card */}
        <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#D4A843]/10 flex items-center justify-center text-xl font-bold text-[#D4A843]">
              {product.seller.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{product.seller.sellerProfile?.storeName}</h3>
                {product.seller.sellerProfile?.isVerified && (
                  <Badge variant="green" className="text-xs"><Shield className="w-3 h-3 mr-1" />Verified</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span>{getCountryFlag(product.seller.country)} {product.seller.country}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#D4A843] text-[#D4A843]" />
                  {product.seller.sellerProfile?.trustScore} trust score
                </span>
                <span>·</span>
                <span>{product.seller.sellerProfile?.totalSales} sales</span>
              </div>
            </div>
            <Link href={`/store/${product.seller.sellerProfile?.storeSlug}`}>
              <Button variant="outline" size="sm">Visit Store</Button>
            </Link>
          </div>
          {product.seller.sellerProfile?.storeDescription && (
            <p className="text-sm text-gray-500 mt-4">{product.seller.sellerProfile.storeDescription}</p>
          )}
        </div>
      </div>
    </div>
  );
}
