"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, Grid3X3, List, ChevronDown, Shield, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  images: string[];
  originCountry: string;
  stock: number;
  seller: {
    name: string;
    country: string;
    sellerProfile: {
      storeName: string;
      storeSlug: string;
      trustScore: number;
      isVerified: boolean;
    } | null;
  };
  category: {
    name: string;
    slug: string;
  } | null;
}

const categories = [
  { name: "All", slug: "" },
  { name: "Gemstones", slug: "gemstones" },
  { name: "Fashion", slug: "fashion" },
  { name: "Agriculture", slug: "agriculture" },
  { name: "Art & Craft", slug: "art-craft" },
  { name: "Electronics", slug: "electronics" },
  { name: "Beauty", slug: "beauty" },
  { name: "Food & Spice", slug: "food-spice" },
  { name: "Textiles", slug: "textiles" },
  { name: "Minerals", slug: "minerals" },
  { name: "Leather", slug: "leather" },
];

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Most Popular", value: "popular" },
];

// Sample products for demo (before DB is seeded)
const sampleProducts: Product[] = [
  {
    id: "1", name: "Tanzanite Rough Stone — 12ct", slug: "tanzanite-rough-stone-12ct", price: 480,
    currency: "USD", images: ["https://images.unsplash.com/photo-1551122089-4e3e72477432?w=800&q=80"], originCountry: "Tanzania", stock: 5,
    seller: { name: "Arusha Gems Ltd", country: "Tanzania", sellerProfile: { storeName: "Arusha Gems", storeSlug: "arusha-gems", trustScore: 92, isVerified: true } },
    category: { name: "Gemstones", slug: "gemstones" },
  },
  {
    id: "2", name: "Ankara Wax Print Fabric — 6 Yards", slug: "ankara-wax-print-fabric-6-yards", price: 35,
    currency: "USD", images: ["https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80"], originCountry: "Nigeria", stock: 120,
    seller: { name: "Lagos Textiles Co", country: "Nigeria", sellerProfile: { storeName: "Lagos Textiles", storeSlug: "lagos-textiles", trustScore: 88, isVerified: true } },
    category: { name: "Textiles", slug: "textiles" },
  },
  {
    id: "3", name: "Ethiopian Yirgacheffe Coffee — 5kg", slug: "ethiopian-yirgacheffe-coffee-5kg", price: 85,
    currency: "USD", images: ["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80"], originCountry: "Ethiopia", stock: 50,
    seller: { name: "Addis Coffee Export", country: "Ethiopia", sellerProfile: { storeName: "Addis Coffee", storeSlug: "addis-coffee", trustScore: 95, isVerified: true } },
    category: { name: "Agriculture", slug: "agriculture" },
  },
  {
    id: "4", name: "Kenyan Macadamia Nuts — 10kg Bag", slug: "kenyan-macadamia-nuts-10kg", price: 120,
    currency: "USD", images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80"], originCountry: "Kenya", stock: 30,
    seller: { name: "Nyeri Farms", country: "Kenya", sellerProfile: { storeName: "Nyeri Farms", storeSlug: "nyeri-farms", trustScore: 90, isVerified: true } },
    category: { name: "Agriculture", slug: "agriculture" },
  },
  {
    id: "5", name: "Handmade Maasai Beaded Necklace", slug: "handmade-maasai-beaded-necklace", price: 45,
    currency: "USD", images: ["https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&q=80"], originCountry: "Kenya", stock: 25,
    seller: { name: "Maasai Artisans Co-op", country: "Kenya", sellerProfile: { storeName: "Maasai Artisans", storeSlug: "maasai-artisans", trustScore: 87, isVerified: false } },
    category: { name: "Art & Craft", slug: "art-craft" },
  },
  {
    id: "6", name: "Moroccan Argan Oil — Pure 100ml", slug: "moroccan-argan-oil-pure", price: 28,
    currency: "USD", images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80"], originCountry: "Morocco", stock: 200,
    seller: { name: "Marrakech Essentials", country: "Morocco", sellerProfile: { storeName: "Marrakech Essentials", storeSlug: "marrakech-essentials", trustScore: 91, isVerified: true } },
    category: { name: "Beauty", slug: "beauty" },
  },
  {
    id: "7", name: "Ghanaian Kente Cloth — Handwoven", slug: "ghanaian-kente-cloth-handwoven", price: 180,
    currency: "USD", images: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80"], originCountry: "Ghana", stock: 8,
    seller: { name: "Kumasi Weavers", country: "Ghana", sellerProfile: { storeName: "Kumasi Weavers", storeSlug: "kumasi-weavers", trustScore: 94, isVerified: true } },
    category: { name: "Textiles", slug: "textiles" },
  },
  {
    id: "8", name: "South African Rooibos Tea — 500g", slug: "south-african-rooibos-tea", price: 22,
    currency: "USD", images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80"], originCountry: "South Africa", stock: 150,
    seller: { name: "Cape Naturals", country: "South Africa", sellerProfile: { storeName: "Cape Naturals", storeSlug: "cape-naturals", trustScore: 89, isVerified: true } },
    category: { name: "Food & Spice", slug: "food-spice" },
  },
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(sampleProducts.length);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeCategory) params.set("category", activeCategory);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          setTotal(data.pagination.total);
        } else {
          // Use filtered sample products as fallback
          let filtered = sampleProducts;
          if (search) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
          }
          if (activeCategory) {
            filtered = filtered.filter(p => p.category?.slug === activeCategory);
          }
          setProducts(filtered);
          setTotal(filtered.length);
        }
      }
    } catch {
      // Fallback to sample products
      let filtered = sampleProducts;
      if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      }
      if (activeCategory) {
        filtered = filtered.filter(p => p.category?.slug === activeCategory);
      }
      setProducts(filtered);
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeCategory) params.set("category", activeCategory);
    router.push(`/browse?${params.toString()}`);
    fetchProducts();
  };

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (slug) params.set("category", slug);
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-2">Browse Products</h1>
          <p className="text-gray-500">Discover goods from verified sellers across Africa</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <Search className="w-5 h-5 text-gray-400 ml-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, categories, sellers..."
              className="flex-1 py-3 px-3 text-sm focus:outline-none"
            />
            <Button type="submit" size="sm" className="m-1.5">Search</Button>
          </div>
        </form>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.slug
                  ? "bg-[#D4A843] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#D4A843]/30"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{total} products found</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 lg:hidden"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:border-[#D4A843]"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md ${view === "grid" ? "bg-[#D4A843]/10 text-[#D4A843]" : "text-gray-400"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md ${view === "list" ? "bg-[#D4A843]/10 text-[#D4A843]" : "text-gray-400"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-bold mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try a different search or category</p>
            <Button onClick={() => { setSearch(""); setActiveCategory(""); }}>Clear Filters</Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#D4A843]/20 transition-all">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl opacity-20">📦</span>
                    </div>
                  )}
                  {product.seller.sellerProfile?.isVerified && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="green" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />Verified
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{getCountryFlag(product.originCountry)} {product.originCountry}</span>
                    {product.category && (
                      <>
                        <span>·</span>
                        <span>{product.category.name}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-2 group-hover:text-[#D4A843] transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#1A1A2E]">
                      {formatCurrency(product.price, product.currency)}
                    </span>
                    {product.seller.sellerProfile && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Star className="w-3 h-3 fill-[#D4A843] text-[#D4A843]" />
                        <span>{product.seller.sellerProfile.trustScore}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    by {product.seller.sellerProfile?.storeName || product.seller.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`}
                className="group flex bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#D4A843]/20 transition-all">
                <div className="w-40 h-40 bg-gray-50 flex-shrink-0 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl opacity-20">📦</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <MapPin className="w-3 h-3" />{getCountryFlag(product.originCountry)} {product.originCountry}
                      {product.category && <> · {product.category.name}</>}
                    </div>
                    <h3 className="font-semibold group-hover:text-[#D4A843] transition-colors">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">{formatCurrency(product.price, product.currency)}</span>
                    <span className="text-sm text-gray-400">by {product.seller.sellerProfile?.storeName || product.seller.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#D4A843] border-t-transparent rounded-full animate-spin" /></div>}>
      <BrowseContent />
    </Suspense>
  );
}
