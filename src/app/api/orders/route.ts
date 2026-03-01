import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";

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

// POST /api/orders - Create order (buyer)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productSlug, quantity, paymentMethod, shippingAddress } = body;

    if (!productSlug || !quantity || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
      include: { seller: true },
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

    const subtotal = product.price * quantity;
    const escrowFee = subtotal * 0.015;
    const shippingCost = 25; // Estimated
    const totalAmount = subtotal + escrowFee + shippingCost;

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

    const isCrossBorder = product.originCountry !== (shippingAddress?.country || "");

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        buyerId: session.user.id,
        sellerId: product.sellerId,
        subtotal,
        shippingCost,
        totalAmount,
        currency: product.currency,
        status: "PENDING",
        escrowStatus: "PENDING",
        paymentMethod,
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
            description: `Order created for ${quantity}x ${product.name}`,
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

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
