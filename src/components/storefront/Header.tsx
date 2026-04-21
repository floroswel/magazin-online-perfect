import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X, GitCompareArrows, Truck, ChevronDown, Phone, MapPin, Clock } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SearchAutocomplete from "./SearchAutocomplete";
import MegaMenu from "./MegaMenu";

const unq = (str?: string) => (str || "").replace(/^"|"$/g, "");

export default function Header() {
  const { count: cartCount, subtotal: cartSubtotal, setOpen: setCartOpen } = useCart();
  const { count: favCount } = useFavorites();
  const { ids: compareIds } = useCompare();
  const compareCount = compareIds?.length || 0;
  const { user } = useAuth();
  const { settings: s } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
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
  const phone = unq(s.contact_phone);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/cautare?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex items-center gap-2 px-4 h-12 text-[13px] font-bold uppercase tracking-wide transition-colors ${
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-card shadow-sm">
      {/* === ROW 1 — Topbar navy: program + telefon + livrare === */}
      <div className="hidden md:block bg-secondary text-secondary-foreground border-b border-secondary/40">
        <div className="ml-container flex items-center justify-between h-9 text-[12px]">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 opacity-90">
              <Clock className="h-3 w-3" /> {unq(s.contact_schedule) || "Luni–Vineri 09:00–18:00"}
            </span>
            <Link to="/page/livrare" className="hidden lg:flex items-center gap-1.5 hover:text-primary transition-colors">
              <Truck className="h-3 w-3" /> Livrare gratuită {">"} {unq(s.free_shipping_threshold) || "200"} lei
            </Link>
            <Link to="/track" className="hidden lg:flex items-center gap-1.5 hover:text-primary transition-colors">
              <MapPin className="h-3 w-3" /> Urmărire comandă
            </Link>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link to="/page/despre-noi" className="hidden lg:inline hover:text-primary transition-colors">Despre noi</Link>
            <Link to="/blog" className="hidden lg:inline hover:text-primary transition-colors">Blog</Link>
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 font-bold text-primary">
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* === ROW 2 — Main: logo · search · acțiuni === */}
      <div className="ml-container flex items-center gap-4 lg:gap-8 h-16 lg:h-20">
        {/* Mobile menu toggle */}
        <button
          className="xl:hidden p-2 -ml-2 text-foreground"
          onClick={() => setMobileOpen(true)}
          aria-label="Deschide meniu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {logoVisible && logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 lg:h-12 w-auto object-contain" />
          ) : (
            <>
              <span className="text-3xl">🕯️</span>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl lg:text-2xl font-extrabold tracking-tight text-secondary uppercase">
                  {siteName}
                </span>
                <span className="hidden lg:inline text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                  Lumânări artizanale
                </span>
              </div>
            </>
          )}
        </Link>

        {/* Search — mare cu buton portocaliu lipit */}
        <div className="hidden md:flex flex-1 max-w-3xl">
          <SearchAutocomplete placeholder="Caută produse, branduri, categorii..." />
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          {/* Compare */}
          <Link
            to="/compare"
            className="hidden lg:flex flex-col items-center gap-0.5 text-secondary hover:text-primary transition-colors group"
            aria-label="Comparator"
          >
            <div className="relative">
              <GitCompareArrows className="h-6 w-6" />
              {compareCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {compareCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide">Compară</span>
          </Link>

          {/* Wishlist */}
          <Link
            to="/account/favorites"
            className="hidden lg:flex flex-col items-center gap-0.5 text-secondary hover:text-primary transition-colors"
            aria-label="Favorite"
          >
            <div className="relative">
              <Heart className="h-6 w-6" />
              {favCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide">Favorite</span>
          </Link>

          {/* Account */}
          <Link
            to={user ? "/account" : "/auth"}
            className="hidden lg:flex flex-col items-center gap-0.5 text-secondary hover:text-primary transition-colors"
            aria-label="Cont"
          >
            <User className="h-6 w-6" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">{user ? "Contul meu" : "Cont"}</span>
          </Link>

          {/* Mobile favorite icon */}
          <Link to="/account/favorites" className="lg:hidden relative p-2 text-foreground" aria-label="Favorite">
            <Heart className="h-5 w-5" />
            {favCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {favCount}
              </span>
            )}
          </Link>

          {/* Cart — buton portocaliu mare */}
          <button
            onClick={() => setCartOpen(true)}
            className="inline-flex items-center gap-3 rounded-sm pl-3 pr-4 h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm group"
            aria-label="Coș"
          >
            <span className="relative">
              <ShoppingBag className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center border-2 border-primary">
                  {cartCount}
                </span>
              )}
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-[10px] uppercase tracking-wider opacity-90">Coșul meu</span>
              <span className="text-sm font-bold">{cartSubtotal.toFixed(2)} lei</span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={onSearch} className="md:hidden ml-container pb-3">
        <div className="relative flex">
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Caută produse..."
            className="flex-1 h-11 pl-4 pr-2 rounded-l-sm border-2 border-r-0 border-secondary bg-background text-sm focus:outline-none"
          />
          <button type="submit" className="h-11 px-4 rounded-r-sm bg-primary text-primary-foreground" aria-label="Caută">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {/* === ROW 3 — Bara categorii navy === */}
      <nav className="hidden xl:block bg-secondary text-secondary-foreground">
        <div className="ml-container flex items-center h-12">
          {/* All categories button — accent portocaliu */}
          <button className="inline-flex items-center gap-2 h-12 px-4 bg-primary text-primary-foreground text-[13px] font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors">
            <Menu className="h-4 w-4" /> Toate categoriile <ChevronDown className="h-3 w-3" />
          </button>

          <NavLink to="/" end className={navLinkCls}>
            Acasă
          </NavLink>
          <NavLink to="/catalog" className={navLinkCls}>
            Toate produsele
          </NavLink>
          {navCategories.map((cat: any) => (
            <MegaMenu key={cat.id} rootCat={cat} />
          ))}
          <NavLink to="/blog" className={navLinkCls}>
            Blog
          </NavLink>
          <NavLink to="/contact" className={navLinkCls}>
            Contact
          </NavLink>

          {/* Free shipping badge */}
          <div className="ml-auto pr-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary text-primary text-[11px] font-bold uppercase tracking-wide">
              <Truck className="h-3.5 w-3.5" />
              Transport gratuit {">"} {unq(s.free_shipping_threshold) || "200"} lei
            </span>
          </div>
        </div>
      </nav>

      {/* === Mobile drawer === */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div className="fixed inset-0 bg-scrim/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="fixed left-0 top-0 h-screen w-80 max-w-[85vw] bg-background shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 bg-secondary text-secondary-foreground">
              <span className="font-display text-lg font-extrabold uppercase tracking-wide">Meniu</span>
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
                  className="flex items-center gap-3 px-3 py-3 text-sm font-bold uppercase tracking-wide hover:bg-secondary hover:text-secondary-foreground rounded-sm transition-colors"
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
                className="flex items-center gap-2 px-3 py-3 bg-primary text-primary-foreground rounded-sm text-sm font-bold uppercase tracking-wide justify-center"
              >
                <User className="h-4 w-4" /> {user ? "Contul meu" : "Login / Register"}
              </Link>
              <Link
                to="/compare"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-3 bg-secondary text-secondary-foreground rounded-sm text-sm font-bold uppercase tracking-wide justify-center"
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
