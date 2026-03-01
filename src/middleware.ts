import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protected routes
  const protectedRoutes = ["/dashboard", "/checkout", "/admin"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — only ADMIN role
  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Seller dashboard — only SELLER or ADMIN
  if (pathname.startsWith("/dashboard") && !["SELLER", "ADMIN"].includes(req.auth?.user?.role || "")) {
    return NextResponse.redirect(new URL("/browse", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/checkout/:path*", "/admin/:path*"],
};
