import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import SiteAlert from "./SiteAlert";
import TopTicker from "./TopTicker";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import CookieConsent from "./CookieConsent";
import CompareBar from "./CompareBar";
import PopupNewsletter from "./conversion/PopupNewsletter";
import ToastSocialProof from "./conversion/ToastSocialProof";
import WhatsAppButton from "./conversion/WhatsAppButton";
import { useRealtimeSettings } from "@/hooks/useRealtimeSettings";

interface Props {
  children: ReactNode;
  hideFooter?: boolean;
}

export default function StorefrontLayout({ children, hideFooter }: Props) {
  const { pathname } = useLocation();
  const isCheckout = pathname === "/checkout" || pathname === "/cos";
  useRealtimeSettings();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteAlert />
      <TopTicker />
      <Header />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      {!hideFooter && <Footer />}
      <CompareBar />
      <MobileBottomNav />
      {!isCheckout && <CookieConsent />}
      <PopupNewsletter />
      <ToastSocialProof />
      <WhatsAppButton />
    </div>
  );
}
