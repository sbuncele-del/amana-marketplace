import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — only ADMIN role
  if (pathname.startsWith("/admin") && (req.auth?.user as any)?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Seller dashboard — only SELLER or ADMIN
  if (
    pathname.startsWith("/dashboard") &&
    !["SELLER", "ADMIN"].includes((req.auth?.user as any)?.role || "")
  ) {
    return NextResponse.redirect(new URL("/browse", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/checkout/:path*", "/admin/:path*"],
};
