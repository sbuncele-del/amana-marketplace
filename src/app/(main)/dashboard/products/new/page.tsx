"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Package, ArrowLeft, Upload, X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
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

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [shipsTo, setShipsTo] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<string[]>([]); // base64 data URIs
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput("");
    }
  };

  const toggleShipsTo = (country: string) => {
    setShipsTo(prev =>
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 8) {
      setError("Maximum 8 images allowed");
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImageFiles(prev => [...prev, base64]);
        setImagePreviews(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Upload images to Cloudinary if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: imageFiles }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            imageUrls = uploadData.urls || [];
          }
        } catch {
          // Continue without images if upload fails
          console.error("Image upload failed, continuing without images");
        }
        setUploadingImages(false);
      }

      // Step 2: Create product
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          moq: parseInt(formData.moq),
          weight: formData.weight ? parseFloat(formData.weight) : null,
          tags,
          shipsTo,
          images: imageUrls,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/products");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create product");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/products" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold">Add New Product</h1>
          <p className="text-gray-500 text-sm">List a product for cross-border trade</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D4A843]" /> Product Details
          </h2>
          <div className="space-y-4">
            <Input label="Product Name" name="name" value={formData.name} onChange={handleChange}
              placeholder="e.g. Tanzanite Rough Stone — 12ct AAA Grade" required />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange}
                rows={6} placeholder="Describe your product in detail..."
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none resize-none"
                required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Price" name="price" type="number" step="0.01" value={formData.price}
                onChange={handleChange} placeholder="0.00" required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none">
                  <option value="USD">USD ($)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="ZAR">ZAR (R)</option>
                  <option value="GHS">GHS (GH₵)</option>
                  <option value="TZS">TZS (TSh)</option>
                  <option value="ETB">ETB (Br)</option>
                  <option value="RWF">RWF (FRw)</option>
                  <option value="UGX">UGX (USh)</option>
                  <option value="XOF">XOF (CFA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory & Shipping */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4">Inventory & Shipping</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Input label="Stock Quantity" name="stock" type="number" value={formData.stock}
              onChange={handleChange} placeholder="0" required />
            <Input label="Min Order Qty" name="moq" type="number" value={formData.moq}
              onChange={handleChange} placeholder="1" />
            <Input label="Weight (kg)" name="weight" type="number" step="0.01" value={formData.weight}
              onChange={handleChange} placeholder="0.00" />
            <Input label="HS Code" name="hsCode" value={formData.hsCode}
              onChange={handleChange} placeholder="e.g. 7103.10" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Origin Country</label>
            <select name="originCountry" value={formData.originCountry} onChange={handleChange} required
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none">
              <option value="">Select origin</option>
              {africanCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ships To (select countries)</label>
            <div className="flex flex-wrap gap-2">
              {africanCountries.map(country => (
                <button key={country} type="button" onClick={() => toggleShipsTo(country)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    shipsTo.includes(country)
                      ? "bg-[#D4A843] text-white border-[#D4A843]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#D4A843]/30"
                  }`}>
                  {country}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4">Tags</h2>
          <div className="flex items-center gap-2 mb-3">
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:border-[#D4A843] focus:ring-2 focus:ring-[#D4A843]/20 outline-none" />
            <Button type="button" onClick={addTag} variant="outline" size="sm"><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#D4A843]" /> Product Images
          </h2>

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">Main</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {imagePreviews.length < 8 && (
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#D4A843]/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const input = fileInputRef.current;
                  if (input) {
                    const dt = new DataTransfer();
                    Array.from(files).forEach(f => dt.items.add(f));
                    input.files = dt.files;
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }
              }}
            >
              {uploadingImages ? (
                <>
                  <Loader2 className="w-8 h-8 text-[#D4A843] mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-gray-500">Uploading images...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Drag & drop images here, or click to browse</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB. Max 8 images. ({8 - imagePreviews.length} remaining)</p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/products">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <div className="flex gap-3">
            <Button type="submit" variant="outline" disabled={loading}>Save as Draft</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Publishing..." : "Publish Product"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
