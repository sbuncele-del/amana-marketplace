import {AppInstall} from '@/components/app-install';
import {Suspense} from 'react';
import {EmailInterestCapture} from '@/components/shop/email-interests';
import {EmailCapturePopup} from '@/components/email-capture-popup';
import {MarketSelector} from '@/components/shop/market-selector';
import { Navbar } from "@/components/layout/navbar";
import {CustomerChat} from "@/components/shop/customer-chat";
import { Footer } from "@/components/layout/footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}><EmailInterestCapture/></Suspense>
      <Navbar />
      <MarketSelector />
      <div className="min-h-screen">{children}</div>
      <AppInstall/>
      <Footer />
      <CustomerChat/>
      <EmailCapturePopup/>
    </>
  );
}
