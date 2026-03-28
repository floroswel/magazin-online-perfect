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

export default function Layout({ children, hideHeader }: { children: React.ReactNode; hideHeader?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead />
      {!hideHeader && <Header />}
      <Breadcrumbs />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
      <CookieConsent />
      <PushPermissionPopup />
      <NewsletterPopup />
      <SocialProofPopup />
      <LiveChat />
    </div>
  );
}
