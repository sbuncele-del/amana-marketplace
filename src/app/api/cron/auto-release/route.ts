import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseEscrow } from "@/lib/vesicash";
import { sendEscrowReleasedEmail } from "@/lib/email";

// POST /api/cron/auto-release — Auto-release escrow after 72hr buyer inspection window
// Call this via cron every hour: curl -X POST https://yourdomain.com/api/cron/auto-release -H "Authorization: Bearer YOUR_CRON_SECRET"
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET || "";
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all delivered orders past their verify deadline that haven't been approved or disputed
    const now = new Date();
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        verifyDeadline: { lt: now },
        buyerApprovedAt: null,
      },
      include: {
        seller: { select: { id: true, email: true, name: true } },
        buyer: { select: { id: true, email: true, name: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    const results: { orderNumber: string; status: string }[] = [];

    for (const order of expiredOrders) {
      try {
        // Release escrow via Vesicash
        if (order.escrowTransactionId) {
          try {
            await releaseEscrow(order.escrowTransactionId);
          } catch (escrowErr) {
            console.error(`Escrow release failed for ${order.orderNumber}:`, escrowErr);
          }
        }

        // Update order status
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: {
              status: "COMPLETED",
              escrowStatus: "RELEASED",
              escrowReleasedAt: now,
              buyerApprovedAt: now,
              events: {
                create: {
                  type: "AUTO_RELEASED",
                  description: `Escrow auto-released — 72hr inspection window expired. ${order.currency} ${(order.sellerPayout || order.totalAmount * 0.95).toFixed(2)} released to seller.`,
                },
              },
            },
          }),
          prisma.sellerProfile.updateMany({
            where: { userId: order.sellerId },
            data: {
              totalSales: { increment: 1 },
              totalRevenue: { increment: order.sellerPayout || order.totalAmount * 0.95 },
            },
          }),
        ]);

        // Update product sold counts
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { totalSold: { increment: item.quantity } },
          });
        }

        // Notify seller about payout
        try {
          await sendEscrowReleasedEmail(
            order.seller.email || "",
            order.seller.name || "Seller",
            { orderNumber: order.orderNumber, sellerPayout: order.sellerPayout || order.totalAmount * 0.95, currency: order.currency }
          );
        } catch (emailErr) {
          console.error(`Auto-release email failed for ${order.orderNumber}:`, emailErr);
        }

        results.push({ orderNumber: order.orderNumber, status: "released" });
      } catch (orderErr) {
        console.error(`Auto-release failed for ${order.orderNumber}:`, orderErr);
        results.push({ orderNumber: order.orderNumber, status: "failed" });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Auto-release cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
