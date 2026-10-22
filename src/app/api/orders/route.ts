import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/orders - List user orders
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = session.user.role === "SELLER"
      ? { sellerId: session.user.id }
      : { buyerId: session.user.id };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true, images: true, originCountry: true },
            },
          },
        },
        buyer: { select: { name: true, country: true } },
        seller: {
          select: {
            name: true,
            country: true,
            sellerProfile: { select: { storeName: true, storeSlug: true } },
          },
        },
        events: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Online ordering stays closed until the approved payment flow is implemented and tested.
export async function POST() {
  return NextResponse.json({ error: "Online ordering is not available yet.", code: "ORDERING_NOT_LIVE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
