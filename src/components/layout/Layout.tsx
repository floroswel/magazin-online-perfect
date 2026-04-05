import { useLocation } from "react-router-dom";
import CookieConsent from "@/components/CookieConsent";
import SeoHead from "@/components/SeoHead";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (typeof document !== "undefined" && !isAdmin) {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead />
      <main className="flex-1">{children}</main>
      <CookieConsent />
    </div>
  );
}
