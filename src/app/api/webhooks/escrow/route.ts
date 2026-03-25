import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifyVesicashSignature(payload: string, signature: string): boolean {
  const secret = process.env.VESICASH_PRIVATE_KEY || "";
  if (!secret || !signature) return false;
  const computed = crypto.createHmac("sha512", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

// POST /api/webhooks/escrow - Vesicash webhook handler
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-vesicash-signature") || request.headers.get("x-webhook-signature") || "";

    // Verify webhook signature in production
    if (process.env.NODE_ENV === "production" && !verifyVesicashSignature(rawBody, signature)) {
      console.error("[Vesicash Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
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
