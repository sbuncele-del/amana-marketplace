import { NextRequest, NextResponse } from "next/server";
import { createCart, addToCart, updateCartLine, removeCartLines, getCart } from "@/lib/shopify";

// POST /api/shopify/cart — create a cart or buy-now (returns checkoutUrl)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchandiseId, quantity = 1, cartId, action } = body;

    if (!merchandiseId && action !== "add") {
      return NextResponse.json({ error: "merchandiseId is required" }, { status: 400 });
    }

    const lines = [{ merchandiseId, quantity: Math.max(1, quantity) }];

    let cart;
    if (cartId) {
      cart = await addToCart(cartId, lines);
    } else {
      cart = await createCart(lines);
    }

    return NextResponse.json({
      cartId: cart.id,
      checkoutUrl: cart.checkoutUrl,
      lines: cart.lines,
      totalAmount: cart.totalAmount,
      subtotalAmount: cart.subtotalAmount,
    });
  } catch (error) {
    console.error("[Shopify Cart POST]", error);
    return NextResponse.json({ error: "Failed to create cart" }, { status: 500 });
  }
}

// GET /api/shopify/cart?cartId=... — retrieve cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get("cartId");

    if (!cartId) {
      return NextResponse.json({ error: "cartId is required" }, { status: 400 });
    }

    const cart = await getCart(cartId);
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    return NextResponse.json({
      cartId: cart.id,
      checkoutUrl: cart.checkoutUrl,
      lines: cart.lines,
      totalAmount: cart.totalAmount,
      subtotalAmount: cart.subtotalAmount,
    });
  } catch (error) {
    console.error("[Shopify Cart GET]", error);
    return NextResponse.json({ error: "Failed to get cart" }, { status: 500 });
  }
}

// PATCH /api/shopify/cart — update or remove a line
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, lineId, quantity, removeLineIds } = body;

    if (!cartId) {
      return NextResponse.json({ error: "cartId is required" }, { status: 400 });
    }

    let cart;
    if (removeLineIds?.length) {
      cart = await removeCartLines(cartId, removeLineIds);
    } else if (lineId !== undefined && quantity !== undefined) {
      cart = await updateCartLine(cartId, lineId, quantity);
    } else {
      return NextResponse.json({ error: "Provide lineId+quantity or removeLineIds" }, { status: 400 });
    }

    return NextResponse.json({
      cartId: cart.id,
      checkoutUrl: cart.checkoutUrl,
      lines: cart.lines,
      totalAmount: cart.totalAmount,
      subtotalAmount: cart.subtotalAmount,
    });
  } catch (error) {
    console.error("[Shopify Cart PATCH]", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
