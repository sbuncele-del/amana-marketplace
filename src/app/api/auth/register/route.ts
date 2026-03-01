import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, country, role, storeName, phone } = validated.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (and seller profile if SELLER)
    const user = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        country,
        phone: phone || null,
        role: role as "BUYER" | "SELLER",
        ...(role === "SELLER" && storeName
          ? {
              sellerProfile: {
                create: {
                  storeName,
                  storeDescription: "",
                  storeSlug: storeName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, ""),
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        country: true,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
