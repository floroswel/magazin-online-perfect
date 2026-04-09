import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const tabs = [
  { icon: Home, label: "Acasă", to: "/" },
  { icon: Search, label: "Caută", to: "/catalog" },
  { icon: Heart, label: "Salvate", to: "/favorites" },
  { icon: User, label: "Cont", to: "/account" },
] as const;

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-card border-t border-border z-[9998] flex"
      style={{ boxShadow: "0 -2px 8px rgba(0,0,0,0.06)" }}
    >
      {tabs.map(({ icon: Icon, label, to }) => {
        const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
        const href = label === "Cont" && !user ? "/auth" : to;

        return (
          <Link
            key={to}
            to={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-b" />
            )}
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
