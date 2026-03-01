import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  // Sellers get seller dashboard stats
  if (userRole === "SELLER") {
    const [
      profile,
      activeProducts,
      totalProducts,
      orders,
      recentOrders,
    ] = await Promise.all([
      prisma.sellerProfile.findUnique({ where: { userId } }),
      prisma.product.count({ where: { sellerId: userId, isActive: true, isApproved: true } }),
      prisma.product.count({ where: { sellerId: userId } }),
      prisma.order.findMany({
        where: { sellerId: userId },
        select: {
          status: true,
          escrowStatus: true,
          totalAmount: true,
          currency: true,
        },
      }),
      prisma.order.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          buyer: { select: { name: true, country: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    // Compute pipeline
    const pipeline = {
      awaitingPayment: orders.filter((o) => o.status === "PENDING").length,
      awaitingPaymentAmount: orders.filter((o) => o.status === "PENDING").reduce((s, o) => s + o.totalAmount, 0),
      inEscrow: orders.filter((o) => o.escrowStatus === "FUNDED" && !["COMPLETED", "REFUNDED", "CANCELLED"].includes(o.status)).length,
      inEscrowAmount: orders.filter((o) => o.escrowStatus === "FUNDED" && !["COMPLETED", "REFUNDED", "CANCELLED"].includes(o.status)).reduce((s, o) => s + o.totalAmount, 0),
      buyerVerifying: orders.filter((o) => o.status === "BUYER_VERIFYING").length,
      buyerVerifyingAmount: orders.filter((o) => o.status === "BUYER_VERIFYING").reduce((s, o) => s + o.totalAmount, 0),
      readyToRelease: orders.filter((o) => o.escrowStatus === "RELEASE_PENDING").length,
      readyToReleaseAmount: orders.filter((o) => o.escrowStatus === "RELEASE_PENDING").reduce((s, o) => s + o.totalAmount, 0),
    };

    const openOrders = orders.filter(
      (o) => !["COMPLETED", "REFUNDED", "CANCELLED"].includes(o.status)
    ).length;

    return NextResponse.json({
      stats: {
        totalRevenue: profile?.totalRevenue ?? 0,
        activeProducts,
        totalProducts,
        openOrders,
        trustScore: profile?.trustScore ?? 0,
        avgRating: profile?.avgRating ?? 0,
        totalSales: profile?.totalSales ?? 0,
      },
      pipeline,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        product: o.items[0]?.product.name ?? "—",
        buyer: o.buyer.name,
        buyerCountry: o.buyer.country,
        amount: o.totalAmount,
        currency: o.currency,
        status: o.status,
        date: o.createdAt,
      })),
    });
  }

  // Buyers get buyer dashboard (order history)
  const [buyerOrders, orderCount] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        seller: {
          select: {
            name: true,
            sellerProfile: { select: { storeName: true } },
          },
        },
        items: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
      },
    }),
    prisma.order.count({ where: { buyerId: userId } }),
  ]);

  return NextResponse.json({
    stats: { totalOrders: orderCount },
    recentOrders: buyerOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      store: o.seller.sellerProfile?.storeName ?? o.seller.name,
      product: o.items[0]?.product.name ?? "—",
      productImage: o.items[0]?.product.images[0] ?? null,
      amount: o.totalAmount,
      currency: o.currency,
      status: o.status,
      escrowStatus: o.escrowStatus,
      date: o.createdAt,
    })),
  });
}
