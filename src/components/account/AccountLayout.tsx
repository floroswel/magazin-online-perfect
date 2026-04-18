import { ReactNode } from "react";
import { NavLink, Navigate } from "react-router-dom";
import { Package, MapPin, Wallet, Heart, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import StorefrontLayout from "../storefront/StorefrontLayout";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/account", label: "Comenzile mele", icon: Package, end: true },
  { to: "/account/addresses", label: "Adrese", icon: MapPin },
  { to: "/account/wallet", label: "Portofel", icon: Wallet },
  { to: "/account/favorites", label: "Favorite", icon: Heart },
  { to: "/account/settings", label: "Setări", icon: Settings },
];

export default function AccountLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <StorefrontLayout>
      <div className="ml-container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <aside className="space-y-2">
            <div className="flex items-center gap-3 p-4 rounded-md bg-muted/40 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">Contul meu</p>
              </div>
            </div>
            <nav className="space-y-1">
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Deconectare
              </button>
            </nav>
          </aside>

          <main className="min-w-0">
            <h1 className="font-display text-3xl md:text-4xl mb-6">{title}</h1>
            {children}
          </main>
        </div>
      </div>
    </StorefrontLayout>
  );
}
