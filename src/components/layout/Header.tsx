import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, User, Menu, X, ShoppingBag, ChevronDown, Truck, Shield, RotateCcw, Headphones, Sun, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCart } from "@/hooks/useCart";
import { useDarkMode } from "@/hooks/useDarkMode";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import MegaMenu from "@/components/layout/MegaMenu";

const categories = [
  { name: "Electronice", slug: "electronice", icon: "💻" },
  { name: "Modă", slug: "moda", icon: "👗" },
  { name: "Casa & Grădină", slug: "casa-gradina", icon: "🏠" },
  { name: "Sport", slug: "sport", icon: "⚽" },
  { name: "Auto", slug: "auto", icon: "🚗" },
  { name: "Copii", slug: "copii", icon: "🧸" },
  { name: "Sănătate", slug: "sanatate", icon: "💊" },
  { name: "Cărți", slug: "carti", icon: "📚" },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    if (mobileMenu) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenu]);

  return (
    <>
      {/* Top info bar */}
      <div className="bg-foreground text-background relative z-[60]">
        <div className="container flex items-center justify-between h-8 px-4 text-[11px]">
          <div className="hidden md:flex items-center gap-4">
            <span className="flex items-center gap-1 opacity-80"><Truck className="w-3 h-3" /> Livrare gratuită peste 200 lei</span>
            <span className="flex items-center gap-1 opacity-80"><RotateCcw className="w-3 h-3" /> Retur 30 zile</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="flex items-center gap-1 opacity-80"><Headphones className="w-3 h-3" /> Suport: 0800-123-456</span>
            <button onClick={toggleDarkMode} className="opacity-70 hover:opacity-100 transition-opacity">
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-primary sticky top-0 z-50 shadow-md">
        <div className="container flex items-center h-14 md:h-16 px-4 gap-3 md:gap-5">
          {/* Hamburger mobile */}
          <button className="lg:hidden text-primary-foreground" onClick={() => setMobileMenu(true)} aria-label="Meniu">
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <span className="text-primary-foreground font-extrabold text-xl md:text-2xl tracking-tight">
              MamaLucica
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <SearchAutocomplete className="[&_input]:bg-primary-foreground [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_input]:rounded-lg [&_input]:h-10 [&_input]:border-0" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            <button
              onClick={() => navigate(user ? "/account" : "/auth")}
              className="hidden md:flex flex-col items-center px-3 text-primary-foreground/90 hover:text-primary-foreground transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{user ? "Cont" : "Login"}</span>
            </button>

            {user && (
              <Link to="/favorites" className="hidden md:flex flex-col items-center px-3 text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                <Heart className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Favorite</span>
              </Link>
            )}

            <Link to={user ? "/cart" : "/auth"} className="relative flex flex-col items-center px-3 text-primary-foreground/90 hover:text-primary-foreground transition-colors">
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-[18px] min-w-[18px] flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-1">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 hidden md:block">Coș</span>
            </Link>

            {/* Mobile search */}
            <Link to="/catalog" className="md:hidden text-primary-foreground/90 px-2">
              <Search className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Category navigation bar */}
        <div className="hidden lg:block bg-primary border-t border-primary-foreground/10">
          <div className="container flex items-center h-10 px-4">
            {/* Categories dropdown */}
            <div className="relative" onMouseEnter={() => setShowCategories(true)} onMouseLeave={() => setShowCategories(false)}>
              <button className="flex items-center gap-1.5 text-primary-foreground text-sm font-medium h-10 px-4 hover:bg-primary-foreground/10 transition-colors">
                <Menu className="w-4 h-4" />
                Categorii
                <ChevronDown className="w-3 h-3" />
              </button>
              {showCategories && (
                <div className="absolute top-full left-0 w-56 bg-card shadow-xl rounded-b-lg border border-border z-50 py-1 animate-fade-in">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/catalog?category=${cat.slug}`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-card-foreground hover:bg-muted transition-colors"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <nav className="flex items-center gap-0">
              {[
                { to: "/catalog?sort=newest", label: "Noutăți" },
                { to: "/catalog?sort=popular", label: "Populare" },
                { to: "/catalog?badge=deals", label: "🔥 Oferte" },
                { to: "/catalog", label: "Toate Produsele" },
                { to: "/povestea-noastra", label: "Despre Noi" },
                { to: "/faq", label: "Ajutor" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-primary-foreground/80 hover:text-primary-foreground text-sm px-3 h-10 flex items-center transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile search bar */}
      <div className="md:hidden bg-card px-4 py-2 border-b border-border sticky top-14 z-40">
        <SearchAutocomplete className="[&_input]:h-9 [&_input]:text-sm [&_input]:rounded-lg" />
      </div>

      {/* Mobile fullscreen overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-background transition-transform duration-300 ease-out ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <span className="font-extrabold text-xl text-foreground">MamaLucica</span>
          <button onClick={() => setMobileMenu(false)} className="text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="h-6 w-6" />
          </button>
        </div>

        {user && (
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/50">
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
                className="flex items-center gap-3 min-h-[44px] px-2 text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <span>{cat.icon}</span>
                <span className="text-sm">{cat.name}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-border mx-4" />

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
                className="flex items-center min-h-[44px] px-2 text-foreground hover:bg-muted rounded-md transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/cart"
              onClick={() => setMobileMenu(false)}
              className="flex items-center justify-between min-h-[44px] px-2 text-foreground hover:bg-muted rounded-md transition-colors text-sm"
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
        <div className="fixed inset-0 z-[99] bg-black/50" onClick={() => setMobileMenu(false)} />
      )}
    </>
  );
}
