import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            country: true,
            image: true,
            sellerProfile: {
              select: {
                storeName: true,
                storeSlug: true,
                storeDescription: true,
                trustScore: true,
                isVerified: true,
                totalSales: true,
                avgRating: true,
              },
            },
          },
        },
        category: {
          select: { name: true, slug: true },
        },
        reviews: {
          include: {
            user: {
              select: { name: true, country: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
