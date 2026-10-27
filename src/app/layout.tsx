import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";
import {ConsentAnalytics} from '@/components/consent-analytics';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
});

import {siteUrl, jsonLd, socialLinks} from '@/lib/site';

export const viewport: Viewport = {width:"device-width", initialScale:1, themeColor:"#DA292B", viewportFit:"cover"};

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable:true, title:"Plentovo", statusBarStyle:"default"},
  metadataBase: new URL(siteUrl),
  title: {
    default: "Plentovo — Online Shopping South Africa",
    template: "%s | Plentovo",
  },
  description:
    "Shop home, kitchen, electronics, beauty, kids and more at Plentovo. Discover everyday choice and value, with South African delivery.",
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
    "buy and sell Africa",
    "affordable shopping South Africa",
    "trending products South Africa",
  ],
  authors: [{ name: "Plentovo", url: siteUrl }],
  creator: "Plentovo",
  publisher: "Plentovo",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteUrl,
    siteName: "Plentovo",
    title: "Plentovo — Online Shopping South Africa",
    description:
      "Everyday finds for your home and family, with South African delivery.",
    images: [
      {
        url: "/brand/plentovo-social.jpg",
        width: 1536,
        height: 1024,
        alt: "Plentovo — Shop South Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plentovo — Online Shopping South Africa",
    description:
      "Shop home, kitchen, electronics, beauty, kids and more in South Africa.",
    images: ["/brand/plentovo-social.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/brand/plentovo-icon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },

    ],
    apple: "/apple-touch-icon.png",
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({
          '@context':'https://schema.org', '@graph':[
            {'@type':'Organization','@id':siteUrl+'/#organization',name:'Plentovo',legalName:'Masaphokati Global Shelf (Pty) Ltd',identifier:'2026/850096/07',telephone:'+27 74 012 6873',email:'hello@plentovo.com',url:siteUrl,sameAs:socialLinks.map(s=>s.href),address:{'@type':'PostalAddress',streetAddress:'26 Lemonwood Street, Eco-Park Estate',addressLocality:'Centurion',addressRegion:'Gauteng',postalCode:'0157',addressCountry:'ZA'},logo:siteUrl+'/brand/plentovo-icon.png'},
            {'@type':'WebSite','@id':siteUrl+'/#website',name:'Plentovo',url:siteUrl,inLanguage:'en-ZA',publisher:{'@id':siteUrl+'/#organization'}}
          ]
        })}} />

      </head>
      <body className={`${inter.variable} ${playfair.variable} antialiased font-sans`}>
        <Providers>
          {children}

        </Providers>
        <CookieConsent />
        <ConsentAnalytics measurementId={gaId} />

      </body>
    </html>
  );
}
