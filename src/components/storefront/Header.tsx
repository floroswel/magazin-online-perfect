import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X, GitCompareArrows, ChevronDown, ChevronRight, Phone, Truck, Check } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [megaOpen, setMegaOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const { data: navCategories = [] } = useQuery({
    queryKey: ["nav-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id, display_order, visible, show_in_nav, image_url")
        .eq("visible", true)
        .eq("show_in_nav", true)
        .is("parent_id", null)
        .order("display_order")
        .order("name");
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["all-categories-mega"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id, image_url")
        .eq("visible", true)
        .order("display_order");
      return data || [];
    },
    staleTime: 60_000,
  });

  // All settings-driven values
  const logoUrl = unq(s.header_logo_url) || unq(s.logo_url);
  const logoVisible = s.logo_visible !== "false";
  const siteName = unq(s.header_store_name) || unq(s.site_name) || "Mama Lucica";
  const phone = unq(s.contact_phone);
  const freeShip = unq(s.free_shipping_threshold) || "200";
  const primaryColor = unq(s.primary_color) || unq(s.theme_primary_color) || "#2563eb";
  const topbarColor = unq(s.header_topbar_bg_color) || unq(s.theme_topbar_color) || "#222222";
  const navbarColor = unq(s.nav_bar_color) || unq(s.theme_navbar_color) || "#333333";
  const welcomeText = unq(s.header_welcome_text) || "Bine ai venit pe";
  const trackText = unq(s.header_track_text) || "Urmărește comanda";
  const localeText = unq(s.header_locale_text) || "RO / RON";
  const allProductsText = unq(s.header_all_products_text) || "Toate Produsele";
  const voucherText = unq(s.header_voucher_text) || "🎁 Vouchere Cadou";
  const voucherUrl = unq(s.header_voucher_url) || "/catalog?tag=seturi-cadou";
  const navHomeText = unq(s.header_nav_home_text) || "Acasă";
  const navReduceriText = unq(s.header_nav_reduceri_text) || "Reduceri";
  const navNoutatiText = unq(s.header_nav_noutati_text) || "Noutăți";
  const searchPlaceholder = unq(s.header_search_placeholder) || "Caută lumânări, odorizante...";
  const cartLabel = unq(s.header_cart_label) || "Coș";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/cautare?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const rootCats = allCategories.filter((c: any) => !c.parent_id);
  const getSubcats = (parentId: string) => allCategories.filter((c: any) => c.parent_id === parentId);

  const categoryIcons: Record<string, string> = {
    "lumanari-pahar": "🕯️",
    "lumanari-pilar": "🏗️",
    "tealight": "🪔",
    "seturi-cadou": "🎁",
    "diffuzoare": "🌬️",
  };

  return (
    <header className="sticky top-0 z-40">
      {/* LAYER 1 — Dark topbar */}
      {unq(s.header_topbar_show) !== "false" && (
      <div className="hidden md:block" style={{ background: topbarColor, color: "#ffffff" }}>
        <div className="ml-container flex items-center justify-between h-8 text-[11px]">
          <div className="flex items-center gap-4">
            <span>{welcomeText} {siteName}!</span>
            <Link to={user ? "/account" : "/auth"} className="hover:underline">Contul meu</Link>
            <span className="opacity-30">|</span>
            <Link to="/track" className="hover:underline">{trackText}</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-30">|</span>
            <span>{localeText}</span>
          </div>
        </div>
      </div>
      )}

      {/* LAYER 2 — White utility bar */}
      <div className="hidden md:block bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="ml-container flex items-center justify-between h-9 text-[12px]">
          <div className="flex items-center gap-1.5 text-green-700">
            <Check className="h-3.5 w-3.5" />
            <span>Livrare gratuită peste <strong>{freeShip} RON</strong></span>
          </div>
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 font-semibold text-gray-700 transition-colors" onMouseEnter={e => e.currentTarget.style.color = primaryColor} onMouseLeave={e => e.currentTarget.style.color = ""}>
              <Phone className="h-3.5 w-3.5" /> Suport: {phone}
            </a>
          )}
        </div>
      </div>

      {/* LAYER 3 — Main header */}
      <div className="bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="ml-container flex items-center gap-4 lg:gap-8 h-[70px]">
          <button className="xl:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)} aria-label="Meniu">
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            {logoVisible && logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-10 lg:h-12 w-auto object-contain" />
            ) : (
              <span className="text-xl lg:text-2xl font-extrabold tracking-tight uppercase" style={{ color: primaryColor }}>
                {siteName}
              </span>
            )}
          </Link>

          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchAutocomplete placeholder={searchPlaceholder} />
          </div>

          <div className="ml-auto flex items-center gap-1 lg:gap-3">
            <Link to="/compare" className="hidden lg:flex flex-col items-center gap-0.5 px-2 text-gray-600 transition-colors" onMouseEnter={e => e.currentTarget.style.color = primaryColor} onMouseLeave={e => e.currentTarget.style.color = ""} aria-label="Compară">
              <div className="relative">
                <GitCompareArrows className="h-5 w-5" />
                {compareCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center" style={{ background: primaryColor }}>{compareCount}</span>
                )}
              </div>
              <span className="text-[10px] font-medium">Compară</span>
            </Link>

            <Link to="/account/favorites" className="hidden lg:flex flex-col items-center gap-0.5 px-2 text-gray-600 transition-colors" onMouseEnter={e => e.currentTarget.style.color = primaryColor} onMouseLeave={e => e.currentTarget.style.color = ""} aria-label="Favorite">
              <div className="relative">
                <Heart className="h-5 w-5" />
                {favCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center" style={{ background: primaryColor }}>{favCount}</span>
                )}
              </div>
              <span className="text-[10px] font-medium">Favorite</span>
            </Link>

            <Link to={user ? "/account" : "/auth"} className="hidden lg:flex flex-col items-center gap-0.5 px-2 text-gray-600 transition-colors" onMouseEnter={e => e.currentTarget.style.color = primaryColor} onMouseLeave={e => e.currentTarget.style.color = ""} aria-label="Cont">
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">{user ? "Contul meu" : "Cont"}</span>
            </Link>

            <Link to="/account/favorites" className="lg:hidden relative p-2" aria-label="Favorite">
              <Heart className="h-5 w-5" />
              {favCount > 0 && (
                <span className="absolute top-0 right-0 text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center" style={{ background: primaryColor }}>{favCount}</span>
              )}
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 h-11 px-4 text-white transition-colors rounded-md"
              style={{ background: primaryColor }}
              aria-label={cartLabel}
            >
              <span className="relative">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center">{cartCount}</span>
                )}
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-wider opacity-80">{cartLabel}</span>
                <span className="text-sm font-bold">{cartSubtotal.toFixed(2)} lei</span>
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={onSearch} className="md:hidden ml-container pb-3">
          <div className="relative flex">
            <input
              type="search" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 h-10 pl-3 pr-2 border-2 border-r-0 bg-white text-sm focus:outline-none rounded-l-md"
              style={{ borderColor: primaryColor }}
            />
            <button type="submit" className="h-10 px-3 text-white rounded-r-md" style={{ background: primaryColor }} aria-label="Caută">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* LAYER 4 — Navbar categorii */}
      <nav className="hidden xl:block" style={{ background: navbarColor }}>
        <div className="ml-container flex items-center h-[42px]">
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => { setMegaOpen(false); setHoveredCat(null); }}
          >
            <button
              className="inline-flex items-center gap-2 h-[42px] px-5 text-white text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{ background: primaryColor }}
            >
              <Menu className="h-4 w-4" /> {allProductsText} <ChevronDown className="h-3 w-3" />
            </button>

            {megaOpen && rootCats.length > 0 && (
              <div className="absolute left-0 top-full z-50 bg-white border border-gray-200 shadow-2xl rounded-b-lg" style={{ width: 700 }}>
                <div className="flex min-h-[280px]">
                  <div className="w-[240px] bg-gray-50 border-r border-gray-200 py-2">
                    {rootCats.map((cat: any) => (
                      <div
                        key={cat.id}
                        className="mega-sidebar-item"
                        onMouseEnter={() => setHoveredCat(cat.id)}
                      >
                        <Link
                          to={`/categorie/${cat.slug}`}
                          className="flex items-center gap-2 flex-1 text-sm text-gray-700"
                        >
                          <span>{categoryIcons[cat.slug] || "📦"}</span>
                          <span className="mega-sidebar-text font-medium transition-colors">{cat.name}</span>
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400 transition-transform" />
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 p-6">
                    {hoveredCat ? (
                      <>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Subcategorii</p>
                        <div className="grid grid-cols-2 gap-2">
                          {getSubcats(hoveredCat).map((sub: any) => (
                            <Link key={sub.id} to={`/categorie/${sub.slug}`} className="text-sm text-gray-700 transition-colors py-1" onMouseEnter={e => e.currentTarget.style.color = primaryColor} onMouseLeave={e => e.currentTarget.style.color = ""}>
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                        {getSubcats(hoveredCat).length === 0 && (
                          <p className="text-sm text-gray-400">Nicio subcategorie încă.</p>
                        )}
                        <Link to="/catalog" className="inline-flex items-center gap-1 text-xs font-semibold hover:underline mt-4" style={{ color: primaryColor }}>
                          Vezi toate produsele →
                        </Link>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Selectează o categorie din stânga...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/" end className={({ isActive }) => `inline-flex items-center h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide transition-colors ${isActive ? "text-white" : "text-gray-300 hover:text-white"}`} style={({ isActive }) => isActive ? { background: primaryColor } : {}}>
            {navHomeText}
          </NavLink>
          <NavLink to="/catalog?sort=discount" className={({ isActive }) => `inline-flex items-center h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide transition-colors ${isActive ? "text-white" : "text-gray-300 hover:text-white"}`} style={({ isActive }) => isActive ? { background: primaryColor } : {}}>
            {navReduceriText}
          </NavLink>
          <NavLink to="/catalog?sort=newest" className={({ isActive }) => `inline-flex items-center h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide transition-colors ${isActive ? "text-white" : "text-gray-300 hover:text-white"}`} style={({ isActive }) => isActive ? { background: primaryColor } : {}}>
            {navNoutatiText}
          </NavLink>

          {navCategories.slice(0, 4).map((cat: any) => (
            <MegaMenu key={cat.id} rootCat={cat} />
          ))}

          <NavLink to={voucherUrl} className={({ isActive }) => `inline-flex items-center h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide transition-colors ${isActive ? "text-white" : "text-yellow-400 hover:text-white"}`} style={({ isActive }) => isActive ? { background: primaryColor } : {}}>
            {voucherText}
          </NavLink>

          <div className="ml-auto pr-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
              <Truck className="h-3.5 w-3.5" />
              Transport gratuit &gt; {freeShip} lei
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 h-screen w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4" style={{ background: navbarColor }}>
              <span className="text-lg font-extrabold uppercase tracking-wide text-white">Meniu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-white" aria-label="Închide"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {[
                { label: navHomeText, to: "/" },
                { label: allProductsText, to: "/catalog" },
                ...navCategories.map((c: any) => ({ label: c.name, to: `/categorie/${c.slug}` })),
                { label: "Blog", to: "/blog" },
                { label: "Contact", to: "/contact" },
              ].map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                  className="flex items-center px-3 py-3 text-sm font-semibold hover:bg-gray-100 transition-colors rounded-md">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t space-y-2">
              <Link to={user ? "/account" : "/auth"} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-3 text-white text-sm font-bold uppercase justify-center rounded-md"
                style={{ background: primaryColor }}>
                <User className="h-4 w-4" /> {user ? "Contul meu" : "Login / Register"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
