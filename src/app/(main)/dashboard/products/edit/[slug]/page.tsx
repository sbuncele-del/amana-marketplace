"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Package, ArrowLeft, Upload, X, Plus, Image as ImageIcon, Loader2, Trash2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const categories = [
  { id: "gemstones", name: "Gemstones" },
  { id: "fashion", name: "Fashion" },
  { id: "agriculture", name: "Agriculture" },
  { id: "art-craft", name: "Art & Craft" },
  { id: "electronics", name: "Electronics" },
  { id: "beauty", name: "Beauty" },
  { id: "food-spice", name: "Food & Spice" },
  { id: "textiles", name: "Textiles" },
  { id: "minerals", name: "Minerals" },
  { id: "leather", name: "Leather" },
];

const africanCountries = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Tanzania",
  "Ethiopia", "Rwanda", "Uganda", "Côte d'Ivoire", "Senegal",
  "Cameroon", "Morocco", "Egypt", "DRC", "Mozambique",
];

interface ProductData {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  moq: number;
  weight: number | null;
  originCountry: string;
  shipsTo: string[];
  hsCode: string | null;
  images: string[];
  tags: string[];
  isActive: boolean;
  category: { id: string; name: string; slug: string };
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [shipsTo, setShipsTo] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<string[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    categoryId: "",
    originCountry: "",
    stock: "",
    moq: "1",
    weight: "",
    hsCode: "",
    isActive: true,
  });

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) { setError("Product not found"); setFetching(false); return; }
      const data = await res.json();
      const p: ProductData = data.product;

      setFormData({
        name: p.name,
        description: p.description,
        price: p.price.toString(),
        currency: p.currency,
        categoryId: p.category?.id || "",
        originCountry: p.originCountry,
        stock: p.stock.toString(),
        moq: p.moq.toString(),
        weight: p.weight?.toString() || "",
        hsCode: p.hsCode || "",
        isActive: p.isActive,
      });
      setTags(p.tags || []);
      setShipsTo(p.shipsTo || []);
      setExistingImages(p.images || []);
    } catch { setError("Failed to load product"); }
    finally { setFetching(false); }
  }, [slug]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput("");
    }
  };

  const toggleShipsTo = (country: string) => {
    setShipsTo(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImageFiles.length + files.length;
    if (totalImages > 8) { setError("Maximum 8 images total"); return; }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { setError("Each image must be under 5MB"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setNewImageFiles(prev => [...prev, base64]);
        setNewImagePreviews(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Upload new images if any
      let newImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        setUploadingImages(true);
        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: newImageFiles }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            newImageUrls = uploadData.urls || [];
          }
        } catch { console.error("Image upload failed"); }
        setUploadingImages(false);
      }

      const allImages = [...existingImages, ...newImageUrls];

      const res = await fetch(`/api/products/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          currency: formData.currency,
          categoryId: formData.categoryId,
          originCountry: formData.originCountry,
          stock: parseInt(formData.stock),
          moq: parseInt(formData.moq),
          weight: formData.weight ? parseFloat(formData.weight) : null,
          hsCode: formData.hsCode || null,
          tags,
          shipsTo,
          images: allImages,
          isActive: formData.isActive,
        }),
      });

      if (res.ok) {
        setSuccess("Product updated successfully");
        setNewImageFiles([]);
        setNewImagePreviews([]);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update product");
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); setUploadingImages(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${slug}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/products");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete product");
      }
    } catch { setError("Failed to delete"); }
    finally { setDeleting(false); }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A843]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold">Edit Product</h1>
            <p className="text-gray-500 text-sm">Update your product listing</p>
          </div>
        </div>
        <Button
          type="button" variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700 font-semibold mb-3">Are you sure you want to delete this product?</p>
          <p className="text-xs text-red-500 mb-3">If the product has active orders, it will be deactivated instead of deleted.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleDelete} disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D4A843]" /> Product Details
          </h2>
          <div className="space-y-4">
            <Input label="Product Name" name="name" value={formData.name} onChange={handleChange} required />
            <div>
              <label className="block text-sm font-semibold mb-1.5">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] outline-none"
                required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
              <div>
                <label className="block text-sm font-semibold mb-1.5">Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] outline-none">
                  {["USD", "NGN", "KES", "GHS", "TZS", "ETB", "ZAR", "RWF", "UGX", "XOF", "EGP"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Category</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] outline-none" required>
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required />
              <Input label="Min Order Qty" name="moq" type="number" value={formData.moq} onChange={handleChange} />
              <Input label="Weight (kg)" name="weight" type="number" step="0.01" value={formData.weight} onChange={handleChange} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive}
                onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-[#D4A843] focus:ring-[#D4A843]" />
              <label htmlFor="isActive" className="text-sm font-semibold">Active (visible to buyers)</label>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#D4A843]" /> Product Images
          </h2>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {existingImages.map((url, i) => (
              <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {newImagePreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-green-300">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">New</span>
              </div>
            ))}
            {existingImages.length + newImageFiles.length < 8 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-[#D4A843] hover:bg-[#D4A843]/5 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-400">Add Image</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
          <p className="text-xs text-gray-400">{existingImages.length + newImageFiles.length}/8 images · Max 5MB each</p>
        </div>

        {/* Shipping & Trade */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4">Shipping & Trade</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Origin Country</label>
              <select name="originCountry" value={formData.originCountry} onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] outline-none" required>
                <option value="">Select origin</option>
                {africanCountries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Ships To</label>
              <div className="flex flex-wrap gap-2">
                {africanCountries.map(country => (
                  <button key={country} type="button" onClick={() => toggleShipsTo(country)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      shipsTo.includes(country)
                        ? "bg-[#D4A843] text-white border-[#D4A843]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#D4A843]"
                    }`}>
                    {country}
                  </button>
                ))}
              </div>
            </div>
            <Input label="HS Code" name="hsCode" value={formData.hsCode} onChange={handleChange} placeholder="e.g. 7103.91" />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4">Tags</h2>
          <div className="flex gap-2 mb-3">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag" className="flex-1" />
            <Button type="button" variant="secondary" onClick={addTag}><Plus className="w-4 h-4" /></Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="bg-[#FAF8F5] border border-[#D4A843]/20 text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                    <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading || uploadingImages} className="bg-[#D4A843] text-white hover:bg-[#B8922E]">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />{uploadingImages ? "Uploading images..." : "Saving..."}</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Changes</>
            )}
          </Button>
          <Link href="/dashboard/products">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
