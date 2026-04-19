import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const unq = (str?: string) => (str || "").replace(/^"|"$/g, "");

export default function Header() {
  const { count: cartCount, setOpen: setCartOpen } = useCart();
  const { count: favCount } = useFavorites();
  const { user } = useAuth();
  const { settings: s } = useSettings();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const logoUrl = unq(s.header_logo_url) || unq(s.logo_url);
  const logoVisible = s.logo_visible !== "false";
  const siteName = unq(s.header_store_name) || unq(s.site_name) || "Mama Lucica";
  const [siteNameFirst, ...siteNameRest] = siteName.split(" ");
  const siteNameLast = siteNameRest.join(" ");
  const searchPlaceholder = unq(s.header_search_placeholder) || "Caută lumânări, parfumuri, ocazii...";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/cautare?q=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border">
      <div className="ml-container flex items-center gap-4 h-16 xl:h-20">
        {/* Mobile menu */}
        <button
          className="xl:hidden p-2 -ml-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Deschide meniu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {logoVisible && logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 lg:h-10 w-auto object-contain" />
          ) : (
            <>
              <span className="text-2xl">🕯️</span>
              <span className="font-display text-xl lg:text-2xl font-medium tracking-tight">
                {siteNameFirst} {siteNameLast && <span className="text-accent">{siteNameLast}</span>}
              </span>
            </>
          )}
        </Link>

        {/* Search — desktop */}
        <form onSubmit={onSearch} className="hidden xl:flex flex-1 max-w-2xl mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-11 pl-10 pr-24 border border-border rounded-sm bg-background text-sm focus:outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-4 h-9 bg-primary text-primary-foreground text-xs font-semibold rounded-sm tracking-wide uppercase hover:opacity-90 transition-opacity"
            >
              Caută
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 lg:gap-2">
          <Link
            to={user ? "/account" : "/auth"}
            className="hidden xl:flex flex-col items-center px-3 py-1.5 hover:bg-muted rounded-sm transition-colors text-[11px]"
          >
            <User className="h-5 w-5 mb-0.5" />
            <span className="font-medium">{user ? "Cont" : "Login"}</span>
          </Link>

          <Link
            to="/account/favorites"
            className="relative p-2 hover:bg-muted rounded-sm transition-colors"
            aria-label="Favorite"
          >
            <Heart className="h-5 w-5" />
            {favCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {favCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 hover:bg-muted rounded-sm transition-colors"
            aria-label="Coș"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search — mobile */}
      <form onSubmit={onSearch} className="xl:hidden ml-container pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Caută..."
            className="w-full h-10 pl-10 pr-3 border border-border rounded-sm bg-background text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </form>

      {/* Nav bar — desktop */}
      <nav className="hidden xl:block border-t border-border/40">
        <div className="ml-container flex items-center gap-1 h-11">
          {[
            { label: "Toate produsele", to: "/#produse" },
            { label: "Despre noi", to: "/page/despre-noi" },
            { label: "Garanție", to: "/page/garantie" },
            { label: "Livrare", to: "/page/livrare" },
            { label: "FAQ", to: "/page/faq" },
            { label: "Contact", to: "/contact" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-4 h-full flex items-center text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors uppercase tracking-wider text-[11px]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/#oferte"
            className="ml-auto px-4 h-7 mt-1.5 flex items-center text-xs font-bold uppercase tracking-wider bg-accent text-accent-foreground rounded-sm hover:opacity-90 transition-opacity"
          >
            🔥 Oferte
          </Link>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 h-screen w-80 max-w-[85vw] bg-background shadow-editorial flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-display text-xl">Meniu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {[
                { label: "Acasă", to: "/" },
                { label: "Toate produsele", to: "/#produse" },
                { label: "Lumânări", to: "/categorie/lumanari" },
                { label: "Lumânări parfumate", to: "/categorie/lumanari-parfumate" },
                { label: "După parfum", to: "/categorie/dupa-parfum" },
                { label: "După ocazie", to: "/categorie/dupa-ocazie" },
                { label: "Cadouri", to: "/categorie/cadouri" },
                { label: "Personalizate", to: "/categorie/personalizate" },
                { label: "Odorizante Dulap", to: "/categorie/odorizante-dulap" },
                { label: "Oferte", to: "/#oferte" },
                { label: "Despre noi", to: "/page/despre-noi" },
                { label: "Contact", to: "/contact" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-3 text-sm font-medium hover:bg-muted rounded-sm transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <Link
                to={user ? "/account" : "/auth"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted rounded-sm text-sm font-medium"
              >
                <User className="h-4 w-4" /> {user ? "Contul meu" : "Autentifică-te"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
