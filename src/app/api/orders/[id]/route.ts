import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/orders/[id] - Get order detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: id,
        OR: [
          { buyerId: session.user.id },
          { sellerId: session.user.id },
        ],
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true, images: true, originCountry: true },
            },
          },
        },
        buyer: { select: { name: true, country: true, email: true, image: true } },
        seller: {
          select: {
            name: true,
            country: true,
            image: true,
            sellerProfile: { select: { storeName: true, trustScore: true, isVerified: true } },
          },
        },
        shippingAddress: true,
        events: { orderBy: { createdAt: "desc" } },
        dispute: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Legacy marketplace status and escrow mutations are retired. Order history remains readable.
export async function PATCH() {
  return NextResponse.json({error:"Legacy payment operations are unavailable.",code:"LEGACY_PAYMENTS_DISABLED"},{status:503,headers:{"Cache-Control":"no-store"}});
}
