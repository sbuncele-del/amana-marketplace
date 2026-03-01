import Link from "next/link";
import Image from "next/image";
import { Star, Shield, MapPin, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  currency: string;
  images: string[];
  originCountry: string;
  stock: number;
  avgRating: number;
  reviewCount: number;
  totalSold: number;
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

/* ══════════ PRODUCT CARD (Takealot-dense style) ══════════ */

export function ProductCard({ product }: { product: ProductCardData }) {
  const storeName = product.seller.sellerProfile?.storeName || product.seller.name;
  const isVerified = product.seller.sellerProfile?.isVerified;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group bg-white border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col relative"
    >
      {/* Discount badge */}
      {discount > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
          -{discount}%
        </div>
      )}

      {/* Image */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-3xl opacity-20">📦</span>
          </div>
        )}
        {isVerified && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
              <Shield className="w-2.5 h-2.5" />Verified
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1">
        {/* Product name */}
        <h3 className="text-[13px] leading-tight font-medium text-gray-800 line-clamp-2 mb-1.5 min-h-[2.25rem] group-hover:text-[#D4A843] transition-colors">
          {product.name}
        </h3>

        {/* Rating row */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex items-center gap-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(product.avgRating) ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-400">({product.reviewCount})</span>
          </div>
        )}

        {/* Price block */}
        <div className="mb-1">
          <div className="text-base font-extrabold text-[#1A1A2E]">
            {formatCurrency(product.price, product.currency)}
          </div>
          {product.comparePrice && product.comparePrice > product.price && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.comparePrice, product.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Shipping indicator */}
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium mb-1">
          <Truck className="w-3 h-3" /> Free shipping eligible
        </div>

        {/* Seller + Origin */}
        <div className="mt-auto pt-1.5 border-t border-gray-100">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span className="truncate max-w-[70%]">{storeName}</span>
            <span className="flex items-center gap-0.5 flex-shrink-0">
              <MapPin className="w-2.5 h-2.5" />{product.originCountry}
            </span>
          </div>
        </div>

        {/* Low stock urgency */}
        {lowStock && (
          <div className="text-[11px] font-bold text-red-500 mt-1">
            Only {product.stock} left!
          </div>
        )}
      </div>
    </Link>
  );
}

/* ══════════ COMPACT CARD (for horizontal scroll rows) ══════════ */

export function ProductCardCompact({ product }: { product: ProductCardData }) {
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex-shrink-0 w-[160px] sm:w-[180px] bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-all"
    >
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="180px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-2xl opacity-20">📦</span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1 py-px rounded-sm">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-[12px] leading-tight text-gray-800 line-clamp-2 mb-1 group-hover:text-[#D4A843]">
          {product.name}
        </h3>
        <div className="text-sm font-extrabold text-[#1A1A2E]">
          {formatCurrency(product.price, product.currency)}
        </div>
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="text-[10px] text-gray-400 line-through">
            {formatCurrency(product.comparePrice, product.currency)}
          </span>
        )}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-2.5 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded w-full" />
        <div className="h-3.5 bg-gray-100 rounded w-3/4" />
        <div className="h-5 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export function ProductCardCompactSkeleton() {
  return (
    <div className="flex-shrink-0 w-[160px] sm:w-[180px] bg-white border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}
