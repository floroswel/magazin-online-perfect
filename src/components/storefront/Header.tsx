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

  const logoUrl = unq(s.header_logo_url) || unq(s.logo_url);
  const logoVisible = s.logo_visible !== "false";
  const siteName = unq(s.header_store_name) || unq(s.site_name) || "Mama Lucica";
  const phone = unq(s.contact_phone);
  const freeShip = unq(s.free_shipping_threshold) || "200";

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
      <div className="hidden md:block" style={{ background: "#222222", color: "#ffffff" }}>
        <div className="ml-container flex items-center justify-between h-8 text-[11px]">
          <div className="flex items-center gap-4">
            <span>Bine ai venit pe {siteName}!</span>
            <Link to={user ? "/account" : "/auth"} className="hover:underline">Contul meu</Link>
            <span className="opacity-30">|</span>
            <Link to="/track" className="hover:underline">Urmărește comanda</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-30">|</span>
            <span>RO / RON</span>
          </div>
        </div>
      </div>

      {/* LAYER 2 — White utility bar */}
      <div className="hidden md:block bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="ml-container flex items-center justify-between h-9 text-[12px]">
          <div className="flex items-center gap-1.5 text-green-700">
            <Check className="h-3.5 w-3.5" />
            <span>Livrare gratuită peste <strong>{freeShip} RON</strong></span>
          </div>
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 font-semibold text-gray-700 hover:text-blue-600 transition-colors">
              <Phone className="h-3.5 w-3.5" /> Suport: {phone}
            </a>
          )}
        </div>
      </div>

      {/* LAYER 3 — Main header */}
      <div className="bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="ml-container flex items-center gap-4 lg:gap-8 h-[70px]">
          {/* Mobile menu toggle */}
          <button className="xl:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)} aria-label="Meniu">
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {logoVisible && logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-10 lg:h-12 w-auto object-contain" />
            ) : (
              <span className="text-xl lg:text-2xl font-extrabold tracking-tight uppercase text-blue-600">
                {siteName}
              </span>
            )}
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchAutocomplete placeholder="Caută lumânări, odorizante..." />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1 lg:gap-3">
            <Link to="/compare" className="hidden lg:flex flex-col items-center gap-0.5 px-2 text-gray-600 hover:text-blue-600 transition-colors" aria-label="Compară">
              <div className="relative">
                <GitCompareArrows className="h-5 w-5" />
                {compareCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center">{compareCount}</span>
                )}
              </div>
              <span className="text-[10px] font-medium">Compară</span>
            </Link>

            <Link to="/account/favorites" className="hidden lg:flex flex-col items-center gap-0.5 px-2 text-gray-600 hover:text-blue-600 transition-colors" aria-label="Favorite">
              <div className="relative">
                <Heart className="h-5 w-5" />
                {favCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center">{favCount}</span>
                )}
              </div>
              <span className="text-[10px] font-medium">Favorite</span>
            </Link>

            <Link to={user ? "/account" : "/auth"} className="hidden lg:flex flex-col items-center gap-0.5 px-2 text-gray-600 hover:text-blue-600 transition-colors" aria-label="Cont">
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">{user ? "Contul meu" : "Cont"}</span>
            </Link>

            {/* Mobile fav */}
            <Link to="/account/favorites" className="lg:hidden relative p-2" aria-label="Favorite">
              <Heart className="h-5 w-5" />
              {favCount > 0 && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center">{favCount}</span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 h-11 px-4 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md"
              aria-label="Coș"
            >
              <span className="relative">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center">{cartCount}</span>
                )}
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-wider opacity-80">Coș</span>
                <span className="text-sm font-bold">{cartSubtotal.toFixed(2)} lei</span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={onSearch} className="md:hidden ml-container pb-3">
          <div className="relative flex">
            <input
              type="search" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Caută produse..."
              className="flex-1 h-10 pl-3 pr-2 border-2 border-r-0 border-blue-600 bg-white text-sm focus:outline-none rounded-l-md"
            />
            <button type="submit" className="h-10 px-3 bg-blue-600 text-white rounded-r-md" aria-label="Caută">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* LAYER 4 — Navbar categorii */}
      <nav className="hidden xl:block" style={{ background: "#333333" }}>
        <div className="ml-container flex items-center h-[42px]">
          {/* Toate Produsele with mega menu */}
          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => { setMegaOpen(false); setHoveredCat(null); }}
          >
            <button className="inline-flex items-center gap-2 h-[42px] px-5 bg-blue-600 text-white text-[12px] font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors">
              <Menu className="h-4 w-4" /> Toate Produsele <ChevronDown className="h-3 w-3" />
            </button>

            {/* Mega menu dropdown with sidebar */}
            {megaOpen && rootCats.length > 0 && (
              <div className="absolute left-0 top-full z-50 bg-white border border-gray-200 shadow-2xl rounded-b-lg" style={{ width: 700 }}>
                <div className="flex min-h-[280px]">
                  {/* Sidebar categorii */}
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

                  {/* Right panel — subcategorii */}
                  <div className="flex-1 p-6">
                    {hoveredCat ? (
                      <>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Subcategorii</p>
                        <div className="grid grid-cols-2 gap-2">
                          {getSubcats(hoveredCat).map((sub: any) => (
                            <Link key={sub.id} to={`/categorie/${sub.slug}`} className="text-sm text-gray-700 hover:text-blue-600 transition-colors py-1">
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                        {getSubcats(hoveredCat).length === 0 && (
                          <p className="text-sm text-gray-400">Nicio subcategorie încă.</p>
                        )}
                        <Link to="/catalog" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-4">
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

          <NavLink to="/" end className={({ isActive }) => `inline-flex items-center h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide transition-colors ${isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-blue-600 hover:text-white"}`}>
            Acasă
          </NavLink>
          <NavLink to="/catalog?sort=discount" className={({ isActive }) => `inline-flex items-center h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide transition-colors ${isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-blue-600 hover:text-white"}`}>
            Reduceri
          </NavLink>
          <NavLink to="/catalog?sort=newest" className={({ isActive }) => `inline-flex items-center h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide transition-colors ${isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-blue-600 hover:text-white"}`}>
            Noutăți
          </NavLink>

          {navCategories.slice(0, 4).map((cat: any) => (
            <MegaMenu key={cat.id} rootCat={cat} />
          ))}

          <NavLink to="/catalog?tag=seturi-cadou" className={({ isActive }) => `inline-flex items-center h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide transition-colors ${isActive ? "bg-blue-600 text-white" : "text-yellow-400 hover:bg-blue-600 hover:text-white"}`}>
            🎁 Vouchere Cadou
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
            <div className="flex items-center justify-between p-4" style={{ background: "#333" }}>
              <span className="text-lg font-extrabold uppercase tracking-wide text-white">Meniu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-white" aria-label="Închide"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {[
                { label: "Acasă", to: "/" },
                { label: "Toate produsele", to: "/catalog" },
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
                className="flex items-center gap-2 px-3 py-3 bg-blue-600 text-white text-sm font-bold uppercase justify-center rounded-md">
                <User className="h-4 w-4" /> {user ? "Contul meu" : "Login / Register"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
