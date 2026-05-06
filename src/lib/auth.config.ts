import type { NextAuthConfig } from "next-auth";

// Lightweight config for middleware (Edge-compatible — no bcrypt, no Prisma)
export const authConfig: NextAuthConfig = {
  providers: [], // Credentials provider is added only in auth.ts (Node.js runtime)
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const protectedRoutes = ["/dashboard", "/checkout", "/admin"];
      const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.country = (user as any).country;
        token.sellerId = (user as any).sellerId;
        token.storeName = (user as any).storeName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).country = token.country;
        (session.user as any).sellerId = token.sellerId;
        (session.user as any).storeName = token.storeName;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
};
