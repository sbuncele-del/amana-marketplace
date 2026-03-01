import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId: userId, status: { not: "CANCELLED" } },
      select: {
        totalAmount: true,
        currency: true,
        status: true,
        originCountry: true,
        destinationCountry: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            price: true,
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { sellerId: userId },
      select: {
        name: true,
        totalSold: true,
        viewCount: true,
        avgRating: true,
      },
      orderBy: { totalSold: "desc" },
      take: 10,
    }),
  ]);

  // Monthly revenue (last 6 months)
  const now = new Date();
  const months: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = d.toLocaleString("en", { month: "short" });
    const amount = orders
      .filter(
        (o) =>
          o.createdAt >= d &&
          o.createdAt <= monthEnd &&
          ["COMPLETED", "SHIPPED", "BUYER_VERIFYING", "DELIVERED", "ESCROW_HELD"].includes(o.status)
      )
      .reduce((s, o) => s + o.totalAmount, 0);
    months.push({ month: label, amount: Math.round(amount * 100) / 100 });
  }

  // Top products by revenue
  const productRevenue = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const name = item.product.name;
      const existing = productRevenue.get(name) || { revenue: 0, orders: 0 };
      existing.revenue += item.price * item.quantity;
      existing.orders += 1;
      productRevenue.set(name, existing);
    }
  }
  const topProducts = [...productRevenue.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }));

  // Trade corridors
  const corridorMap = new Map<string, { orders: number; revenue: number }>();
  for (const order of orders) {
    if (order.originCountry && order.destinationCountry) {
      const key = `${order.originCountry}→${order.destinationCountry}`;
      const existing = corridorMap.get(key) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.totalAmount;
      corridorMap.set(key, existing);
    }
  }
  const topCorridors = [...corridorMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([key, data]) => {
      const [from, to] = key.split("→");
      return {
        from,
        to,
        orders: data.orders,
        revenue: Math.round(data.revenue * 100) / 100,
      };
    });

  return NextResponse.json({
    monthlyRevenue: months,
    topProducts,
    topCorridors,
    totalViews: products.reduce((s, p) => s + p.viewCount, 0),
  });
}
