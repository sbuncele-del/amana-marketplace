import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/homepage — products for homepage sections
export async function GET() {
  try {
    const productSelect = {
      id: true,
      name: true,
      slug: true,
      price: true,
      comparePrice: true,
      currency: true,
      images: true,
      originCountry: true,
      stock: true,
      avgRating: true,
      reviewCount: true,
      totalSold: true,
      viewCount: true,
      isFeatured: true,
      isActive: true,
      createdAt: true,
      seller: {
        select: {
          name: true,
          country: true,
          sellerProfile: {
            select: {
              storeName: true,
              storeSlug: true,
              trustScore: true,
              isVerified: true,
            },
          },
        },
      },
      category: {
        select: { name: true, slug: true },
      },
    };

    const [featured, bestSellers, newArrivals, deals, categories] = await Promise.all([
      // Featured products (handpicked by admin / isFeatured flag)
      prisma.product.findMany({
        where: { isActive: true, isApproved: true, isFeatured: true },
        select: productSelect,
        orderBy: { viewCount: "desc" },
        take: 12,
      }),
      // Best sellers by totalSold
      prisma.product.findMany({
        where: { isActive: true, isApproved: true },
        select: productSelect,
        orderBy: { totalSold: "desc" },
        take: 12,
      }),
      // Newest arrivals
      prisma.product.findMany({
        where: { isActive: true, isApproved: true },
        select: productSelect,
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      // Deals (products with comparePrice set)
      prisma.product.findMany({
        where: { isActive: true, isApproved: true, comparePrice: { not: null } },
        select: productSelect,
        orderBy: { totalSold: "desc" },
        take: 12,
      }),
      // Categories with product counts
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      featured,
      bestSellers,
      newArrivals,
      deals,
      categories: categories.map((c) => ({
        ...c,
        productCount: c._count.products,
      })),
    });
  } catch (error) {
    console.error("Homepage API error:", error);
    return NextResponse.json({ error: "Failed to load homepage" }, { status: 500 });
  }
}
