import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { initializePayment } from "@/lib/flutterwave";
import { createEscrowTransaction } from "@/lib/vesicash";
import { sendOrderConfirmationEmail, sendNewOrderToSellerEmail } from "@/lib/email";

const PLATFORM_COMMISSION_RATE = 0.05; // 5% Amana commission
const ESCROW_FEE_RATE = 0.015; // 1.5% Vesicash fee

// Shipping cost calculation
const shippingRates: Record<string, { domestic: number; crossBorder: number }> = {
  dhl_express: { domestic: 15, crossBorder: 35 },
  dhl_ecommerce: { domestic: 10, crossBorder: 25 },
  aramex: { domestic: 12, crossBorder: 30 },
  sendy: { domestic: 8, crossBorder: 0 },
  self_ship: { domestic: 0, crossBorder: 0 },
};

function calculateShipping(method: string, isCrossBorder: boolean): number {
  const rate = shippingRates[method] || shippingRates.dhl_ecommerce;
  if (method === "self_ship") return 0;
  return isCrossBorder ? rate.crossBorder : rate.domestic;
}

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

// POST /api/orders - Create order + initiate payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productSlug, quantity, paymentMethod, shippingMethod, shippingAddress } = body;

    if (!productSlug || !quantity || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch product with seller info
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
      include: {
        seller: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    if (product.sellerId === session.user.id) {
      return NextResponse.json({ error: "Cannot buy your own product" }, { status: 400 });
    }

    // Calculate all fees
    const subtotal = product.price * quantity;
    const platformFee = Math.round(subtotal * PLATFORM_COMMISSION_RATE * 100) / 100;
    const escrowFee = Math.round(subtotal * ESCROW_FEE_RATE * 100) / 100;
    const isCrossBorder = product.originCountry !== (shippingAddress?.country || "");
    const shippingCost = calculateShipping(shippingMethod || "dhl_ecommerce", isCrossBorder);
    const totalAmount = subtotal + escrowFee + shippingCost; // Buyer pays subtotal + escrow fee + shipping
    const sellerPayout = subtotal - platformFee; // Seller gets subtotal minus platform commission

    // Create or find shipping address
    let address = null;
    if (shippingAddress) {
      address = await prisma.address.create({
        data: {
          userId: session.user.id,
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone || "",
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state || "",
          zip: shippingAddress.zip || "",
          country: shippingAddress.country,
        },
      });
    }

    const orderNumber = generateOrderNumber();

    // Create order with commission tracking
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId: session.user.id,
        sellerId: product.sellerId,
        subtotal,
        shippingCost,
        escrowFee,
        platformFee,
        commissionRate: PLATFORM_COMMISSION_RATE,
        sellerPayout,
        totalAmount,
        currency: product.currency,
        status: "PENDING",
        escrowStatus: "PENDING",
        paymentMethod,
        shippingMethod: shippingMethod || "dhl_ecommerce",
        originCountry: product.originCountry,
        destinationCountry: shippingAddress?.country || "",
        isCrossBorder,
        shippingAddressId: address?.id,
        items: {
          create: {
            productId: product.id,
            quantity,
            price: product.price,
          },
        },
        events: {
          create: {
            type: "ORDER_CREATED",
            description: `Order created for ${quantity}x ${product.name} | Platform fee: ${PLATFORM_COMMISSION_RATE * 100}% ($${platformFee}) | Seller payout: $${sellerPayout}`,
          },
        },
      },
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
      },
    });

    // Reduce stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: quantity } },
    });

    // --- PAYMENT INTEGRATION ---
    // Step 1: Create Vesicash escrow transaction
    let escrowTransactionId: string | null = null;
    try {
      const escrowTx = await createEscrowTransaction({
        orderId: order.orderNumber,
        amount: sellerPayout, // Escrow holds the seller payout amount
        currency: product.currency,
        buyerEmail: session.user.email || "",
        sellerEmail: product.seller.email,
        title: `Amana Order ${order.orderNumber}`,
        description: `${quantity}x ${product.name} — escrow protected purchase`,
        inspectionPeriodDays: 3,
      });

      escrowTransactionId = escrowTx.transaction_id;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          escrowTransactionId,
          escrowStatus: "NOT_FUNDED",
          events: {
            create: {
              type: "ESCROW_CREATED",
              description: `Vesicash escrow created (ID: ${escrowTransactionId})`,
            },
          },
        },
      });
    } catch (escrowError) {
      console.error("Vesicash escrow creation failed:", escrowError);
      // Continue with order — escrow will be funded after payment
      await prisma.order.update({
        where: { id: order.id },
        data: {
          events: {
            create: {
              type: "ESCROW_PENDING",
              description: "Escrow creation deferred — will be set up after payment confirmation",
            },
          },
        },
      });
    }

    // Step 2: Initialize Flutterwave payment
    let paymentLink: string | null = null;
    try {
      const txRef = `${order.orderNumber}_${Date.now()}`;

      const paymentData = await initializePayment({
        orderId: txRef,
        amount: totalAmount,
        currency: product.currency,
        customerEmail: session.user.email || "",
        customerName: session.user.name || "",
        paymentMethod: paymentMethod === "mpesa" ? "mobilemoney" :
                       paymentMethod === "momo" ? "mobilemoney" :
                       paymentMethod === "bank" ? "bank_transfer" : "card",
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${order.orderNumber}?payment=complete`,
      });

      paymentLink = paymentData?.link || null;

      if (paymentLink) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentRef: txRef,
            paymentLink,
            events: {
              create: {
                type: "PAYMENT_INITIATED",
                description: `Flutterwave payment initiated — ${formatPaymentMethod(paymentMethod)}`,
              },
            },
          },
        });
      }
    } catch (paymentError) {
      console.error("Flutterwave payment initiation failed:", paymentError);
      // Order still created — user can retry payment
      await prisma.order.update({
        where: { id: order.id },
        data: {
          events: {
            create: {
              type: "PAYMENT_PENDING",
              description: "Payment initiation deferred — retry from order page",
            },
          },
        },
      });
    }

    // --- SEND EMAILS ---
    try {
      await sendOrderConfirmationEmail(
        session.user.email || "",
        session.user.name || "Customer",
        {
          orderNumber: order.orderNumber,
          totalAmount,
          currency: product.currency,
          platformFee,
          escrowFee,
          shippingCost,
          productName: product.name,
          quantity,
          paymentLink,
        }
      );
    } catch (emailErr) {
      console.error("Buyer order email failed:", emailErr);
    }

    try {
      await sendNewOrderToSellerEmail(
        product.seller.email,
        product.seller.name,
        {
          orderNumber: order.orderNumber,
          productName: product.name,
          quantity,
          sellerPayout,
          currency: product.currency,
        }
      );
    } catch (emailErr) {
      console.error("Seller order email failed:", emailErr);
    }

    return NextResponse.json({
      order,
      paymentLink,
      escrowTransactionId,
    }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    card: "Card Payment",
    mpesa: "M-Pesa",
    momo: "MTN Mobile Money",
    bank: "Bank Transfer",
  };
  return labels[method] || method;
}
