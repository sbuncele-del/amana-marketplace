import { Image, Type, Tag, Layers, DollarSign, FileText, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Listing Standards — Amana Marketplace" };

const titleDos = [
  "Tanzanite Oval Cut 2.5ct — AAA Grade, Certified",
  "Hand-woven Kente Cloth — 3 yards, Gold & Green",
  "Organic Rooibos Tea — 100g Loose Leaf, Fair Trade",
];

const titleDonts = [
  "BEST DEAL!!! Tanzanite gemstone wow amazing price!!!",
  "Kente cloth fabric african print cloth BUY NOW free shipping",
  "tea rooibos organic herbal health detox weight loss",
];

const imageSpecs = [
  { spec: "Minimum Resolution", value: "1000 × 1000 pixels" },
  { spec: "Recommended Resolution", value: "2000 × 2000 pixels" },
  { spec: "Format", value: "JPEG or PNG (WebP auto-converted)" },
  { spec: "Max File Size", value: "5 MB per image" },
  { spec: "Main Image Background", value: "White or neutral (#FFFFFF or #F5F5F5)" },
  { spec: "Minimum Images", value: "3 per listing" },
  { spec: "Maximum Images", value: "10 per listing" },
  { spec: "Aspect Ratio", value: "1:1 (square) for main image" },
];

const imageRules = {
  required: [
    "Main image: product only on white/neutral background",
    "At least one image showing scale (next to a common object or with dimensions overlay)",
    "Close-up detail shot for textured, handmade, or artisanal products",
    "Back/alternate angle for apparel, bags, and accessories",
  ],
  prohibited: [
    "Text overlays, watermarks, or promotional banners",
    "Collages or multiple products in the main image",
    "Stock photos or images from other sellers",
    "Screenshots from social media",
    "Blurry, dark, or heavily filtered images",
    "Images with borders or frames",
  ],
};

const descriptionSections = [
  {
    title: "Product Overview",
    description: "Start with 2-3 sentences describing what the product is, its primary use, and what makes it special. Mention the origin and craftsmanship if relevant.",
    example: "Handcrafted by Maasai artisans in the Arusha region of Tanzania, this beaded necklace features traditional color patterns using glass seed beads on a durable brass wire frame. Each piece takes approximately 8 hours to complete.",
  },
  {
    title: "Specifications",
    description: "Use bullet points for technical details: dimensions, weight, materials, color, size options, etc.",
    example: "• Material: Glass seed beads, brass wire\n• Length: 18 inches (45cm)\n• Weight: 85g\n• Closure: Brass hook clasp\n• Colors: Red, blue, white, green",
  },
  {
    title: "Care & Usage",
    description: "Include care instructions, storage recommendations, or usage guidelines where applicable.",
    example: "Store flat in a cool, dry place. Avoid contact with water or perfumes. Clean gently with a dry, soft cloth.",
  },
  {
    title: "Shipping & Origin",
    description: "Note the country of origin, estimated preparation time, and any relevant certifications.",
    example: "Ships from Arusha, Tanzania. Preparation time: 3-5 business days. Certificate of authenticity included.",
  },
];

const categories = [
  { name: "Fashion & Apparel", examples: "Clothing, shoes, accessories, jewelry, bags" },
  { name: "Art & Crafts", examples: "Paintings, sculptures, pottery, beadwork, textiles" },
  { name: "Gemstones & Minerals", examples: "Tanzanite, diamonds, gold, loose gems, specimens" },
  { name: "Food & Beverages", examples: "Coffee, tea, spices, sauces, dried goods" },
  { name: "Beauty & Wellness", examples: "Shea butter, oils, skincare, aromatherapy" },
  { name: "Home & Living", examples: "Décor, furniture, kitchenware, baskets" },
  { name: "Agriculture", examples: "Seeds, tools, organic produce, fertilizers" },
  { name: "Technology", examples: "Electronics, solar products, accessories" },
  { name: "Industrial", examples: "Raw materials, machinery parts, packaging" },
  { name: "Books & Stationery", examples: "African literature, journals, cards" },
  { name: "Services & Digital", examples: "Consulting, templates, digital artwork" },
];

export default function ListingStandardsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <FileText className="w-4 h-4 text-[#D4A843]" />
            <span className="text-sm text-white/80">Quality First</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Product Listing<br />
            <span className="text-[#D4A843]">Standards</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            High-quality listings build buyer trust and increase your sales. Follow these standards to ensure
            your products are presented professionally on Amana Marketplace.
          </p>
        </div>
      </section>

      {/* Title Format */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Type className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Title Format</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Your title should be clear, descriptive, and follow this format:
            <span className="block mt-2 font-mono text-sm bg-gray-50 rounded-lg p-3 text-gray-700">
              [Product Name] — [Key Attribute], [Secondary Attribute]
            </span>
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50/30">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-800">Good Titles</h3>
              </div>
              <ul className="space-y-2">
                {titleDos.map((t) => (
                  <li key={t} className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2">{t}</li>
                ))}
              </ul>
            </div>
            <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50/30">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-800">Bad Titles</h3>
              </div>
              <ul className="space-y-2">
                {titleDonts.map((t) => (
                  <li key={t} className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2">{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <strong>Rules:</strong> Max 150 characters. No ALL CAPS. No excessive punctuation. No promotional
            language (e.g., &ldquo;BEST DEAL&rdquo;). No keyword stuffing.
          </div>
        </div>
      </section>

      {/* Image Requirements */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Image className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Image Requirements</h2>
          </div>

          {/* Specs Table */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="font-bold mb-4">Technical Specifications</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {imageSpecs.map((s) => (
                <div key={s.spec} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">{s.spec}</span>
                  <span className="font-medium text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Rules */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-green-700 mb-3">✓ Required</h3>
              <ul className="space-y-2">
                {imageRules.required.map((r) => (
                  <li key={r} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-red-700 mb-3">✕ Prohibited</h3>
              <ul className="space-y-2">
                {imageRules.prohibited.map((r) => (
                  <li key={r} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Description Requirements */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Description Requirements</h2>
          </div>
          <p className="text-gray-600 mb-8">
            Every listing description should include these four sections. Use the structured fields provided
            in the listing form for best results.
          </p>
          <div className="space-y-6">
            {descriptionSections.map((s) => (
              <div key={s.title} className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{s.description}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Example:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{s.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Transparency */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <DollarSign className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Pricing Transparency</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 text-sm text-gray-600">
            <p>
              <strong className="text-gray-900">Base Price:</strong> Set in your preferred currency. Multi-currency
              conversion is handled automatically by Amana using daily exchange rates.
            </p>
            <p>
              <strong className="text-gray-900">Shipping Costs:</strong> Must be listed separately. Offer flat-rate,
              weight-based, or free shipping options. Cross-border shipping costs should account for customs and duties.
            </p>
            <p>
              <strong className="text-gray-900">No Hidden Fees:</strong> The price shown to buyers must be the final
              product price. Do not request additional payments outside the Amana platform.
            </p>
            <p>
              <strong className="text-gray-900">Volume Discounts:</strong> If you offer bulk pricing, use the built-in
              tier pricing feature to clearly display price breaks (e.g., 1–10 units, 11–50 units, 51+ units).
            </p>
          </div>
        </div>
      </section>

      {/* Categories & Tags */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-extrabold">Categories & Tags</h2>
          </div>
          <p className="text-gray-600 mb-8">
            Select the most specific category for your product. Add up to 10 tags to improve discoverability.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.name} className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-bold text-sm mb-1">{c.name}</h3>
                <p className="text-xs text-gray-500">{c.examples}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-[#D4A843]/5 rounded-xl p-4 border border-[#D4A843]/20">
            <p className="text-sm text-gray-600">
              <strong>Tag Tips:</strong> Use specific, descriptive tags like &ldquo;tanzanite,&rdquo; &ldquo;AAA-grade,&rdquo;
              &ldquo;handmade,&rdquo; &ldquo;fair-trade&rdquo; rather than generic terms like &ldquo;jewelry&rdquo; or &ldquo;beautiful.&rdquo;
              Tags should describe material, style, origin, and use case.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Ready to Create a Listing?</h2>
          <p className="text-white/60 mb-8">
            Put these standards into practice and create your first product listing on Amana.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/sell">
              <Button size="lg">Create Listing</Button>
            </Link>
            <Link href="/seller-guidelines">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Seller Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
