import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { releaseEscrow, refundEscrow } from "@/lib/vesicash";

// POST /api/admin/actions — Admin actions (approve, suspend, resolve, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { action, targetId, data } = await request.json();

    switch (action) {
      // ─── Product Actions ─────────────────────────────────────
      case "approve_product": {
        await prisma.product.update({
          where: { id: targetId },
          data: { isApproved: true },
        });
        return NextResponse.json({ success: true, message: "Product approved" });
      }

      case "reject_product": {
        await prisma.product.update({
          where: { id: targetId },
          data: { isApproved: false, isActive: false },
        });
        return NextResponse.json({ success: true, message: "Product rejected" });
      }

      case "feature_product": {
        await prisma.product.update({
          where: { id: targetId },
          data: { isFeatured: data?.featured !== false },
        });
        return NextResponse.json({ success: true, message: "Product featured status updated" });
      }

      // ─── User Actions ────────────────────────────────────────
      case "suspend_user": {
        await prisma.user.update({
          where: { id: targetId },
          data: { isActive: false },
        });
        return NextResponse.json({ success: true, message: "User suspended" });
      }

      case "activate_user": {
        await prisma.user.update({
          where: { id: targetId },
          data: { isActive: true },
        });
        return NextResponse.json({ success: true, message: "User activated" });
      }

      case "verify_seller": {
        await prisma.sellerProfile.updateMany({
          where: { userId: targetId },
          data: { isVerified: true, verification: "VERIFIED" },
        });
        return NextResponse.json({ success: true, message: "Seller verified" });
      }

      case "reject_seller": {
        await prisma.sellerProfile.updateMany({
          where: { userId: targetId },
          data: { isVerified: false, verification: "REJECTED" },
        });
        return NextResponse.json({ success: true, message: "Seller verification rejected" });
      }

      // ─── Dispute Actions ─────────────────────────────────────
      case "resolve_dispute_buyer": {
        const dispute = await prisma.dispute.findUnique({
          where: { id: targetId },
          include: { order: true },
        });
        if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

        // Refund buyer via Vesicash
        if (dispute.order.escrowTransactionId) {
          try { await refundEscrow(dispute.order.escrowTransactionId); } catch (e) { console.error("Refund failed:", e); }
        }

        await prisma.$transaction([
          prisma.dispute.update({
            where: { id: targetId },
            data: { status: "RESOLVED_BUYER", resolution: data?.resolution || "Resolved in favor of buyer", resolvedAt: new Date() },
          }),
          prisma.order.update({
            where: { id: dispute.orderId },
            data: {
              status: "REFUNDED",
              escrowStatus: "REFUNDED",
              events: { create: { type: "DISPUTE_RESOLVED", description: `Dispute resolved in buyer's favor. Escrow refunded.` } },
            },
          }),
        ]);
        return NextResponse.json({ success: true, message: "Dispute resolved — buyer refunded" });
      }

      case "resolve_dispute_seller": {
        const dispute = await prisma.dispute.findUnique({
          where: { id: targetId },
          include: { order: true },
        });
        if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

        // Release to seller via Vesicash
        if (dispute.order.escrowTransactionId) {
          try { await releaseEscrow(dispute.order.escrowTransactionId); } catch (e) { console.error("Release failed:", e); }
        }

        await prisma.$transaction([
          prisma.dispute.update({
            where: { id: targetId },
            data: { status: "RESOLVED_SELLER", resolution: data?.resolution || "Resolved in favor of seller", resolvedAt: new Date() },
          }),
          prisma.order.update({
            where: { id: dispute.orderId },
            data: {
              status: "COMPLETED",
              escrowStatus: "RELEASED",
              escrowReleasedAt: new Date(),
              events: { create: { type: "DISPUTE_RESOLVED", description: `Dispute resolved in seller's favor. Escrow released.` } },
            },
          }),
        ]);
        return NextResponse.json({ success: true, message: "Dispute resolved — seller paid" });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
