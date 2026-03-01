"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  originCountry: string;
  stock: number;
  viewCount: number;
  isActive: boolean;
  isApproved: boolean;
  category: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products?mine=true")
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.products || []).map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          currency: p.currency,
          originCountry: p.originCountry,
          stock: p.stock,
          viewCount: p.viewCount,
          isActive: p.isActive,
          isApproved: p.isApproved,
          category: (p.category as Record<string, unknown>)?.name ?? "—",
        }));
        setProducts(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} total products</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button size="sm"><Plus className="w-4 h-4" /> Add Product</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your products..."
            className="flex-1 text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Product</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Price</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Stock</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Views</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase px-6 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">💎</div>
                    <div>
                      <div className="text-sm font-semibold">{product.name}</div>
                      <div className="text-xs text-gray-400">{getCountryFlag(product.originCountry)} {product.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(product.price, product.currency)}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-semibold ${product.stock < 5 ? "text-red-500" : "text-gray-700"}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {product.viewCount}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={product.isActive && product.isApproved ? "green" : product.isActive ? "gold" : "gray"}>
                    {product.isActive && product.isApproved ? "Active" : product.isActive ? "Pending" : "Draft"}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/product/${product.slug}`}>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                  {search ? "No products match your search." : "No products yet. Click 'Add Product' to create your first listing."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
