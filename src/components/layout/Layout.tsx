import Header from "./Header";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import BackToTop from "./BackToTop";
import CookieConsent from "@/components/CookieConsent";
import PushPermissionPopup from "@/components/PushPermissionPopup";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Breadcrumbs />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
      <CookieConsent />
      <PushPermissionPopup />
    </div>
  );
}
