import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://primesources.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Afrishelf — Online Shopping South Africa",
    template: "%s | Afrishelf",
  },
  description:
    "Shop home, kitchen, electronics, beauty, kids and more at Afrishelf. Browse rand prices and request your order with South African delivery.",
  keywords: [
    "online marketplace South Africa",
    "buy online South Africa",
    "African marketplace",
    "shop online Africa",
    "South African online store",
    "electronics South Africa",
    "fashion South Africa",
    "home goods Africa",
    "beauty products South Africa",
    "cross-border shopping Africa",
    "primesources",
    "buy and sell Africa",
    "affordable shopping South Africa",
    "trending products South Africa",
  ],
  authors: [{ name: "Afrishelf", url: siteUrl }],
  creator: "Afrishelf",
  publisher: "Afrishelf",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteUrl,
    siteName: "Afrishelf",
    title: "Afrishelf — Online Shopping South Africa",
    description:
      "Everyday finds for your home and family, with South African delivery.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Afrishelf — Shop South Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Afrishelf — Online Shopping South Africa",
    description:
      "Shop home, kitchen, electronics, beauty, kids and more in South Africa.",
    images: ["/og-image.png"],
    creator: "@primesources",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },

    ],
    apple: "/favicon.svg",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="en-ZA">
      <head>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased font-sans`}>
        <Providers>
          {children}

        </Providers>
        <CookieConsent />
        <Analytics />

      </body>
    </html>
  );
}
