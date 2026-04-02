import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, User, Menu, X, ShoppingBag, ChevronDown } from "lucide-react";
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
import { useEditableContent } from "@/hooks/useEditableContent";

export default function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const layout = useLayoutSettings();
  const branding = useStoreBranding();
  const { header_topbar, header_nav, mobile_categories } = useEditableContent();
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
      <header className={`bg-background ${stickyClass} z-50 border-b border-border`}>
        {/* Top utility bar */}
        <div className="bg-muted border-b border-border">
          <div className="container flex items-center justify-between h-8 px-4 text-[11px] text-muted-foreground">
            <span className="font-medium">{header_topbar.phone}</span>
            <span className="hidden sm:block font-semibold text-primary">{header_topbar.shipping_text}</span>
            <span className="hidden md:block">{header_topbar.location}</span>
          </div>
        </div>

        {/* Main header row */}
        <div className="container flex items-center justify-between h-[76px] px-4 gap-4">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3 shrink-0">
            {showMenu !== false && (
              <button className="lg:hidden text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setMobileMenu(true)} aria-label="Meniu">
                <Menu className="h-6 w-6" />
              </button>
            )}
            {showLogo !== false && (
              <Link to="/" className="shrink-0 flex items-center gap-2">
                <span className="text-foreground font-black text-2xl md:text-[28px] tracking-tight">
                  Mama<span className="text-primary">Lucica</span>
                </span>
              </Link>
            )}
          </div>

          {/* Center: Search bar — eMAG style */}
          {showSearch !== false && (
            <div className="flex-1 max-w-3xl mx-6 hidden md:flex items-center">
              <div className="flex-1 relative flex">
                <SearchAutocomplete
                  className="flex-1 [&_input]:bg-background [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_input]:h-12 [&_input]:border [&_input]:border-border [&_input]:rounded-l-lg [&_input]:rounded-r-none [&_input]:px-5 [&_input]:pr-4 [&_input]:focus:ring-2 [&_input]:focus:ring-primary/30 [&_input]:focus:border-primary"
                />
                <button
                  onClick={() => navigate("/catalog")}
                  className="h-12 px-5 bg-primary hover:bg-secondary text-primary-foreground rounded-r-lg flex items-center justify-center transition-colors shrink-0"
                  aria-label="Caută"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Right: Icons — eMAG horizontal inline style */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(user ? "/account" : "/auth")}
              className="hidden md:flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
            >
              <User className="h-5 w-5" />
              <span className="text-sm font-semibold whitespace-nowrap">Contul meu</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {user && (
              <Link to="/favorites" className="hidden md:flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-muted">
                <Heart className="h-5 w-5" />
                <span className="text-sm font-semibold whitespace-nowrap">Favorite</span>
              </Link>
            )}

            {showCart !== false && (
              <Link to={user ? "/cart" : "/auth"} className="hidden md:flex items-center gap-1.5 relative text-foreground/80 hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-muted">
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 h-[18px] min-w-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">Coșul meu</span>
              </Link>
            )}

            {showSearch !== false && (
              <Link to="/catalog" className="md:hidden flex items-center justify-center w-10 h-10 text-foreground/70">
                <Search className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Bar — eMAG style */}
        {showMenu !== false && (
          <div className="hidden lg:block border-t border-border bg-background">
            <div className="container flex items-center h-11 px-4">
              {showMegaMenu !== false && (
                <div className="relative" onMouseEnter={() => setShowCategories(true)} onMouseLeave={() => setShowCategories(false)}>
                  <button className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold h-11 px-5 hover:bg-secondary transition-colors" style={{ minWidth: 180 }}>
                    <Menu className="w-4 h-4" />
                    Produse
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
                  { to: "/catalog?badge=deals", label: "Oferte MamaLucica", highlight: true },
                  { to: "/catalog", label: "Catalog" },
                  { to: "/povestea-noastra", label: "Despre Noi" },
                  { to: "/blog", label: "Blog" },
                  { to: "/faq", label: "Contact" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`text-sm font-semibold px-4 h-11 flex items-center transition-colors border-b-2 border-transparent hover:border-primary ${
                      (link as any).highlight ? "text-primary font-bold" : "text-foreground/80 hover:text-primary"
                    }`}
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
        <div className="md:hidden bg-background px-4 py-2 border-b border-border z-40">
          <SearchAutocomplete className="[&_input]:h-9 [&_input]:text-sm [&_input]:rounded-full [&_input]:border [&_input]:border-border [&_input]:bg-muted [&_input]:px-4" />
        </div>
      )}

      {/* Mobile fullscreen overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-background transition-transform duration-300 ease-out ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <span className="text-foreground font-black text-xl">Mama<span className="text-primary">Lucica</span></span>
          <button onClick={() => setMobileMenu(false)} className="text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <SearchAutocomplete className="[&_input]:h-10 [&_input]:text-sm [&_input]:rounded-full [&_input]:border [&_input]:border-border [&_input]:bg-muted" />
        </div>

        {user && (
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {(user.email || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium truncate">{user.email}</p>
              <Link to="/account" onClick={() => setMobileMenu(false)} className="text-primary text-xs font-semibold">Contul meu →</Link>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 mt-3">Categorii</p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/catalog?category=${cat.slug}`}
                onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 min-h-[44px] px-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <span>{cat.icon}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-border mx-4" />

          <div className="px-4 py-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 mt-3">Navigare</p>
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
                className="flex items-center min-h-[44px] px-2 text-foreground hover:bg-muted rounded-lg transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/cart"
              onClick={() => setMobileMenu(false)}
              className="flex items-center justify-between min-h-[44px] px-2 text-foreground hover:bg-muted rounded-lg transition-colors text-sm font-medium"
            >
              <span>Coș</span>
              {totalItems > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs">{totalItems}</Badge>
              )}
            </Link>
          </div>
        </nav>

        {user && (
          <div className="px-4 pb-6 border-t border-border pt-4">
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
        <div className="fixed inset-0 z-[99] bg-foreground/30" onClick={() => setMobileMenu(false)} />
      )}
    </>
  );
}