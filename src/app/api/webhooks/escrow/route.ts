import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/webhooks/escrow - Vesicash webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { event, data } = body;

    console.log(`[Vesicash Webhook] Event: ${event}`, data);

    switch (event) {
      case "transaction.funded": {
        if (data?.transaction_id) {
          const order = await prisma.order.findFirst({
            where: { escrowTransactionId: data.transaction_id },
          });
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "ESCROW_HELD",
                escrowStatus: "FUNDED",
                escrowFundedAt: new Date(),
                events: {
                  create: {
                    type: "ESCROW_FUNDED",
                    description: "Payment received and held in escrow. Seller notified to ship.",
                  },
                },
              },
            });
          }
        }
        break;
      }

      case "transaction.released": {
        if (data?.transaction_id) {
          const order = await prisma.order.findFirst({
            where: { escrowTransactionId: data.transaction_id },
          });
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "COMPLETED",
                escrowStatus: "RELEASED",
                escrowReleasedAt: new Date(),
                events: {
                  create: {
                    type: "ESCROW_RELEASED",
                    description: "Escrow funds released to seller.",
                  },
                },
              },
            });
          }
        }
        break;
      }

      case "transaction.refunded": {
        if (data?.transaction_id) {
          const order = await prisma.order.findFirst({
            where: { escrowTransactionId: data.transaction_id },
          });
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "REFUNDED",
                escrowStatus: "REFUNDED",
                events: {
                  create: {
                    type: "ESCROW_REFUNDED",
                    description: "Escrow funds refunded to buyer.",
                  },
                },
              },
            });
          }
        }
        break;
      }

      case "transaction.disputed": {
        if (data?.transaction_id) {
          const order = await prisma.order.findFirst({
            where: { escrowTransactionId: data.transaction_id },
          });
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: "DISPUTED",
                escrowStatus: "DISPUTED",
                events: {
                  create: {
                    type: "DISPUTE_OPENED",
                    description: "Escrow dispute opened via Vesicash.",
                  },
                },
              },
            });
          }
        }
        break;
      }

      default:
        console.log(`[Vesicash Webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
