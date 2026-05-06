import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/cookie-consent";
import { EmailCapturePopup } from "@/components/email-capture-popup";
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
    default: "Prime Sources — Africa's Growing Online Marketplace | Buy & Sell Across Africa",
    template: "%s | Prime Sources Marketplace",
  },
  description:
    "Shop electronics, fashion, home goods, beauty & more from verified African sellers. Fast shipping, secure payments via PayFast, EFT & card. Best prices guaranteed on primesources.online.",
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
  authors: [{ name: "Prime Sources", url: siteUrl }],
  creator: "Prime Sources",
  publisher: "Prime Sources",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: siteUrl,
    siteName: "Prime Sources Marketplace",
    title: "Prime Sources — Africa's Growing Online Marketplace",
    description:
      "Shop electronics, fashion, home goods, beauty & more from verified African sellers. Secure payments, fast shipping across Africa.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prime Sources Marketplace — Shop Across Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Sources — Africa's Growing Online Marketplace",
    description:
      "Shop electronics, fashion, home goods & more. Secure payments, fast shipping across Africa.",
    images: ["/og-image.png"],
    creator: "@primesources",
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "", // Add your Google Search Console verification code here
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="en">
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
          <EmailCapturePopup />
        </Providers>
        <CookieConsent />
        <Analytics />
        {/* WhatsApp chat widget */}
        <Script id="whatsapp-widget" strategy="lazyOnload">
          {`
            var url = 'https://wati-integration-prod-service.clare.ai/v2/watiWidget.js?161000';
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = url;
            var options = {
              enabled: true,
              chatButtonSetting: {
                backgroundColor: '#25D366',
                ctaText: 'Chat with us',
                borderRadius: '25',
                marginLeft: '0',
                marginRight: '20',
                marginBottom: '20',
                ctaIconWATI: false,
                position: 'right'
              },
              brandSetting: {
                brandName: 'Prime Sources',
                brandSubTitle: 'Typically replies within minutes',
                brandImg: '/favicon.ico',
                welcomeText: 'Hi! Need help with your order or product info? Chat with us 👋',
                messageText: '',
                backgroundColor: '#1A1A2E',
                ctaText: 'Start Chat',
                borderRadius: '25',
                autoShow: false,
                phoneNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
              }
            };
            s.onload = function() { CreateWhatsappChatWidget(options); };
            var x = document.getElementsByTagName('script')[0];
            x.parentNode.insertBefore(s, x);
          `}
        </Script>
      </body>
    </html>
  );
}
