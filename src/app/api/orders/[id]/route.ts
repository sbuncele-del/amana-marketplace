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

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, trackingNumber } = body;

    const order = await prisma.order.findFirst({
      where: { orderNumber: id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    switch (action) {
      case "ship": {
        if (order.sellerId !== session.user.id) {
          return NextResponse.json({ error: "Only seller can mark as shipped" }, { status: 403 });
        }
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "SHIPPED",
            trackingNumber: trackingNumber || null,
            events: {
              create: {
                type: "SHIPPED",
                description: `Order shipped${trackingNumber ? ` — Tracking: ${trackingNumber}` : ""}`,
              },
            },
          },
        });
        break;
      }

      case "delivered": {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "DELIVERED",
            events: {
              create: {
                type: "DELIVERED",
                description: "Order delivered — buyer verification window started (72hrs)",
              },
            },
          },
        });
        break;
      }

      case "approve": {
        if (order.buyerId !== session.user.id) {
          return NextResponse.json({ error: "Only buyer can approve" }, { status: 403 });
        }
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            escrowStatus: "RELEASED",
            events: {
              create: {
                type: "BUYER_APPROVED",
                description: "Buyer approved — escrow funds released to seller",
              },
            },
          },
        });
        break;
      }

      case "dispute": {
        if (order.buyerId !== session.user.id) {
          return NextResponse.json({ error: "Only buyer can open dispute" }, { status: 403 });
        }
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "DISPUTED",
            escrowStatus: "DISPUTED",
            events: {
              create: {
                type: "DISPUTE_OPENED",
                description: "Buyer opened a dispute",
              },
            },
          },
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
