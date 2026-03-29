import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, User, Menu, X, Sun, Moon, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCart } from "@/hooks/useCart";
import { useDarkMode } from "@/hooks/useDarkMode";
import SearchAutocomplete from "@/components/SearchAutocomplete";

export default function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenu) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenu]);

  const navLinks = [
    { to: "/", label: "Acasă" },
    { to: "/catalog", label: "Colecții" },
    { to: "/povestea-noastra", label: "Despre noi" },
    { to: "/recenzii", label: "Blog" },
    { to: "/faq", label: "Contact" },
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-foreground text-background relative z-[60] overflow-hidden">
        <div className="flex items-center h-9">
          <div className="animate-marquee flex items-center whitespace-nowrap gap-12 px-4">
            {[
              "Transport gratuit peste 200 lei",
              "Livrare 24-48h",
              "Retururi gratuite 30 zile",
              "Transport gratuit peste 200 lei",
              "Livrare 24-48h",
              "Retururi gratuite 30 zile",
            ].map((text, i) => (
              <span key={i} className="flex items-center gap-12">
                <span className="font-sans text-[11px] tracking-wide">{text}</span>
                {i < 5 && <span className="text-[11px] opacity-30">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 bg-background ${scrolled ? "shadow-sm border-b border-border" : ""}`}>
        <div className="container flex items-center justify-between h-16 md:h-[72px] px-4">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 -ml-2 text-foreground"
            onClick={() => setMobileMenu(true)}
            aria-label="Meniu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="lg:mr-12">
            <span className="font-serif text-xl md:text-2xl font-semibold text-foreground tracking-wide">
              Mama Lucica
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-sans text-[13px] font-medium tracking-wide transition-colors hover:text-primary ${
                  location.pathname === link.to ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleDarkMode}
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
              aria-label={isDark ? "Mod luminos" : "Mod întunecat"}
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Caută"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            {user && (
              <Link to="/favorites" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
                <Heart className="h-[18px] w-[18px]" />
              </Link>
            )}

            <Link to={user ? "/cart" : "/auth"} className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-sans font-medium px-1 animate-bounce-count">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <Link to="/account" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
                <User className="h-[18px] w-[18px]" />
              </Link>
            ) : (
              <Link to="/auth" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground">
                <User className="h-[18px] w-[18px]" />
              </Link>
            )}
          </div>
        </div>

        {/* Search dropdown */}
        {showSearch && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 animate-fade-in">
            <div className="container max-w-lg mx-auto">
              <SearchAutocomplete className="" />
            </div>
          </div>
        )}
      </header>

      {/* Mobile fullscreen overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-background transition-transform duration-300 ease-out ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}
        style={{ willChange: "transform" }}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <span className="font-serif text-xl font-semibold text-foreground">Mama Lucica</span>
          <button onClick={() => setMobileMenu(false)} className="text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="h-6 w-6" />
          </button>
        </div>

        {user && (
          <div className="px-6 py-3 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {(user.email || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium truncate">{user.email}</p>
              <Link to="/account" onClick={() => setMobileMenu(false)} className="text-primary text-xs">Contul meu →</Link>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          {[
            ...navLinks,
            { to: "/personalizare", label: "Personalizare" },
            ...(user ? [{ to: "/account", label: "Contul meu" }, { to: "/favorites", label: "Favorite" }] : [{ to: "/auth", label: "Autentificare" }]),
            ...(isAdmin ? [{ to: "/admin", label: "Admin Panel" }] : []),
          ].map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenu(false)}
                className={`flex items-center text-foreground text-lg font-light min-h-[52px] px-3 rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            to="/cart"
            onClick={() => setMobileMenu(false)}
            className="flex items-center justify-between text-foreground text-lg font-light min-h-[52px] px-3 rounded-lg hover:bg-muted mt-1"
          >
            <span>Coș</span>
            {totalItems > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">{totalItems}</Badge>
            )}
          </Link>
        </nav>

        <div className="px-6 pb-6 space-y-3">
          {user && (
            <button
              onClick={() => { signOut(); setMobileMenu(false); }}
              className="text-muted-foreground font-sans text-sm w-full text-left min-h-[44px]"
            >
              Deconectare
            </button>
          )}
          <div className="flex justify-center gap-3 pt-2 border-t border-border">
            <button onClick={toggleDarkMode} className="text-muted-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenu && (
        <div className="fixed inset-0 z-[99] bg-black/50" onClick={() => setMobileMenu(false)} />
      )}
    </>
  );
}
