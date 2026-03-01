import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Amana — Africa's Trusted Cross-Border Marketplace",
  description:
    "Trade across Africa with built-in escrow protection. Buy and sell with confidence using M-Pesa, MTN MoMo, and 15+ payment methods across 34 African countries.",
  keywords: [
    "African marketplace",
    "cross-border trade",
    "escrow",
    "M-Pesa",
    "AfCFTA",
    "African e-commerce",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased font-sans`}>
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
