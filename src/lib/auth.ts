import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {verifyCode} from "@/lib/access/store";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: {label:"Code",type:"text"},challenge:{label:"Challenge",type:"text"},
      },
      async authorize(credentials) {
        if(!credentials?.email)return null;
        let verified=false;
        if(credentials.code&&credentials.challenge){if(process.env.VERCEL_ENV==='preview')return null;verified=!!(await verifyCode(String(credentials.email),String(credentials.challenge),String(credentials.code)));if(!verified)return null;}
        else if(!credentials.password)return null;

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email).trim().toLowerCase() },
          include: { sellerProfile: true },
        });

        if (!user || !user.isActive) return null;

        const isValid = verified || await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          country: user.country,
          sellerId: user.sellerProfile?.id || null,
          storeName: user.sellerProfile?.storeName || null,
        };
      },
    }),
  ],
});
