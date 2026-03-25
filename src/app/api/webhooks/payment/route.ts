import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/flutterwave";
import { createEscrowTransaction, fundEscrow } from "@/lib/vesicash";
import { sendPaymentReceivedEmail } from "@/lib/email";

// POST /api/webhooks/payment - Flutterwave webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("verif-hash") || "";

    // Verify webhook signature
    if (!verifyWebhookSignature(signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { event, data } = body;

    console.log(`[Flutterwave Webhook] Event: ${event}`, data);

    if (event === "charge.completed" && data.status === "successful") {
      const txRef = data.tx_ref;

      // Extract order number from tx_ref (format: AMN-XXXX_timestamp)
      const orderNumber = txRef.split("_")[0];

      // Idempotency check — skip if this payment was already processed
      const existingEvent = await prisma.orderEvent.findFirst({
        where: {
          type: "PAYMENT_RECEIVED",
          order: { orderNumber },
        },
      });
      if (existingEvent) {
        console.log(`[Flutterwave Webhook] Payment already processed for ${orderNumber}, skipping`);
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findFirst({
        where: { orderNumber },
        include: {
          buyer: { select: { email: true, name: true } },
          seller: { select: { email: true, name: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      });

      if (order) {
        // Update order status — payment received
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "ESCROW_HELD",
            escrowStatus: "FUNDED",
            paymentRef: data.flw_ref || txRef,
            escrowFundedAt: new Date(),
            events: {
              create: {
                type: "PAYMENT_RECEIVED",
                description: `Payment of ${data.currency} ${data.amount} received via ${data.payment_type}. Platform commission: ${data.currency} ${order.platformFee?.toFixed(2) || "0"} (5%). Seller payout: ${data.currency} ${order.sellerPayout?.toFixed(2) || "0"}.`,
              },
            },
          },
        });

        // Send payment confirmation email to buyer
        try {
          await sendPaymentReceivedEmail(
            order.buyer.email || "",
            order.buyer.name || "Customer",
            { orderNumber: order.orderNumber, totalAmount: order.totalAmount, currency: order.currency }
          );
        } catch (emailErr) {
          console.error("Payment confirmation email failed:", emailErr);
        }

        // If no escrow transaction exists yet, create one now
        if (!order.escrowTransactionId) {
          try {
            const productName = order.items[0]?.product?.name || "Product";
            const escrowTx = await createEscrowTransaction({
              orderId: order.orderNumber,
              amount: order.sellerPayout || order.totalAmount * 0.95,
              currency: order.currency,
              buyerEmail: order.buyer.email || "",
              sellerEmail: order.seller.email || "",
              title: `Amana Order ${order.orderNumber}`,
              description: `Order for ${productName} — escrow protected`,
              inspectionPeriodDays: 3,
            });

            await prisma.order.update({
              where: { id: order.id },
              data: {
                escrowTransactionId: escrowTx.transaction_id,
                events: {
                  create: {
                    type: "ESCROW_CREATED",
                    description: `Vesicash escrow created and funded (ID: ${escrowTx.transaction_id})`,
                  },
                },
              },
            });

            // Fund the escrow
            await fundEscrow(escrowTx.transaction_id, data.payment_type || "card");
          } catch (escrowError) {
            console.error("Post-payment escrow creation failed:", escrowError);
          }
        } else {
          // Fund existing escrow
          try {
            await fundEscrow(order.escrowTransactionId, data.payment_type || "card");
          } catch (fundError) {
            console.error("Escrow funding failed:", fundError);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
