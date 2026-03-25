import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
          select: { id: true, name: true, slug: true },
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

// PUT /api/products/[slug] — Update a product (owner or admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const product = await prisma.product.findUnique({ where: { slug } });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Only the owner or admin can edit
    if (product.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, description, price, currency, categoryId, images,
      originCountry, shipsTo, weight, tags, hsCode, moq, stock, isActive,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (images !== undefined) updateData.images = images;
    if (originCountry !== undefined) updateData.originCountry = originCountry;
    if (shipsTo !== undefined) updateData.shipsTo = shipsTo;
    if (weight !== undefined) updateData.weight = weight;
    if (tags !== undefined) updateData.tags = tags;
    if (hsCode !== undefined) updateData.hsCode = hsCode;
    if (moq !== undefined) updateData.moq = moq;
    if (stock !== undefined) updateData.stock = stock;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/products/[slug] — Delete/deactivate a product (owner or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const product = await prisma.product.findUnique({ where: { slug } });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if product has active orders — soft delete instead of hard delete
    const activeOrders = await prisma.orderItem.count({
      where: {
        productId: product.id,
        order: { status: { in: ["PENDING", "ESCROW_HELD", "SHIPPED", "IN_TRANSIT", "DELIVERED", "BUYER_VERIFYING"] } },
      },
    });

    if (activeOrders > 0) {
      // Soft delete — deactivate so existing orders still reference it
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, message: "Product deactivated (has active orders)" });
    }

    // Hard delete if no active orders
    await prisma.product.delete({ where: { id: product.id } });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
