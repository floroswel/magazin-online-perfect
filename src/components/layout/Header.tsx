import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, User, Menu, X, ShoppingBag, ChevronDown, Grid3X3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCart } from "@/hooks/useCart";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useVisibility } from "@/hooks/useVisibility";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import MegaMenu from "@/components/layout/MegaMenu";
import { useStoreBranding } from "@/hooks/useStoreBranding";

const categories = [
  { name: "Lumânări Parfumate", slug: "lumanari-parfumate", icon: "🕯️" },
  { name: "Decorative", slug: "lumanari-decorative", icon: "✨" },
  { name: "Cadouri & Seturi", slug: "cadouri-seturi", icon: "🎁" },
  { name: "Aromaterapie", slug: "aromaterapie", icon: "🌿" },
  { name: "Eveniment", slug: "lumanari-eveniment", icon: "🎉" },
  { name: "Personalizare", slug: "personalizare", icon: "🎨" },
  { name: "Accesorii", slug: "accesorii", icon: "🔧" },
  { name: "Sezoniere", slug: "colectii-sezoniere", icon: "🍂" },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const layout = useLayoutSettings();
  const branding = useStoreBranding();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const showLogo = useVisibility("header_logo");
  const showSearch = useVisibility("header_search");
  const showCart = useVisibility("header_cart");
  const showMenu = useVisibility("header_menu");
  const showMegaMenu = useVisibility("mega_menu");
  const showFreeShipping = useVisibility("free_shipping_bar");

  useEffect(() => {
    if (mobileMenu) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenu]);

  const stickyClass = layout.header_sticky ? "sticky top-0" : "";

  return (
    <>
      {/* LAYER 2 — Main Header (Techniq style: white, no top bar) */}
      <header className={`bg-card ${stickyClass} z-50`} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="container flex items-center justify-between h-16 md:h-20 px-4 gap-4">
          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-3 shrink-0">
            {showMenu !== false && (
              <button className="lg:hidden text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setMobileMenu(true)} aria-label="Meniu">
                <Menu className="h-6 w-6" />
              </button>
            )}
            {showLogo !== false && (
              <Link to="/" className="shrink-0">
                <span className="text-primary font-bold text-xl md:text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Mama Lucica
                </span>
              </Link>
            )}
          </div>

          {/* Center: Search bar — Techniq style: rectangular, not pill */}
          {showSearch !== false && (
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <SearchAutocomplete
                className="[&_input]:bg-card [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_input]:h-11 [&_input]:border [&_input]:border-border [&_input]:rounded [&_input]:px-4 [&_input]:pr-12"
              />
            </div>
          )}

          {/* Right: Icons row — Techniq style: no text labels, just icons */}
          <div className="flex items-center gap-0.5 shrink-0">
            {user && (
              <Link to="/favorites" className="hidden md:flex items-center justify-center w-10 h-10 text-foreground/70 hover:text-primary transition-colors rounded-full hover:bg-muted">
                <Heart className="h-[22px] w-[22px]" />
              </Link>
            )}

            <button
              onClick={() => navigate(user ? "/account" : "/auth")}
              className="hidden md:flex items-center justify-center w-10 h-10 text-foreground/70 hover:text-primary transition-colors rounded-full hover:bg-muted"
            >
              <User className="h-[22px] w-[22px]" />
            </button>

            {showCart !== false && (
              <Link to={user ? "/cart" : "/auth"} className="relative flex items-center justify-center w-10 h-10 text-foreground/70 hover:text-primary transition-colors rounded-full hover:bg-muted">
                <ShoppingBag className="h-[22px] w-[22px]" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {showSearch !== false && (
              <Link to="/catalog" className="md:hidden flex items-center justify-center w-10 h-10 text-foreground/70">
                <Search className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* LAYER 3 — Navigation Bar (Techniq style) */}
        {showMenu !== false && (
          <div className="hidden lg:block" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <div className="container flex items-center h-12 px-4">
              {/* "Toate Produsele" dropdown button */}
              {showMegaMenu !== false && (
                <div className="relative" onMouseEnter={() => setShowCategories(true)} onMouseLeave={() => setShowCategories(false)}>
                  <button className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold h-12 px-5 hover:opacity-90 transition-opacity" style={{ minWidth: 200 }}>
                    <Grid3X3 className="w-4 h-4" />
                    Toate Produsele
                    <ChevronDown className="w-3.5 h-3.5 ml-auto" />
                  </button>
                  {showCategories && (
                    <div className="absolute top-full left-0 z-50 animate-fade-in" style={{ width: 720 }}>
                      <MegaMenu />
                    </div>
                  )}
                </div>
              )}

              <nav className="flex items-center gap-0 ml-1">
                {[
                  { to: "/", label: "Acasă" },
                  { to: "/catalog", label: "Catalog" },
                  { to: "/povestea-noastra", label: "Despre Noi" },
                  { to: "/blog", label: "Blog" },
                  { to: "/faq", label: "Contact" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-foreground/80 hover:text-primary text-sm px-4 h-12 flex items-center transition-colors border-b-2 border-transparent hover:border-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Mobile search bar */}
      {showSearch !== false && (
        <div className="md:hidden bg-card px-4 py-2 border-b sticky top-0 z-40" style={{ borderColor: "hsl(var(--border))" }}>
          <SearchAutocomplete className="[&_input]:h-9 [&_input]:text-sm [&_input]:rounded [&_input]:border [&_input]:border-border" />
        </div>
      )}

      {/* Mobile fullscreen overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-card transition-transform duration-300 ease-out ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <span className="text-primary font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>Mama Lucica</span>
          <button onClick={() => setMobileMenu(false)} className="text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <SearchAutocomplete className="[&_input]:h-10 [&_input]:text-sm [&_input]:rounded [&_input]:border [&_input]:border-border" />
        </div>

        {user && (
          <div className="px-4 py-3 border-b flex items-center gap-3 bg-muted/50" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {(user.email || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium truncate">{user.email}</p>
              <Link to="/account" onClick={() => setMobileMenu(false)} className="text-primary text-xs font-medium">Contul meu →</Link>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-3">Categorii</p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/catalog?category=${cat.slug}`}
                onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 min-h-[44px] px-2 text-foreground hover:bg-muted rounded transition-colors"
              >
                <span>{cat.icon}</span>
                <span className="text-sm">{cat.name}</span>
              </Link>
            ))}
          </div>

          <div className="border-t mx-4" style={{ borderColor: "hsl(var(--border))" }} />

          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-3">Navigare</p>
            {[
              { to: "/", label: "Acasă" },
              { to: "/catalog", label: "Toate Produsele" },
              { to: "/catalog?badge=deals", label: "🔥 Oferte" },
              ...(user ? [{ to: "/account", label: "Contul meu" }, { to: "/favorites", label: "Favorite" }] : [{ to: "/auth", label: "Autentificare" }]),
              ...(isAdmin ? [{ to: "/admin", label: "Admin Panel" }] : []),
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenu(false)}
                className="flex items-center min-h-[44px] px-2 text-foreground hover:bg-muted rounded transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/cart"
              onClick={() => setMobileMenu(false)}
              className="flex items-center justify-between min-h-[44px] px-2 text-foreground hover:bg-muted rounded transition-colors text-sm"
            >
              <span>Coș</span>
              {totalItems > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs">{totalItems}</Badge>
              )}
            </Link>
          </div>
        </nav>

        {user && (
          <div className="px-4 pb-6 border-t pt-4" style={{ borderColor: "hsl(var(--border))" }}>
            <button
              onClick={() => { signOut(); setMobileMenu(false); }}
              className="text-muted-foreground text-sm w-full text-left min-h-[44px]"
            >
              Deconectare
            </button>
          </div>
        )}
      </div>

      {mobileMenu && (
        <div className="fixed inset-0 z-[99] bg-black/50" onClick={() => setMobileMenu(false)} />
      )}
    </>
  );
}
