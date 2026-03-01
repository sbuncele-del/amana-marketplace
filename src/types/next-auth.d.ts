import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    country?: string | null;
    sellerId?: string | null;
    storeName?: string | null;
  }

  interface Session {
    user: User & {
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string;
      country?: string | null;
      sellerId?: string | null;
      storeName?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    country?: string | null;
    sellerId?: string | null;
    storeName?: string | null;
  }
}
