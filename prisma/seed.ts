// Amana Marketplace — Database Seed Script
// Populates the database with realistic African cross-border marketplace data
//
// Run: npx prisma db seed
// Or:  npx tsx prisma/seed.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ============================================================
// PRODUCT UPLOAD STANDARDS
// ============================================================
// These are the standards every product listing must follow.
// Based on Takealot, Jumia, Amazon seller-central best practices:
//
// ── REQUIRED FIELDS ─────────────────────────────────────────
// name:          3–200 chars. Title case. Format: "[Product] — [Key Spec] [Grade/Size]"
//                Example: "Tanzanite Rough Stone — 12ct AAA Grade"
// description:   Min 50 chars. Rich text. Include: what it is, materials,
//                dimensions/weight, use case, care instructions.
// price:         > 0. In seller's chosen currency.
// currency:      ISO 4217 (USD, KES, NGN, ZAR, GHS, TZS, etc.)
// categoryId:    Must match a valid Category slug.
// stock:         Integer >= 0. Auto-decremented on purchase.
// originCountry: Full country name (e.g. "Tanzania", "Kenya").
// images:        Min 1, max 8 URLs. First image = hero.
//                Specs: square (1:1), min 1000x1000px, white/clean bg,
//                PNG or JPG, max 5MB each.
//
// ── RECOMMENDED FIELDS ──────────────────────────────────────
// shipsTo:       Array of country names this product ships to.
// tags:          Array of lowercase keywords for search discovery.
// weight:        In kg. Required for cross-border (shipping calc).
// hsCode:        Harmonized System code for customs/AfCFTA.
// moq:           Min order quantity (default 1).
// comparePrice:  "Was" price for sale displays.
// sku:           Seller's internal stock-keeping unit.
//
// ── NAMING CONVENTIONS (from Takealot/Jumia) ────────────────
// DO:  "African Print Ankara Fabric — 6 Yards, Wax Block"
// DO:  "Ethiopian Yirgacheffe Coffee — 500g Whole Bean, Grade 1"
// DON'T: "BEST COFFEE!!!!" or "amazing product buy now"
// DON'T: Include seller name in title (it shows separately)
// DON'T: Use ALL CAPS or excessive punctuation
//
// ── IMAGE STANDARDS ─────────────────────────────────────────
// Image 1 (Hero): Product only, white background, no text overlays
// Image 2–4: Different angles / close-ups
// Image 5–6: Product in use / lifestyle shots
// Image 7–8: Packaging, certificates, size reference
//
// ── CATEGORY HIERARCHY ──────────────────────────────────────
// L1: Gemstones, Fashion, Agriculture, Art & Craft, Electronics,
//     Beauty, Food & Spice, Textiles, Minerals, Leather, Home
// L2: (future) Sub-categories per L1
// ============================================================

