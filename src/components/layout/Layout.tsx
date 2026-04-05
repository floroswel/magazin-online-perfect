import { useLocation } from "react-router-dom";
import CookieConsent from "@/components/CookieConsent";
import SeoHead from "@/components/SeoHead";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import AnnouncementBar from "./AnnouncementBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SeoHead />
        <main className="flex-1">{children}</main>
        <CookieConsent />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead />
      <AnnouncementBar />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <CookieConsent />
    </div>
  );
}
