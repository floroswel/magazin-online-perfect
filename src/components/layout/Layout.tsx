import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import CookieConsent from "@/components/CookieConsent";
import SeoHead from "@/components/SeoHead";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import AnnouncementBar from "./AnnouncementBar";
import SiteAlert from "./SiteAlert";
import Ticker1Bar from "./Ticker1Bar";
import Ticker2Bar from "./Ticker2Bar";
import SocialProofPopup from "@/components/SocialProofPopup";
import QuickViewModal from "@/components/products/QuickViewModal";
import { QuickViewProvider } from "@/components/products/ProductCard";
import LiveChat from "@/components/LiveChat";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  const quickViewCtx = useMemo(() => ({ open: (id: string) => setQuickViewId(id) }), []);

  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SeoHead />
        <main className="flex-1">{children}</main>
        <CookieConsent />
      </div>
    );
  }

  const isCheckoutOrCart = location.pathname === "/checkout" || location.pathname === "/cos" || location.pathname === "/cart";

  return (
    <QuickViewProvider.Provider value={quickViewCtx}>
      <div className="min-h-screen flex flex-col">
        <SeoHead />
        <SiteAlert />
        <Ticker1Bar />
        <Ticker2Bar />
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileBottomNav />
        <CookieConsent />
        {!isCheckoutOrCart && <SocialProofPopup />}
        {!isCheckoutOrCart && <LiveChat />}
        <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
      </div>
    </QuickViewProvider.Provider>
  );
}
