import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/flutterwave";

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

      const order = await prisma.order.findFirst({
        where: { orderNumber },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "ESCROW_HELD",
            escrowStatus: "FUNDED",
            events: {
              create: {
                type: "PAYMENT_RECEIVED",
                description: `Payment of ${data.currency} ${data.amount} received via ${data.payment_type}`,
              },
            },
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Payment webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
