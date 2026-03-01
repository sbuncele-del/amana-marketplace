import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/products - List products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const country = searchParams.get("country") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "0");
    const sort = searchParams.get("sort") || "newest";
    const mine = searchParams.get("mine") === "true";

    const where: Record<string, unknown> = {};

    // If seller wants their own products, filter by sellerId and show all statuses
    if (mine) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      where.sellerId = session.user.id;
    } else {
      // Public listing: only show active products
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (country) {
      where.originCountry = country;
    }

    if (minPrice > 0) {
      where.price = { ...(where.price as object || {}), gte: minPrice };
    }

    if (maxPrice > 0) {
      where.price = { ...(where.price as object || {}), lte: maxPrice };
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case "price-low":
        orderBy.price = "asc";
        break;
      case "price-high":
        orderBy.price = "desc";
        break;
      case "popular":
        orderBy.viewCount = "desc";
        break;
      default:
        orderBy.createdAt = "desc";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              country: true,
              image: true,
              sellerProfile: {
                select: {
                  storeName: true,
                  storeSlug: true,
                  trustScore: true,
                  isVerified: true,
                  avgRating: true,
                },
              },
            },
          },
          category: {
            select: { name: true, slug: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a product (sellers only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SELLER") {
      return NextResponse.json(
        { error: "Only sellers can create products" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      currency,
      categoryId,
      images,
      originCountry,
      shipsTo,
      weight,
      tags,
      hsCode,
      moq,
      stock,
    } = body;

    if (!name || !description || !price || !categoryId) {
      return NextResponse.json(
        { error: "Name, description, price, and category are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        currency: currency || "USD",
        images: images || [],
        originCountry: originCountry || session.user.country || "",
        shipsTo: shipsTo || [],
        weight: weight || null,
        tags: tags || [],
        hsCode: hsCode || null,
        moq: moq || 1,
        stock: stock || 0,
        sellerId: session.user.id,
        categoryId,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
