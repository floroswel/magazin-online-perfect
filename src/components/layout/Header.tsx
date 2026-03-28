import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, User, Menu, X, Sun, Moon, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenu) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenu]);

  const headerBg = isHome && !scrolled
    ? "bg-transparent"
    : "bg-background/95 backdrop-blur-md border-b border-border shadow-sm";

  const textColor = isHome && !scrolled ? "text-[#FAF6F0]" : "text-foreground";
  const mutedColor = isHome && !scrolled ? "text-[#FAF6F0]/70" : "text-muted-foreground";

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-ventuza-dark text-[#FAF6F0] relative z-[60] overflow-hidden">
        <div className="flex items-center h-9">
          <div className="animate-marquee flex items-center whitespace-nowrap gap-16 px-4">
            <span className="text-[11px] font-sans tracking-wide">Transport gratuit la comenzi peste 200 lei</span>
            <span className="text-[11px] font-sans tracking-wide opacity-40">✦</span>
            <span className="text-[11px] font-sans tracking-wide">Lumânări artizanale create în România 🕯</span>
            <span className="text-[11px] font-sans tracking-wide opacity-40">✦</span>
            <span className="text-[11px] font-sans tracking-wide">Livrare în 24-48h prin Sameday Courier</span>
            <span className="text-[11px] font-sans tracking-wide opacity-40">✦</span>
            <span className="text-[11px] font-sans tracking-wide">Transport gratuit la comenzi peste 200 lei</span>
            <span className="text-[11px] font-sans tracking-wide opacity-40">✦</span>
            <span className="text-[11px] font-sans tracking-wide">Lumânări artizanale create în România 🕯</span>
            <span className="text-[11px] font-sans tracking-wide opacity-40">✦</span>
            <span className="text-[11px] font-sans tracking-wide">Livrare în 24-48h prin Sameday Courier</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-500 ${headerBg}`}>
        <div className="container flex items-center justify-between h-[72px] md:h-[72px] px-4">
          {/* Left nav (desktop) */}
          <nav className={`hidden lg:flex items-center gap-8 flex-1 ${mutedColor}`}>
            <Link to="/catalog" className="text-[13px] font-sans font-medium tracking-wide hover:text-primary transition-colors">
              Colecții
            </Link>
            <Link to="/povestea-noastra" className="text-[13px] font-sans font-medium tracking-wide hover:text-primary transition-colors">
              Despre noi
            </Link>
            <Link to="/recenzii" className="text-[13px] font-sans font-medium tracking-wide hover:text-primary transition-colors">
              Blog
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className={`lg:hidden p-2 -ml-2 ${textColor}`}
            onClick={() => setMobileMenu(true)}
            aria-label="Meniu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Center Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 lg:flex-none">
            <span className={`font-serif text-[22px] font-light tracking-[6px] ${textColor} transition-colors`}>
              VENTUZA
            </span>
          </Link>

          {/* Right nav (desktop) */}
          <nav className={`hidden lg:flex items-center gap-8 flex-1 justify-end mr-6 ${mutedColor}`}>
            <Link to="/quiz-parfum" className="text-[13px] font-sans font-medium tracking-wide hover:text-primary transition-colors">
              Quiz Parfum
            </Link>
            <Link to="/faq" className="text-[13px] font-sans font-medium tracking-wide hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleDarkMode}
              className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors ${mutedColor}`}
              aria-label={isDark ? "Mod luminos" : "Mod întunecat"}
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors ${mutedColor}`}
              aria-label="Caută"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            {user && (
              <Link to="/favorites" className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors ${mutedColor}`}>
                <Heart className="h-[18px] w-[18px]" />
              </Link>
            )}

            <Link to={user ? "/cart" : "/auth"} className={`relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors ${mutedColor}`}>
              <ShoppingBag className="h-[18px] w-[18px]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-sans font-medium px-1 animate-bounce-count">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <Link to="/account" className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors ${mutedColor}`}>
                <User className="h-[18px] w-[18px]" />
              </Link>
            ) : (
              <Link to="/auth" className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors ${mutedColor}`}>
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
      {mobileMenu && (
        <div className="fixed inset-0 z-[100] bg-ventuza-dark flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-6 h-16">
            <span className="font-serif text-[20px] font-light tracking-[5px] text-[#FAF6F0]">VENTUZA</span>
            <button onClick={() => setMobileMenu(false)} className="text-[#FAF6F0] p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 flex flex-col items-center justify-center gap-6">
            {[
              { to: "/catalog", label: "Colecții" },
              { to: "/povestea-noastra", label: "Despre noi" },
              { to: "/quiz-parfum", label: "Quiz Parfum" },
              { to: "/personalizare", label: "Personalizare" },
              { to: "/recenzii", label: "Blog" },
              { to: "/faq", label: "Contact" },
              ...(user ? [{ to: "/account", label: "Contul meu" }, { to: "/favorites", label: "Favorite" }] : [{ to: "/auth", label: "Autentificare" }]),
              ...(isAdmin ? [{ to: "/admin", label: "Admin Panel" }] : []),
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenu(false)}
                className="text-[#FAF6F0] font-serif text-[28px] font-light tracking-wide hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => { signOut(); setMobileMenu(false); }}
                className="text-[#FAF6F0]/50 font-sans text-sm tracking-wide mt-4"
              >
                Deconectare
              </button>
            )}
          </nav>
          <div className="flex justify-center gap-3 pb-8">
            <button onClick={toggleDarkMode} className="text-[#FAF6F0]/50 p-2">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
