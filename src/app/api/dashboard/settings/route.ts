import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { sellerProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    country: user.country,
    city: user.city,
    store: user.sellerProfile
      ? {
          storeName: user.sellerProfile.storeName,
          storeSlug: user.sellerProfile.storeSlug,
          storeDescription: user.sellerProfile.storeDescription,
          verification: user.sellerProfile.verification,
          isVerified: user.sellerProfile.isVerified,
          bankName: user.sellerProfile.bankName,
          bankAccountNum: user.sellerProfile.bankAccountNum,
          bankCountry: user.sellerProfile.bankCountry,
          mobileMoneyNum: user.sellerProfile.mobileMoneyNum,
          mobileMoneyProvider: user.sellerProfile.mobileMoneyProvider,
        }
      : null,
    emailVerified: user.emailVerified,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Update user fields
  const userUpdate: Record<string, unknown> = {};
  if (body.firstName) userUpdate.firstName = body.firstName;
  if (body.lastName) userUpdate.lastName = body.lastName;
  if (body.firstName || body.lastName) {
    userUpdate.name = `${body.firstName ?? ""} ${body.lastName ?? ""}`.trim();
  }
  if (body.phone !== undefined) userUpdate.phone = body.phone;
  if (body.city !== undefined) userUpdate.city = body.city;

  await prisma.user.update({
    where: { id: session.user.id },
    data: userUpdate,
  });

  // Update seller profile if applicable
  if (body.store) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      const storeUpdate: Record<string, unknown> = {};
      if (body.store.storeName) storeUpdate.storeName = body.store.storeName;
      if (body.store.storeDescription !== undefined)
        storeUpdate.storeDescription = body.store.storeDescription;
      if (body.store.bankName !== undefined)
        storeUpdate.bankName = body.store.bankName;
      if (body.store.bankAccountNum !== undefined)
        storeUpdate.bankAccountNum = body.store.bankAccountNum;
      if (body.store.bankCountry !== undefined)
        storeUpdate.bankCountry = body.store.bankCountry;
      if (body.store.mobileMoneyNum !== undefined)
        storeUpdate.mobileMoneyNum = body.store.mobileMoneyNum;
      if (body.store.mobileMoneyProvider !== undefined)
        storeUpdate.mobileMoneyProvider = body.store.mobileMoneyProvider;

      await prisma.sellerProfile.update({
        where: { userId: session.user.id },
        data: storeUpdate,
      });
    }
  }

  return NextResponse.json({ success: true });
}
