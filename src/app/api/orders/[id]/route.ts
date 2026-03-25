import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { releaseEscrow, createDispute as vesicashDispute } from "@/lib/vesicash";
import { sendShippingNotificationEmail, sendEscrowReleasedEmail } from "@/lib/email";

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
            shippedAt: new Date(),
            events: {
              create: {
                type: "SHIPPED",
                description: `Order shipped${trackingNumber ? ` — Tracking: ${trackingNumber}` : ""}`,
              },
            },
          },
        });

        // Send shipping notification to buyer
        try {
          const buyer = await prisma.user.findUnique({ where: { id: order.buyerId }, select: { email: true, name: true } });
          const seller = await prisma.user.findUnique({ where: { id: order.sellerId }, select: { sellerProfile: { select: { storeName: true } } } });
          if (buyer?.email) {
            await sendShippingNotificationEmail(
              buyer.email,
              buyer.name || "Customer",
              { orderNumber: order.orderNumber, trackingNumber: trackingNumber || null, storeName: seller?.sellerProfile?.storeName || "Seller" }
            );
          }
        } catch (emailErr) {
          console.error("Shipping notification email failed:", emailErr);
        }
        break;
      }

      case "delivered": {
        const verifyDeadline = new Date();
        verifyDeadline.setHours(verifyDeadline.getHours() + 72); // 72-hour inspection window

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
            verifyDeadline,
            events: {
              create: {
                type: "DELIVERED",
                description: `Order delivered — buyer has until ${verifyDeadline.toISOString().split("T")[0]} to verify (72hr window)`,
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

        // Release escrow funds to seller via Vesicash
        if (order.escrowTransactionId) {
          try {
            await releaseEscrow(order.escrowTransactionId);
          } catch (escrowError) {
            console.error("Escrow release failed:", escrowError);
            // Still mark as completed — admin can reconcile
          }
        }

        // Update seller stats
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: {
              status: "COMPLETED",
              escrowStatus: "RELEASED",
              escrowReleasedAt: new Date(),
              buyerApprovedAt: new Date(),
              events: {
                create: {
                  type: "BUYER_APPROVED",
                  description: `Buyer approved. Escrow released: ${order.currency} ${(order.sellerPayout || order.totalAmount * 0.95).toFixed(2)} to seller (after 5% platform fee).`,
                },
              },
            },
          }),
          // Update seller profile revenue
          prisma.sellerProfile.updateMany({
            where: { userId: order.sellerId },
            data: {
              totalSales: { increment: 1 },
              totalRevenue: { increment: order.sellerPayout || order.totalAmount * 0.95 },
            },
          }),
        ]);

        // Update product sold counts separately (need order items)
        const orderWithItems = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        });
        if (orderWithItems) {
          for (const item of orderWithItems.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { totalSold: { increment: item.quantity } },
            });
          }
        }

        // Send escrow released email to seller
        try {
          const seller = await prisma.user.findUnique({ where: { id: order.sellerId }, select: { email: true, name: true } });
          if (seller?.email) {
            await sendEscrowReleasedEmail(
              seller.email,
              seller.name || "Seller",
              { orderNumber: order.orderNumber, sellerPayout: order.sellerPayout || order.totalAmount * 0.95, currency: order.currency }
            );
          }
        } catch (emailErr) {
          console.error("Escrow released email failed:", emailErr);
        }

        break;
      }

      case "dispute": {
        if (order.buyerId !== session.user.id) {
          return NextResponse.json({ error: "Only buyer can open dispute" }, { status: 403 });
        }

        // Open dispute on Vesicash escrow
        if (order.escrowTransactionId) {
          try {
            await vesicashDispute(order.escrowTransactionId, "Buyer initiated dispute via Amana Marketplace");
          } catch (escrowError) {
            console.error("Vesicash dispute creation failed:", escrowError);
          }
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "DISPUTED",
            escrowStatus: "DISPUTED",
            events: {
              create: {
                type: "DISPUTE_OPENED",
                description: "Buyer opened a dispute — escrow funds frozen pending resolution",
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
