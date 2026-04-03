import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Menu, X, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCart } from "@/hooks/useCart";
import { useVisibility } from "@/hooks/useVisibility";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import MegaMenu from "@/components/layout/MegaMenu";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { useEditableContent } from "@/hooks/useEditableContent";

export default function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const layout = useLayoutSettings();
  const branding = useStoreBranding();
  const { header_topbar, header_nav, mobile_categories } = useEditableContent();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const showLogo = useVisibility("header_logo");
  const showSearchVis = useVisibility("header_search");
  const showCart = useVisibility("header_cart");
  const showMenuVis = useVisibility("header_menu");
  const showFreeShipping = useVisibility("free_shipping_bar");

  useEffect(() => {
    if (mobileMenu) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenu]);

  const stickyClass = layout.header_sticky ? "sticky top-0" : "";

  return (
    <>
      <header className={`bg-background ${stickyClass} z-50`}>
        {/* Announcement bar — Ella style black */}
        {showFreeShipping !== false && (
          <div className="bg-foreground text-background text-center py-2.5 text-xs tracking-wide">
            <span>{header_topbar.shipping_text || "End of season sale up to 50% off."} </span>
            <Link to="/catalog" className="underline font-medium hover:opacity-80">
              Shop Now
            </Link>
          </div>
        )}

        {/* Main header — Ella layout */}
        <div className="border-b border-border">
          <div className="container flex items-center justify-between h-16 md:h-[72px] px-4">
            {/* Left: hamburger + search */}
            <div className="flex items-center gap-4 w-1/3">
              {showMenuVis !== false && (
                <button
                  className="text-foreground hover:opacity-60 transition-opacity"
                  onClick={() => setMobileMenu(true)}
                  aria-label="Meniu"
                >
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                </button>
              )}
              {showSearchVis !== false && (
                <button
                  className="text-foreground hover:opacity-60 transition-opacity"
                  onClick={() => setShowSearch(!showSearch)}
                  aria-label="Caută"
                >
                  <Search className="h-5 w-5" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Center: Logo */}
            {showLogo !== false && (
              <div className="flex-shrink-0 w-1/3 flex justify-center">
                <Link to="/" className="text-foreground font-black text-2xl md:text-3xl tracking-tight uppercase">
                  {branding.name || "MamaLucica"}
                </Link>
              </div>
            )}

            {/* Right: account + cart */}
            <div className="flex items-center justify-end gap-4 w-1/3">
              <button
                onClick={() => navigate(user ? "/account" : "/auth")}
                className="hidden md:block text-foreground hover:opacity-60 transition-opacity"
                aria-label="Cont"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
              </button>

              {showCart !== false && (
                <Link
                  to={user ? "/cart" : "/auth"}
                  className="relative text-foreground hover:opacity-60 transition-opacity"
                  aria-label="Coș"
                >
                  <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold px-1">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search dropdown — Ella style */}
        {showSearch && (
          <div className="border-b border-border bg-background animate-fade-in">
            <div className="container px-4 py-4 max-w-2xl mx-auto">
              <SearchAutocomplete
                className="[&_input]:h-12 [&_input]:text-base [&_input]:border-0 [&_input]:border-b-2 [&_input]:border-foreground [&_input]:rounded-none [&_input]:bg-transparent [&_input]:px-0 [&_input]:focus:ring-0 [&_input]:placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}
      </header>

      {/* Mobile fullscreen menu — Ella style */}
      <div
        className={`fixed inset-0 z-[100] bg-background transition-transform duration-300 ease-out ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <span className="text-foreground font-black text-xl uppercase tracking-tight">
            {branding.name || "MamaLucica"}
          </span>
          <button onClick={() => setMobileMenu(false)} className="text-foreground p-2">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-8">
          {/* Main nav links */}
          <div className="space-y-0">
            {header_nav.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenu(false)}
                className="block py-3 text-foreground text-lg font-medium border-b border-border/50 hover:opacity-60 transition-opacity"
              >
                {link.label}
              </Link>
            ))}

            {mobile_categories.length > 0 && (
              <>
                <div className="pt-6 pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Categorii</p>
                </div>
                {mobile_categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/catalog?category=${cat.slug}`}
                    onClick={() => setMobileMenu(false)}
                    className="block py-3 text-foreground text-base border-b border-border/50 hover:opacity-60 transition-opacity"
                  >
                    {cat.name}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Account links */}
          <div className="mt-8 space-y-0">
            {user ? (
              <>
                <Link to="/account" onClick={() => setMobileMenu(false)} className="block py-3 text-sm text-muted-foreground hover:text-foreground border-b border-border/50">
                  Contul meu
                </Link>
                <Link to="/favorites" onClick={() => setMobileMenu(false)} className="block py-3 text-sm text-muted-foreground hover:text-foreground border-b border-border/50">
                  Favorite
                </Link>
                <Link to="/cart" onClick={() => setMobileMenu(false)} className="flex items-center justify-between py-3 text-sm text-muted-foreground hover:text-foreground border-b border-border/50">
                  <span>Coș</span>
                  {totalItems > 0 && <Badge variant="secondary" className="text-xs">{totalItems}</Badge>}
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenu(false)} className="block py-3 text-sm text-muted-foreground hover:text-foreground border-b border-border/50">
                    Admin
                  </Link>
                )}
                <button onClick={() => { signOut(); setMobileMenu(false); }} className="block py-3 text-sm text-muted-foreground hover:text-foreground w-full text-left">
                  Deconectare
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenu(false)} className="block py-3 text-sm text-muted-foreground hover:text-foreground border-b border-border/50">
                Autentificare
              </Link>
            )}
          </div>
        </nav>
      </div>

      {mobileMenu && (
        <div className="fixed inset-0 z-[99] bg-foreground/20" onClick={() => setMobileMenu(false)} />
      )}
    </>
  );
}