async function main() {
  console.log("🌍 Seeding Amana Marketplace database...\n");

  // ── CLEAR EXISTING DATA ───────────────────────────────────
  console.log("  Clearing existing data...");
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── CATEGORIES ────────────────────────────────────────────
  console.log("  Creating categories...");
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Gemstones",
        slug: "gemstones",
        description: "Precious and semi-precious gemstones from Africa's rich mineral deposits",
        icon: "💎",
      },
    }),
    prisma.category.create({
      data: {
        name: "Fashion",
        slug: "fashion",
        description: "African fashion, clothing, and accessories",
        icon: "👗",
      },
    }),
    prisma.category.create({
      data: {
        name: "Agriculture",
        slug: "agriculture",
        description: "Agricultural products, seeds, and farm inputs",
        icon: "🌱",
      },
    }),
    prisma.category.create({
      data: {
        name: "Art & Craft",
        slug: "art-craft",
        description: "Handcrafted artwork, sculptures, and artisanal goods",
        icon: "🎨",
      },
    }),
    prisma.category.create({
      data: {
        name: "Electronics",
        slug: "electronics",
        description: "Technology, gadgets, and electronic accessories",
        icon: "📱",
      },
    }),
    prisma.category.create({
      data: {
        name: "Beauty",
        slug: "beauty",
        description: "Natural beauty products, skincare, and cosmetics",
        icon: "✨",
      },
    }),
    prisma.category.create({
      data: {
        name: "Food & Spice",
        slug: "food-spice",
        description: "Specialty foods, spices, and beverages from across Africa",
        icon: "🌶️",
      },
    }),
    prisma.category.create({
      data: {
        name: "Textiles",
        slug: "textiles",
        description: "African fabrics, ankara, kente, kitenge, and raw materials",
        icon: "🧵",
      },
    }),
    prisma.category.create({
      data: {
        name: "Minerals",
        slug: "minerals",
        description: "Industrial minerals, raw materials, and mineral specimens",
        icon: "⛏️",
      },
    }),
    prisma.category.create({
      data: {
        name: "Leather",
        slug: "leather",
        description: "Leather goods, bags, shoes, and accessories",
        icon: "👜",
      },
    }),
    prisma.category.create({
      data: {
        name: "Home & Living",
        slug: "home-living",
        description: "Home decor, furniture, and household goods",
        icon: "🏠",
      },
    }),
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // ── USERS ─────────────────────────────────────────────────
  console.log("  Creating users...");
  const passwordHash = await bcrypt.hash("Amana2026!", 12);

  // Admin
  const admin = await prisma.user.create({
    data: {
      name: "Amana Admin",
      firstName: "Amana",
      lastName: "Admin",
      email: "admin@amana.market",
      passwordHash,
      role: "ADMIN",
      country: "Kenya",
      isActive: true,
      emailVerified: true,
    },
  });

  // ── SELLERS ───────────────────────────────────────────────
  // Seller 1: Kilimanjaro Gems (Tanzania — Gemstones)
  const seller1 = await prisma.user.create({
    data: {
      name: "Joseph Mwakasege",
      firstName: "Joseph",
      lastName: "Mwakasege",
      email: "joseph@kilimanjarogems.co.tz",
      passwordHash,
      role: "SELLER",
      country: "Tanzania",
      city: "Arusha",
      isActive: true,
      emailVerified: true,
      sellerProfile: {
        create: {
          storeName: "Kilimanjaro Gems",
          storeSlug: "kilimanjaro-gems",
          storeDescription:
            "Premium tanzanite, tsavorite, and ruby direct from Tanzania's mining regions. GIA-certified where applicable. Trading since 2018.",
          verification: "VERIFIED",
          isVerified: true,
          trustScore: 94,
          totalSales: 287,
          totalRevenue: 89500,
          avgRating: 4.8,
          responseTime: 45,
          onTimeDelivery: 96,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // Seller 2: Adire Lagos (Nigeria — Fashion/Textiles)
  const seller2 = await prisma.user.create({
    data: {
      name: "Chioma Okafor",
      firstName: "Chioma",
      lastName: "Okafor",
      email: "chioma@adirelagos.ng",
      passwordHash,
      role: "SELLER",
      country: "Nigeria",
      city: "Lagos",
      isActive: true,
      emailVerified: true,
      sellerProfile: {
        create: {
          storeName: "Adire Lagos",
          storeSlug: "adire-lagos",
          storeDescription:
            "Authentic adire textiles, ankara fabrics, and contemporary African fashion. Handcrafted by artisans in Abeokuta and Lagos.",
          verification: "VERIFIED",
          isVerified: true,
          trustScore: 91,
          totalSales: 412,
          totalRevenue: 67800,
          avgRating: 4.7,
          responseTime: 30,
          onTimeDelivery: 94,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // Seller 3: Yirgacheffe Origin (Ethiopia — Coffee/Agriculture)
  const seller3 = await prisma.user.create({
    data: {
      name: "Meseret Bekele",
      firstName: "Meseret",
      lastName: "Bekele",
      email: "meseret@yirgacheffe.et",
      passwordHash,
      role: "SELLER",
      country: "Ethiopia",
      city: "Addis Ababa",
      isActive: true,
      emailVerified: true,
      sellerProfile: {
        create: {
          storeName: "Yirgacheffe Origin",
          storeSlug: "yirgacheffe-origin",
          storeDescription:
            "Single-origin Ethiopian coffee beans, teff flour, and specialty agricultural products. Direct from cooperatives in Sidama and Yirgacheffe.",
          verification: "VERIFIED",
          isVerified: true,
          trustScore: 89,
          totalSales: 531,
          totalRevenue: 42300,
          avgRating: 4.9,
          responseTime: 60,
          onTimeDelivery: 92,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // Seller 4: Nairobi Leather Co (Kenya — Leather)
  const seller4 = await prisma.user.create({
    data: {
      name: "Wanjiku Kamau",
      firstName: "Wanjiku",
      lastName: "Kamau",
      email: "wanjiku@nairobileather.ke",
      passwordHash,
      role: "SELLER",
      country: "Kenya",
      city: "Nairobi",
      isActive: true,
      emailVerified: true,
      sellerProfile: {
        create: {
          storeName: "Nairobi Leather Co",
          storeSlug: "nairobi-leather-co",
          storeDescription:
            "Handcrafted leather bags, wallets, and accessories. Made from ethically sourced Kenyan leather by skilled artisans in Nairobi's Kariokor market.",
          verification: "VERIFIED",
          isVerified: true,
          trustScore: 87,
          totalSales: 198,
          totalRevenue: 35600,
          avgRating: 4.6,
          responseTime: 25,
          onTimeDelivery: 97,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // Seller 5: Accra Shea (Ghana — Beauty)
  const seller5 = await prisma.user.create({
    data: {
      name: "Abena Mensah",
      firstName: "Abena",
      lastName: "Mensah",
      email: "abena@accrashea.gh",
      passwordHash,
      role: "SELLER",
      country: "Ghana",
      city: "Accra",
      isActive: true,
      emailVerified: true,
      sellerProfile: {
        create: {
          storeName: "Accra Shea Collective",
          storeSlug: "accra-shea-collective",
          storeDescription:
            "100% pure, unrefined shea butter and natural beauty products. Sourced directly from women's cooperatives in Northern Ghana.",
          verification: "VERIFIED",
          isVerified: true,
          trustScore: 92,
          totalSales: 824,
          totalRevenue: 28900,
          avgRating: 4.8,
          responseTime: 40,
          onTimeDelivery: 95,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // Seller 6: Cape Artisan (South Africa — Art)
  const seller6 = await prisma.user.create({
    data: {
      name: "Sipho Ndlovu",
      firstName: "Sipho",
      lastName: "Ndlovu",
      email: "sipho@capeartisan.za",
      passwordHash,
      role: "SELLER",
      country: "South Africa",
      city: "Cape Town",
      isActive: true,
      emailVerified: true,
      sellerProfile: {
        create: {
          storeName: "Cape Artisan Gallery",
          storeSlug: "cape-artisan-gallery",
          storeDescription:
            "Contemporary African art, wooden sculptures, beadwork, and curated handcraft from Southern African artists.",
          verification: "VERIFIED",
          isVerified: true,
          trustScore: 88,
          totalSales: 156,
          totalRevenue: 52400,
          avgRating: 4.7,
          responseTime: 55,
          onTimeDelivery: 93,
        },
      },
    },
    include: { sellerProfile: true },
  });

  // ── BUYERS ────────────────────────────────────────────────
  const buyer1 = await prisma.user.create({
    data: {
      name: "Kwame Asante",
      firstName: "Kwame",
      lastName: "Asante",
      email: "kwame@buyer.test",
      passwordHash,
      role: "BUYER",
      country: "Ghana",
      city: "Accra",
      isActive: true,
      emailVerified: true,
      addresses: {
        create: {
          fullName: "Kwame Asante",
          phone: "+233201234567",
          street: "14 Oxford Street, Osu",
          city: "Accra",
          state: "Greater Accra",
          zip: "GA-123",
          country: "Ghana",
          isDefault: true,
        },
      },
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      name: "Amina Kimathi",
      firstName: "Amina",
      lastName: "Kimathi",
      email: "amina@buyer.test",
      passwordHash,
      role: "BUYER",
      country: "Kenya",
      city: "Nairobi",
      isActive: true,
      emailVerified: true,
      addresses: {
        create: {
          fullName: "Amina Kimathi",
          phone: "+254712345678",
          street: "Kenyatta Avenue, CBD",
          city: "Nairobi",
          state: "Nairobi County",
          zip: "00100",
          country: "Kenya",
          isDefault: true,
        },
      },
    },
  });

  const buyer3 = await prisma.user.create({
    data: {
      name: "Oluwaseun Dada",
      firstName: "Oluwaseun",
      lastName: "Dada",
      email: "seun@buyer.test",
      passwordHash,
      role: "BUYER",
      country: "Nigeria",
      city: "Lagos",
      isActive: true,
      emailVerified: true,
      addresses: {
        create: {
          fullName: "Oluwaseun Dada",
          phone: "+2348012345678",
          street: "15 Admiralty Way, Lekki Phase 1",
          city: "Lagos",
          state: "Lagos",
          zip: "101233",
          country: "Nigeria",
          isDefault: true,
        },
      },
    },
  });

  // ── PRODUCTS ──────────────────────────────────────────────
  console.log("  Creating products (following listing standards)...");

  // Kilimanjaro Gems products
  const products = await Promise.all([
    // ---- GEMSTONES (seller1) ----
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        categoryId: catMap["gemstones"],
        name: "Tanzanite Rough Stone — 12ct AAA Grade",
        slug: "tanzanite-rough-12ct-aaa",
        description:
          "Natural tanzanite rough crystal sourced from the Merelani Hills mine, Arusha, Tanzania. Exceptional AAA grade with deep violet-blue color saturation. Weight: 12 carats (2.4g). Ideal for custom cutting or collector display. Certificate of origin included. All Amana gemstone purchases are escrow-protected until verified.",
        price: 480,
        comparePrice: 650,
        currency: "USD",
        stock: 5,
        weight: 0.0024,
        originCountry: "Tanzania",
        shipsTo: ["Kenya", "South Africa", "Nigeria", "Ghana", "Uganda", "Rwanda", "Ethiopia"],
        hsCode: "7103.10",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1551122089-4e3e72477432?w=800&q=80", "https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=800&q=80"],
        tags: ["tanzanite", "rough", "aaa", "merelani", "collector", "investment"],
        isActive: true,
        isApproved: true,
        isFeatured: true,
        totalSold: 23,
        avgRating: 4.9,
        reviewCount: 18,
        viewCount: 1247,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        categoryId: catMap["gemstones"],
        name: "Tsavorite Garnet — 3ct AAA, Vivid Green",
        slug: "tsavorite-garnet-3ct-vivid",
        description:
          "Natural tsavorite garnet from Komolo mine region, Tanzania. Vivid green color with excellent clarity and brilliance. Weight: 3.1 carats. Faceted oval cut. Comes with gemological certification. Perfect for high-end jewelry setting.",
        price: 185,
        comparePrice: 250,
        currency: "USD",
        stock: 12,
        weight: 0.0006,
        originCountry: "Tanzania",
        shipsTo: ["Kenya", "South Africa", "Nigeria", "Ghana"],
        hsCode: "7103.91",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80"],
        tags: ["tsavorite", "garnet", "green", "faceted", "jewelry"],
        isActive: true,
        isApproved: true,
        totalSold: 45,
        avgRating: 4.8,
        reviewCount: 31,
        viewCount: 892,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        categoryId: catMap["gemstones"],
        name: "Ruby Rough — 6ct, Pigeon Blood Red",
        slug: "ruby-rough-6ct-pigeon-blood",
        description:
          "Premium natural ruby rough crystal from Longido, Tanzania. Classic 'pigeon blood' red color with strong fluorescence. Weight: 6.2 carats. Unheated and untreated. Ideal for high-value custom cutting. Certificate of authenticity included.",
        price: 540,
        comparePrice: 720,
        currency: "USD",
        stock: 3,
        weight: 0.0012,
        originCountry: "Tanzania",
        shipsTo: ["Kenya", "South Africa", "Nigeria"],
        hsCode: "7103.10",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"],
        tags: ["ruby", "rough", "pigeon blood", "unheated", "investment", "longido"],
        isActive: true,
        isApproved: true,
        isFeatured: true,
        totalSold: 8,
        avgRating: 4.7,
        reviewCount: 6,
        viewCount: 654,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller1.id,
        categoryId: catMap["gemstones"],
        name: "Sapphire Cabochon — 4ct, Star Effect",
        slug: "sapphire-cabochon-4ct-star",
        description:
          "Natural star sapphire cabochon with prominent 6-ray asterism. Sourced from Umba Valley, Tanzania. Weight: 4.3 carats. Medium blue with silver star. Polished dome cut. Ideal for statement rings.",
        price: 275,
        currency: "USD",
        stock: 8,
        weight: 0.0009,
        originCountry: "Tanzania",
        shipsTo: ["Kenya", "South Africa", "Nigeria", "Ghana", "Rwanda"],
        hsCode: "7103.91",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=800&q=80"],
        tags: ["sapphire", "star", "cabochon", "umba", "jewelry"],
        isActive: true,
        isApproved: true,
        totalSold: 14,
        avgRating: 4.6,
        reviewCount: 9,
        viewCount: 445,
      },
    }),

    // ---- FASHION & TEXTILES (seller2) ----
    prisma.product.create({
      data: {
        sellerId: seller2.id,
        categoryId: catMap["textiles"],
        name: "Adire Indigo Fabric — 5 Yards, Hand-dyed Resist Pattern",
        slug: "adire-indigo-5yards-resist",
        description:
          "Authentic hand-dyed adire fabric from Abeokuta, Nigeria. Traditional resist-dyeing technique using cassava paste (adire eleko). Deep indigo blue with intricate geometric patterns. 100% cotton, 5 yards (4.57m). Pre-washed for colorfastness. Each piece is unique.",
        price: 45,
        comparePrice: 65,
        currency: "USD",
        stock: 30,
        weight: 0.8,
        originCountry: "Nigeria",
        shipsTo: ["Ghana", "Kenya", "South Africa", "Tanzania", "Senegal", "Côte d'Ivoire"],
        hsCode: "5208.52",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80"],
        tags: ["adire", "indigo", "fabric", "abeokuta", "hand-dyed", "cotton", "traditional"],
        isActive: true,
        isApproved: true,
        isFeatured: true,
        totalSold: 186,
        avgRating: 4.8,
        reviewCount: 94,
        viewCount: 2341,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller2.id,
        categoryId: catMap["fashion"],
        name: "Ankara Wax Print Jumpsuit — Contemporary African Design",
        slug: "ankara-wax-jumpsuit-contemporary",
        description:
          "Modern jumpsuit crafted from premium ankara wax print fabric. Tailored fit with wide legs, side pockets, and adjustable waist tie. Available in sizes S-XL. Made by skilled tailors in Lagos. Machine washable. Bold geometric print in orange and teal.",
        price: 78,
        currency: "USD",
        stock: 15,
        weight: 0.4,
        originCountry: "Nigeria",
        shipsTo: ["Ghana", "Kenya", "South Africa", "Tanzania", "Uganda", "Rwanda"],
        hsCode: "6204.63",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80"],
        tags: ["ankara", "jumpsuit", "fashion", "womenswear", "contemporary", "african-print"],
        isActive: true,
        isApproved: true,
        totalSold: 72,
        avgRating: 4.5,
        reviewCount: 38,
        viewCount: 1890,
      },
    }),

    // ---- AGRICULTURE / COFFEE (seller3) ----
    prisma.product.create({
      data: {
        sellerId: seller3.id,
        categoryId: catMap["food-spice"],
        name: "Ethiopian Yirgacheffe Coffee — 500g Whole Bean, Grade 1",
        slug: "yirgacheffe-coffee-500g-grade1",
        description:
          "Single-origin Ethiopian coffee from Yirgacheffe washing stations. Grade 1 (highest). Bright citrus acidity with blueberry and jasmine notes. Altitude: 1,800–2,200m. Light-medium roast. Whole bean, 500g vacuum-sealed bag. Roasted within 7 days of shipping.",
        price: 18,
        currency: "USD",
        stock: 200,
        weight: 0.55,
        originCountry: "Ethiopia",
        shipsTo: [
          "Kenya", "Tanzania", "Uganda", "Rwanda", "Nigeria", "Ghana",
          "South Africa", "Egypt", "Morocco", "Senegal",
        ],
        hsCode: "0901.21",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80", "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80"],
        tags: ["coffee", "yirgacheffe", "ethiopian", "grade1", "single-origin", "arabica"],
        isActive: true,
        isApproved: true,
        isFeatured: true,
        totalSold: 412,
        avgRating: 4.9,
        reviewCount: 203,
        viewCount: 5620,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller3.id,
        categoryId: catMap["food-spice"],
        name: "Berbere Spice Blend — 250g, Authentic Ethiopian Recipe",
        slug: "berbere-spice-250g-authentic",
        description:
          "Traditional Ethiopian berbere spice blend made from chili peppers, fenugreek, coriander, cardamom, and 12 other spices. Stone-ground in small batches. Essential for doro wat, kitfo, and other Ethiopian dishes. 250g resealable pouch. No preservatives or additives.",
        price: 12,
        currency: "USD",
        stock: 150,
        weight: 0.28,
        originCountry: "Ethiopia",
        shipsTo: ["Kenya", "Tanzania", "Uganda", "Nigeria", "Ghana", "South Africa"],
        hsCode: "0910.91",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80"],
        tags: ["berbere", "spice", "ethiopian", "cooking", "traditional", "organic"],
        isActive: true,
        isApproved: true,
        totalSold: 287,
        avgRating: 4.8,
        reviewCount: 142,
        viewCount: 3210,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller3.id,
        categoryId: catMap["agriculture"],
        name: "Teff Grain — 1kg, Brown Teff from Sidama, Ethiopia",
        slug: "teff-grain-1kg-brown-sidama",
        description:
          "Premium brown teff grain from Sidama, Ethiopia. Gluten-free ancient grain, rich in iron, calcium, and protein. Essential for making injera flatbread. Also great for porridge, baking, and smoothies. 1kg food-grade sealed package.",
        price: 9,
        currency: "USD",
        stock: 300,
        weight: 1.05,
        originCountry: "Ethiopia",
        shipsTo: ["Kenya", "Tanzania", "Uganda", "Rwanda", "South Africa"],
        hsCode: "1008.90",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80"],
        tags: ["teff", "grain", "gluten-free", "injera", "superfood", "sidama"],
        isActive: true,
        isApproved: true,
        totalSold: 189,
        avgRating: 4.7,
        reviewCount: 76,
        viewCount: 2100,
      },
    }),

    // ---- LEATHER (seller4) ----
    prisma.product.create({
      data: {
        sellerId: seller4.id,
        categoryId: catMap["leather"],
        name: "Handcrafted Leather Messenger Bag — Full Grain, Vintage Brown",
        slug: "leather-messenger-bag-vintage-brown",
        description:
          "Full-grain leather messenger bag handcrafted by artisans in Nairobi's Kariokor market. Fits 15\" laptop. Adjustable shoulder strap, brass buckle closure, 3 interior compartments, 1 zipper pocket. Dimensions: 38×28×10cm. Ages beautifully with use.",
        price: 120,
        currency: "USD",
        stock: 10,
        weight: 1.2,
        originCountry: "Kenya",
        shipsTo: ["Tanzania", "Uganda", "Rwanda", "South Africa", "Nigeria", "Ghana"],
        hsCode: "4202.21",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80", "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"],
        tags: ["leather", "messenger", "bag", "handcrafted", "laptop", "full-grain"],
        isActive: true,
        isApproved: true,
        isFeatured: true,
        totalSold: 67,
        avgRating: 4.7,
        reviewCount: 41,
        viewCount: 1560,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller4.id,
        categoryId: catMap["leather"],
        name: "Leather Card Wallet — Slim Bifold, Hand-stitched",
        slug: "leather-card-wallet-slim-bifold",
        description:
          "Minimalist card wallet in genuine Kenyan leather. Hand-stitched with waxed thread. 6 card slots, 2 note compartments. Dimensions: 11×8cm when folded. Available in tan, dark brown, and black. Makes an excellent gift.",
        price: 28,
        comparePrice: 40,
        currency: "USD",
        stock: 45,
        weight: 0.06,
        originCountry: "Kenya",
        shipsTo: ["Tanzania", "Uganda", "Rwanda", "South Africa", "Nigeria", "Ghana", "Ethiopia"],
        hsCode: "4202.31",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80"],
        tags: ["wallet", "leather", "card-holder", "bifold", "hand-stitched", "gift"],
        isActive: true,
        isApproved: true,
        totalSold: 134,
        avgRating: 4.6,
        reviewCount: 78,
        viewCount: 2890,
      },
    }),

    // ---- BEAUTY (seller5) ----
    prisma.product.create({
      data: {
        sellerId: seller5.id,
        categoryId: catMap["beauty"],
        name: "Pure Shea Butter — 500g, Unrefined Grade A, Northern Ghana",
        slug: "pure-shea-butter-500g-unrefined",
        description:
          "100% pure, unrefined shea butter from women's cooperatives in Tamale, Northern Ghana. Grade A quality. Rich in vitamins A, E, and F. Excellent for skin moisturizing, hair conditioning, and healing. Cold-pressed, no chemicals or additives. 500g jar.",
        price: 15,
        currency: "USD",
        stock: 100,
        weight: 0.55,
        originCountry: "Ghana",
        shipsTo: [
          "Nigeria", "Kenya", "South Africa", "Tanzania", "Uganda",
          "Senegal", "Côte d'Ivoire", "Cameroon",
        ],
        hsCode: "1515.90",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80"],
        tags: ["shea-butter", "unrefined", "organic", "skincare", "natural", "ghana"],
        isActive: true,
        isApproved: true,
        isFeatured: true,
        totalSold: 623,
        avgRating: 4.9,
        reviewCount: 312,
        viewCount: 7840,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller5.id,
        categoryId: catMap["beauty"],
        name: "African Black Soap — 200g, Raw, Traditional Ghanaian",
        slug: "african-black-soap-200g-raw",
        description:
          "Traditional African black soap (alata samina) handmade in Ghana. Made from plantain skins, cocoa pods, palm kernel oil, and shea butter. 200g bar. Gentle cleanser suitable for all skin types. Helps with acne, eczema, and hyperpigmentation.",
        price: 8,
        currency: "USD",
        stock: 200,
        weight: 0.22,
        originCountry: "Ghana",
        shipsTo: ["Nigeria", "Kenya", "South Africa", "Tanzania", "Uganda", "Senegal"],
        hsCode: "3401.19",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&q=80"],
        tags: ["black-soap", "alata-samina", "skincare", "acne", "natural", "handmade"],
        isActive: true,
        isApproved: true,
        totalSold: 891,
        avgRating: 4.8,
        reviewCount: 445,
        viewCount: 9120,
      },
    }),

    // ---- ART & CRAFT (seller6) ----
    prisma.product.create({
      data: {
        sellerId: seller6.id,
        categoryId: catMap["art-craft"],
        name: "Zulu Beaded Necklace — Handcrafted, Traditional Isicholo Pattern",
        slug: "zulu-beaded-necklace-isicholo",
        description:
          "Hand-beaded Zulu necklace featuring traditional isicholo-inspired geometric patterns. Made by Zulu artisans in KwaZulu-Natal, South Africa. Glass seed beads on cotton thread. Adjustable length: 40–50cm. Each piece takes 3–5 days to create.",
        price: 35,
        comparePrice: 50,
        currency: "USD",
        stock: 20,
        weight: 0.15,
        originCountry: "South Africa",
        shipsTo: ["Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda", "Botswana"],
        hsCode: "7117.90",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&q=80"],
        tags: ["zulu", "beadwork", "necklace", "handcrafted", "traditional", "isicholo"],
        isActive: true,
        isApproved: true,
        totalSold: 89,
        avgRating: 4.7,
        reviewCount: 52,
        viewCount: 1340,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: seller6.id,
        categoryId: catMap["art-craft"],
        name: "Wooden Giraffe Sculpture — Hand-carved Jacaranda, 30cm",
        slug: "wooden-giraffe-sculpture-30cm",
        description:
          "Hand-carved giraffe sculpture from jacaranda wood. Created by woodworkers in Cape Town. Height: 30cm. Smooth sanded finish with natural wood grain visible. Each piece is unique. Display stand included. Perfect for home decor or gifting.",
        price: 42,
        currency: "USD",
        stock: 15,
        weight: 0.45,
        originCountry: "South Africa",
        shipsTo: ["Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda"],
        hsCode: "4420.10",
        afcftaEligible: true,
        images: ["https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=800&q=80"],
        tags: ["sculpture", "giraffe", "woodcarving", "jacaranda", "decor", "handmade"],
        isActive: true,
        isApproved: true,
        totalSold: 56,
        avgRating: 4.8,
        reviewCount: 33,
        viewCount: 980,
      },
    }),
  ]);

  // ── ORDERS ────────────────────────────────────────────────
  console.log("  Creating sample orders with escrow lifecycle...");

  // Get buyer addresses
  const buyer1Address = await prisma.address.findFirst({ where: { userId: buyer1.id } });
  const buyer2Address = await prisma.address.findFirst({ where: { userId: buyer2.id } });
  const buyer3Address = await prisma.address.findFirst({ where: { userId: buyer3.id } });

  // Order 1: Completed (full escrow lifecycle)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "AMN-7818",
      buyerId: buyer1.id,
      sellerId: seller1.id,
      shippingAddressId: buyer1Address!.id,
      status: "COMPLETED",
      subtotal: 540,
      shippingCost: 25,
      totalAmount: 573.10, // 540 + 25 + 8.10 escrow fee
      currency: "USD",
      escrowStatus: "RELEASED",
      escrowReleasedAt: new Date("2026-02-22"),
      paymentMethod: "card",
      originCountry: "Tanzania",
      destinationCountry: "Ghana",
      isCrossBorder: true,
      trackingNumber: "DHL-AF-9283471",
      shippedAt: new Date("2026-02-18"),
      deliveredAt: new Date("2026-02-21"),
      buyerApprovedAt: new Date("2026-02-22"),
      items: {
        create: {
          productId: products[2].id, // Ruby
          quantity: 1,
          price: 540,
        },
      },
      events: {
        createMany: {
          data: [
            { type: "ORDER_CREATED", description: "Order created for 1x Ruby Rough — 6ct", createdAt: new Date("2026-02-16") },
            { type: "PAYMENT_RECEIVED", description: "Payment of $573.10 received via card", createdAt: new Date("2026-02-16") },
            { type: "ESCROW_FUNDED", description: "Funds held in escrow via Vesicash", createdAt: new Date("2026-02-16") },
            { type: "SHIPPED", description: "Shipped via DHL Express — Tracking: DHL-AF-9283471", createdAt: new Date("2026-02-18") },
            { type: "DELIVERED", description: "Package delivered. Buyer verification window: 72hrs", createdAt: new Date("2026-02-21") },
            { type: "BUYER_APPROVED", description: "Buyer approved. Escrow released to seller.", createdAt: new Date("2026-02-22") },
          ],
        },
      },
    },
  });

  // Order 2: In Escrow (awaiting shipment)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: "AMN-7821",
      buyerId: buyer1.id,
      sellerId: seller1.id,
      shippingAddressId: buyer1Address!.id,
      status: "ESCROW_HELD",
      subtotal: 480,
      shippingCost: 25,
      totalAmount: 512.20,
      currency: "USD",
      escrowStatus: "FUNDED",
      escrowFundedAt: new Date("2026-02-27"),
      paymentMethod: "card",
      originCountry: "Tanzania",
      destinationCountry: "Ghana",
      isCrossBorder: true,
      items: {
        create: {
          productId: products[0].id, // Tanzanite
          quantity: 1,
          price: 480,
        },
      },
      events: {
        createMany: {
          data: [
            { type: "ORDER_CREATED", description: "Order created for 1x Tanzanite Rough — 12ct AAA", createdAt: new Date("2026-02-27") },
            { type: "ESCROW_FUNDED", description: "Payment held in escrow. Awaiting seller shipment.", createdAt: new Date("2026-02-27") },
          ],
        },
      },
    },
  });

  // Order 3: Shipped (in transit)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: "AMN-7820",
      buyerId: buyer2.id,
      sellerId: seller1.id,
      shippingAddressId: buyer2Address!.id,
      status: "SHIPPED",
      subtotal: 185,
      shippingCost: 15,
      totalAmount: 202.78,
      currency: "USD",
      escrowStatus: "FUNDED",
      escrowFundedAt: new Date("2026-02-25"),
      paymentMethod: "mpesa",
      originCountry: "Tanzania",
      destinationCountry: "Kenya",
      isCrossBorder: true,
      trackingNumber: "DHL-AF-9283502",
      shippedAt: new Date("2026-02-26"),
      items: {
        create: {
          productId: products[1].id, // Tsavorite
          quantity: 1,
          price: 185,
        },
      },
      events: {
        createMany: {
          data: [
            { type: "ORDER_CREATED", description: "Order created", createdAt: new Date("2026-02-25") },
            { type: "ESCROW_FUNDED", description: "M-Pesa payment held in escrow", createdAt: new Date("2026-02-25") },
            { type: "SHIPPED", description: "Shipped — DHL-AF-9283502", createdAt: new Date("2026-02-26") },
          ],
        },
      },
    },
  });

  // Order 4: Buyer Verifying
  const order4 = await prisma.order.create({
    data: {
      orderNumber: "AMN-7819",
      buyerId: buyer3.id,
      sellerId: seller2.id,
      shippingAddressId: buyer3Address!.id,
      status: "BUYER_VERIFYING",
      subtotal: 78,
      shippingCost: 12,
      totalAmount: 91.17,
      currency: "USD",
      escrowStatus: "FUNDED",
      paymentMethod: "card",
      originCountry: "Nigeria",
      destinationCountry: "Nigeria",
      isCrossBorder: false,
      verifyDeadline: new Date("2026-03-01"),
      deliveredAt: new Date("2026-02-25"),
      items: {
        create: {
          productId: products[5].id, // Ankara jumpsuit
          quantity: 1,
          price: 78,
        },
      },
      events: {
        createMany: {
          data: [
            { type: "ORDER_CREATED", description: "Order created", createdAt: new Date("2026-02-22") },
            { type: "ESCROW_FUNDED", description: "Payment held in escrow", createdAt: new Date("2026-02-22") },
            { type: "SHIPPED", description: "Shipped within Lagos", createdAt: new Date("2026-02-23") },
            { type: "DELIVERED", description: "Delivered. Buyer verification window open until Mar 1.", createdAt: new Date("2026-02-25") },
          ],
        },
      },
    },
  });

  // Order 5: Disputed
  const order5 = await prisma.order.create({
    data: {
      orderNumber: "AMN-7815",
      buyerId: buyer2.id,
      sellerId: seller4.id,
      shippingAddressId: buyer2Address!.id,
      status: "DISPUTED",
      subtotal: 120,
      shippingCost: 15,
      totalAmount: 136.80,
      currency: "USD",
      escrowStatus: "DISPUTED",
      paymentMethod: "mpesa",
      originCountry: "Kenya",
      destinationCountry: "Kenya",
      isCrossBorder: false,
      deliveredAt: new Date("2026-02-20"),
      items: {
        create: {
          productId: products[10].id, // Messenger bag
          quantity: 1,
          price: 120,
        },
      },
      events: {
        createMany: {
          data: [
            { type: "ORDER_CREATED", description: "Order created", createdAt: new Date("2026-02-17") },
            { type: "ESCROW_FUNDED", description: "Payment held in escrow", createdAt: new Date("2026-02-17") },
            { type: "SHIPPED", description: "Shipped within Nairobi", createdAt: new Date("2026-02-18") },
            { type: "DELIVERED", description: "Delivered", createdAt: new Date("2026-02-20") },
            { type: "DISPUTE_OPENED", description: "Buyer: Item received with different stitching than shown in photos", createdAt: new Date("2026-02-21") },
          ],
        },
      },
      dispute: {
        create: {
          reason: "Item not as described",
          description:
            "The messenger bag received has different stitching pattern than what was shown in the listing photos. The leather color is also slightly lighter. Requesting partial refund or replacement.",
          evidence: [],
          status: "OPEN",
        },
      },
    },
  });

  // ── REVIEWS ───────────────────────────────────────────────
  console.log("  Creating reviews...");

  await Promise.all([
    prisma.review.create({
      data: {
        productId: products[0].id,
        userId: buyer1.id,
        rating: 5,
        title: "Exceptional tanzanite quality",
        comment:
          "The color saturation on this piece is incredible. Arrived well-packaged in a padded gem case. Joseph was very communicative throughout the escrow process. Will definitely buy again.",
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        productId: products[6].id,
        userId: buyer2.id,
        rating: 5,
        title: "Best coffee I've ever tasted",
        comment:
          "The blueberry notes are real! Freshly roasted and vacuum sealed. Arrived in Kenya within 5 days. The grind is perfect for pour-over. Already ordering more.",
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        productId: products[4].id,
        userId: buyer3.id,
        rating: 5,
        title: "Authentic adire — museum quality",
        comment:
          "This is the real deal. Hand-dyed with natural indigo. The patterns are intricate and tell a story. Great for both fashion and home decor. Shipping from Lagos to Lagos was just 2 days.",
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        productId: products[12].id,
        userId: buyer1.id,
        rating: 4,
        title: "Beautiful shea butter, great for skin",
        comment:
          "Unrefined and pure. You can tell the difference from commercial products. Slightly strong smell (natural) but absorbs well. Will order the 1kg next.",
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        productId: products[11].id,
        userId: buyer2.id,
        rating: 5,
        title: "Perfect slim wallet",
        comment:
          "The leather quality is outstanding — smooth and supple. Hand-stitching is impeccable. Fits all my cards without being bulky. Gift-wrapped too!",
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        productId: products[1].id,
        userId: buyer2.id,
        rating: 5,
        title: "Vivid green — stunning tsavorite",
        comment:
          "Better than the photos. Vivid green with excellent clarity. Came with certificate. Perfect for my wife's ring design. Escrow process was smooth — released funds as soon as I confirmed.",
        isVerified: true,
      },
    }),
  ]);

  // ── NOTIFICATIONS ─────────────────────────────────────────
  console.log("  Creating notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: seller1.id,
        type: "ORDER_NEW",
        title: "New Order Received",
        message: "Kwame A. from Ghana ordered Tanzanite Rough — 12ct AAA. Funds are in escrow. Please ship within 48hrs.",
        link: "/dashboard/orders",
        isRead: false,
      },
      {
        userId: seller1.id,
        type: "ESCROW_RELEASED",
        title: "Payment Released!",
        message: "Escrow released for order AMN-7818 (Ruby Rough — 6ct). $540 will be deposited to your account.",
        link: "/dashboard/orders",
        isRead: true,
      },
      {
        userId: buyer1.id,
        type: "ORDER_SHIPPED",
        title: "Your Order Has Shipped",
        message: "Your Tanzanite Rough — 12ct AAA from Kilimanjaro Gems has been shipped. Track: DHL-AF-9283502",
        link: "/orders/AMN-7821",
        isRead: false,
      },
      {
        userId: seller4.id,
        type: "DISPUTE_OPENED",
        title: "Dispute Opened on Order AMN-7815",
        message: "Amina K. has opened a dispute on their messenger bag order. Please respond within 48 hours.",
        link: "/dashboard/orders",
        isRead: false,
      },
    ],
  });

  // ── SUMMARY ───────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("  📊 Summary:");
  console.log(`     ${1} admin account`);
  console.log(`     ${6} seller stores (with profiles)`);
  console.log(`     ${3} buyer accounts (with addresses)`);
  console.log(`     ${11} categories`);
  console.log(`     ${products.length} products`);
  console.log(`     5 orders (across escrow lifecycle)`);
  console.log(`     6 reviews`);
  console.log(`     4 notifications`);
  console.log("\n  🔑 Login credentials (all accounts):");
  console.log("     Password: Amana2026!");
  console.log("\n  🧑‍💼 Test accounts:");
  console.log("     Admin:     admin@amana.market");
  console.log("     Seller:    joseph@kilimanjarogems.co.tz (Kilimanjaro Gems)");
  console.log("     Seller:    chioma@adirelagos.ng (Adire Lagos)");
  console.log("     Seller:    meseret@yirgacheffe.et (Yirgacheffe Origin)");
  console.log("     Seller:    wanjiku@nairobileather.ke (Nairobi Leather Co)");
  console.log("     Seller:    abena@accrashea.gh (Accra Shea Collective)");
  console.log("     Seller:    sipho@capeartisan.za (Cape Artisan Gallery)");
  console.log("     Buyer:     kwame@buyer.test (Ghana)");
  console.log("     Buyer:     amina@buyer.test (Kenya)");
  console.log("     Buyer:     seun@buyer.test (Nigeria)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
