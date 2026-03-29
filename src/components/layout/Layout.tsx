import { Link, useLocation } from "react-router-dom";
import { Home, Grid3X3, ShoppingBag, User } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import BackToTop from "./BackToTop";
import CookieConsent from "@/components/CookieConsent";
import PushPermissionPopup from "@/components/PushPermissionPopup";
import NewsletterPopup from "@/components/NewsletterPopup";
import SeoHead from "@/components/SeoHead";
import SocialProofPopup from "@/components/SocialProofPopup";
import LiveChat from "@/components/LiveChat";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import BannerRenderer from "./BannerRenderer";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

const mobileNavItems = [
  { to: "/", label: "Acasă", icon: Home },
  { to: "/catalog", label: "Catalog", icon: Grid3X3 },
  { to: "/cart", label: "Coș", icon: ShoppingBag },
  { to: "/account", label: "Cont", icon: User },
];

export default function Layout({ children, hideHeader }: { children: React.ReactNode; hideHeader?: boolean }) {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead />
      <BannerRenderer />
      {!hideHeader && <Header />}
      <Breadcrumbs />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <BackToTop />
      <CookieConsent />
      <PushPermissionPopup />
      <NewsletterPopup />
      <SocialProofPopup />
      <LiveChat />
      <ExitIntentPopup />

      {/* Mobile bottom navigation */}
      {!isAdmin && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
          <div className="flex items-center justify-around h-14">
            {mobileNavItems.map((item) => {
              const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              const actualTo = item.to === "/account" && !user ? "/auth" : item.to;
              return (
                <Link
                  key={item.to}
                  to={actualTo}
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] relative ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {item.to === "/cart" && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-medium px-1">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
