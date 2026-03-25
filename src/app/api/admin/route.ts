import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin — Admin dashboard data
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Stats — parallel queries
    const [
      totalUsers,
      newUsersThisMonth,
      totalProducts,
      newProductsThisMonth,
      totalOrders,
      orderGMV,
      openDisputes,
      recentUsers,
      recentDisputes,
      tradeCorridor,
      escrowStats,
      platformRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "SELLER_RESPONDED", "UNDER_REVIEW"] } } }),
      // Recent users
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, name: true, email: true, country: true, role: true, isActive: true,
          createdAt: true, image: true,
          _count: { select: { buyerOrders: true, products: true } },
        },
      }),
      // Open disputes
      prisma.dispute.findMany({
        where: { status: { in: ["OPEN", "SELLER_RESPONDED", "UNDER_REVIEW", "ESCALATED"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          order: {
            select: {
              orderNumber: true, totalAmount: true, currency: true,
              buyer: { select: { name: true } },
              seller: { select: { name: true, sellerProfile: { select: { storeName: true } } } },
            },
          },
        },
      }),
      // Trade corridors
      prisma.order.groupBy({
        by: ["originCountry", "destinationCountry"],
        where: { status: { in: ["COMPLETED", "ESCROW_HELD", "SHIPPED", "DELIVERED"] }, isCrossBorder: true },
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // Escrow stats
      prisma.order.groupBy({
        by: ["escrowStatus"],
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      // Platform revenue (total commission collected)
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { platformFee: true, totalAmount: true },
        _count: { id: true },
      }),
    ]);

    // Compute platform health metrics
    const completedOrders = await prisma.order.count({ where: { status: "COMPLETED" } });
    const disputedOrders = await prisma.dispute.count();
    const resolutionRate = completedOrders > 0 ? ((completedOrders / (completedOrders + disputedOrders)) * 100).toFixed(1) : "0";
    const verifiedSellers = await prisma.sellerProfile.count({ where: { isVerified: true } });
    const totalSellers = await prisma.sellerProfile.count();
    const verificationRate = totalSellers > 0 ? ((verifiedSellers / totalSellers) * 100).toFixed(0) : "0";

    // Repeat buyers
    const repeatBuyers = await prisma.user.count({
      where: {
        role: "BUYER",
        buyerOrders: { some: { status: "COMPLETED" } },
      },
    });
    const totalBuyers = await prisma.user.count({ where: { role: "BUYER" } });
    const repeatRate = totalBuyers > 0 ? ((repeatBuyers / totalBuyers) * 100).toFixed(0) : "0";

    // Products pending approval
    const pendingApproval = await prisma.product.count({ where: { isApproved: false, isActive: true } });

    return NextResponse.json({
      stats: {
        totalUsers,
        newUsersThisMonth,
        totalProducts,
        newProductsThisMonth,
        totalOrders,
        gmv: orderGMV._sum.totalAmount || 0,
        openDisputes,
        pendingApproval,
      },
      platformHealth: {
        escrowResolutionRate: `${resolutionRate}%`,
        sellerVerificationRate: `${verificationRate}%`,
        repeatBuyerRate: `${repeatRate}%`,
      },
      platformRevenue: {
        totalCommission: platformRevenue._sum.platformFee || 0,
        completedGMV: platformRevenue._sum.totalAmount || 0,
        completedOrders: platformRevenue._count.id || 0,
      },
      recentUsers,
      disputes: recentDisputes,
      corridors: tradeCorridor.map(c => ({
        origin: c.originCountry || "Unknown",
        destination: c.destinationCountry || "Unknown",
        orders: c._count.id,
        gmv: c._sum.totalAmount || 0,
      })),
      escrowBreakdown: escrowStats.map(e => ({
        status: e.escrowStatus,
        count: e._count.id,
        amount: e._sum.totalAmount || 0,
      })),
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
