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

  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenu) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenu]);

  const navLinks = [
    { to: "/catalog", label: "COLECȚII" },
    { to: "/povestea-noastra", label: "DESPRE NOI" },
    { to: "/recenzii", label: "BLOG" },
    { to: "/faq", label: "CONTACT" },
  ];

  // Transparent on home, solid when scrolled or on other pages
  const isTransparent = isHome && !scrolled;
  const headerBg = isTransparent ? "bg-transparent absolute" : "bg-background shadow-sm border-b border-border sticky";
  const textColor = isTransparent ? "text-white" : "text-foreground";
  const mutedColor = isTransparent ? "text-white/70" : "text-muted-foreground";
  const logoColor = isTransparent ? "text-white" : "text-foreground";

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-foreground text-background relative z-[60]">
        <div className="flex items-center justify-center h-10 px-4">
          <p className="font-sans text-[12px] tracking-wide">
            Reduceri de sezon până la 50%.{" "}
            <Link to="/catalog" className="underline underline-offset-2 font-medium hover:opacity-80">
              Cumpără acum
            </Link>
          </p>
        </div>
      </div>

      {/* Main Header */}
      <header className={`${headerBg} top-0 left-0 right-0 z-50 transition-all duration-300`}>
        <div className="container flex items-center h-20 px-4">
          {/* Logo - LEFT aligned, large */}
          <Link to="/" className="mr-auto">
            <span className={`font-serif text-3xl md:text-4xl font-bold ${logoColor} tracking-tight leading-none`}>
              Mama Lucica
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 mr-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-sans text-[12px] font-medium tracking-[1.5px] transition-colors hover:opacity-70 ${
                  location.pathname === link.to ? (isTransparent ? "text-white" : "text-primary") : textColor
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigate(user ? "/account" : "/auth")}
              className={`hidden lg:flex w-10 h-10 items-center justify-center hover:opacity-70 transition-opacity ${mutedColor}`}
              aria-label="Cont"
            >
              <User className="h-5 w-5" />
            </button>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity ${mutedColor}`}
              aria-label="Caută"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              onClick={toggleDarkMode}
              className={`hidden sm:flex w-10 h-10 items-center justify-center hover:opacity-70 transition-opacity ${mutedColor}`}
              aria-label={isDark ? "Mod luminos" : "Mod întunecat"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user && (
              <Link to="/favorites" className={`hidden sm:flex w-10 h-10 items-center justify-center hover:opacity-70 transition-opacity ${mutedColor}`}>
                <Heart className="h-5 w-5" />
              </Link>
            )}

            <Link to={user ? "/cart" : "/auth"} className={`relative w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity ${mutedColor}`}>
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0 h-[18px] min-w-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-sans font-medium px-1 animate-bounce-count">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              className={`lg:hidden w-10 h-10 flex items-center justify-center ${textColor}`}
              onClick={() => setMobileMenu(true)}
              aria-label="Meniu"
            >
              <Menu className="h-6 w-6" />
            </button>
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
          <span className="font-serif text-2xl font-bold text-foreground">Mama Lucica</span>
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
            { to: "/", label: "Acasă" },
            ...navLinks.map(l => ({ ...l, label: l.label.charAt(0) + l.label.slice(1).toLowerCase() })),
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
                className={`flex items-center text-foreground text-lg font-light min-h-[52px] px-3 transition-colors ${isActive ? "text-primary font-medium" : "hover:bg-muted"}`}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            to="/cart"
            onClick={() => setMobileMenu(false)}
            className="flex items-center justify-between text-foreground text-lg font-light min-h-[52px] px-3 hover:bg-muted mt-1"
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
