import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X, GitCompareArrows, Truck } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const unq = (str?: string) => (str || "").replace(/^"|"$/g, "");

// Mapare iconuri pentru categoriile principale (Woodmart-style)
const CATEGORY_ICONS: Record<string, string> = {
  default: "🕯️",
};

export default function Header() {
  const { count: cartCount, setOpen: setCartOpen } = useCart();
  const { count: favCount } = useFavorites();
  const { items: compareItems } = useCompare();
  const compareCount = compareItems?.length || 0;
  const { user } = useAuth();
  const { settings: s } = useSettings();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const { data: navCategories = [] } = useQuery({
    queryKey: ["nav-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id, display_order, visible, show_in_nav, image_url")
        .eq("visible", true)
        .eq("show_in_nav", true)
        .is("parent_id", null)
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const logoUrl = unq(s.header_logo_url) || unq(s.logo_url);
  const logoVisible = s.logo_visible !== "false";
  const siteName = unq(s.header_store_name) || unq(s.site_name) || "Mama Lucica";
  const searchPlaceholder = unq(s.header_search_placeholder) || "Caută lumânări, parfumuri, ocazii...";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/cautare?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const cartTotal = 0; // TODO: hook subtotal când e nevoie

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      {/* Main row: logo · search · actions */}
      <div className="ml-container flex items-center gap-4 lg:gap-8 h-16 lg:h-20">
        {/* Mobile menu */}
        <button
          className="xl:hidden p-2 -ml-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Deschide meniu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {logoVisible && logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 lg:h-10 w-auto object-contain" />
          ) : (
            <>
              <span className="text-2xl">🕯️</span>
              <span className="font-display text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                {siteName.toLowerCase()}<span className="text-primary">.</span>
              </span>
            </>
          )}
        </Link>

        {/* Search pill — Woodmart long rounded */}
        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-3xl">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="search-pill"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 h-9 bg-primary text-primary-foreground text-xs font-semibold rounded-full uppercase tracking-wide hover:bg-primary/90 transition-colors"
            >
              Caută
            </button>
          </div>
        </form>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1 lg:gap-3">
          {/* Compare circle (desktop) */}
          <Link
            to="/compare"
            className="hidden lg:flex relative w-10 h-10 rounded-full bg-secondary items-center justify-center hover:bg-muted transition-colors"
            aria-label="Comparator"
          >
            <GitCompareArrows className="h-5 w-5" />
            {compareCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {compareCount}
              </span>
            )}
          </Link>

          {/* Wishlist circle */}
          <Link
            to="/account/favorites"
            className="hidden lg:flex relative w-10 h-10 rounded-full bg-secondary items-center justify-center hover:bg-muted transition-colors"
            aria-label="Favorite"
          >
            <Heart className="h-5 w-5" />
            {favCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {favCount}
              </span>
            )}
          </Link>

          {/* Account pill */}
          <Link
            to={user ? "/account" : "/auth"}
            className="hidden lg:inline-flex pill-btn-light"
            aria-label="Cont"
          >
            <User className="h-4 w-4" />
            <span>{user ? "Contul meu" : "Login / Register"}</span>
          </Link>

          {/* Mobile icons */}
          <Link
            to="/account/favorites"
            className="lg:hidden relative p-2"
            aria-label="Favorite"
          >
            <Heart className="h-5 w-5" />
            {favCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {favCount}
              </span>
            )}
          </Link>

          {/* Cart pill — black Woodmart */}
          <button
            onClick={() => setCartOpen(true)}
            className="pill-btn-dark"
            aria-label="Coș"
          >
            <span className="relative">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">{cartTotal.toFixed(2)} lei</span>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={onSearch} className="md:hidden ml-container pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Caută..."
            className="w-full h-11 pl-11 pr-4 rounded-full border border-input bg-background text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </form>

      {/* Category icon nav — Woodmart style */}
      <nav className="hidden xl:block border-t border-border">
        <div className="ml-container flex items-center gap-1 h-12 overflow-x-auto">
          <Link to="/" className="cat-icon-pill font-semibold">
            <span className="text-lg">🏠</span> Acasă
          </Link>
          <Link to="/catalog" className="cat-icon-pill font-semibold">
            <span className="text-lg">🕯️</span> Toate produsele
          </Link>
          {navCategories.map((cat: any) => (
            <Link key={cat.id} to={`/categorie/${cat.slug}`} className="cat-icon-pill">
              <span className="text-lg" aria-hidden>{CATEGORY_ICONS[cat.slug] || "🕯️"}</span>
              {cat.name}
            </Link>
          ))}
          <Link to="/blog" className="cat-icon-pill">
            <span className="text-lg">📰</span> Blog
          </Link>
          <Link to="/contact" className="cat-icon-pill">
            <span className="text-lg">📞</span> Contact
          </Link>

          {/* Free shipping pill — right side */}
          <div className="ml-auto">
            <span className="shipping-pill">
              <Truck className="h-3.5 w-3.5" />
              Transport gratuit la comenzi &gt; 200 lei
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div className="fixed inset-0 bg-scrim/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="fixed left-0 top-0 h-screen w-80 max-w-[85vw] bg-background shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
              <span className="font-display text-lg font-bold">Meniu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2" aria-label="Închide"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {[
                { label: "Acasă", to: "/", icon: "🏠" },
                { label: "Toate produsele", to: "/catalog", icon: "🕯️" },
                ...navCategories.map((c: any) => ({ label: c.name, to: `/categorie/${c.slug}`, icon: "🕯️" })),
                { label: "Blog", to: "/blog", icon: "📰" },
                { label: "Despre noi", to: "/page/despre-noi", icon: "ℹ️" },
                { label: "Contact", to: "/contact", icon: "📞" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-border space-y-2">
              <Link
                to={user ? "/account" : "/auth"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold justify-center"
              >
                <User className="h-4 w-4" /> {user ? "Contul meu" : "Login / Register"}
              </Link>
              <Link
                to="/compare"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 bg-secondary text-foreground rounded-full text-sm font-medium justify-center"
              >
                <GitCompareArrows className="h-4 w-4" /> Comparator ({compareCount})
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
