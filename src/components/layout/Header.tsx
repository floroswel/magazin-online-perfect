import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, Menu, X, LogOut, GitCompare, Shield, Sun, Moon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCart } from "@/hooks/useCart";
import { useComparison } from "@/hooks/useComparison";
import { Badge } from "@/components/ui/badge";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import MegaMenu from "./MegaMenu";
import LocaleSwitcher from "./LocaleSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useDarkMode } from "@/hooks/useDarkMode";
import { isCandleCollection } from "@/lib/candleCatalog";

export default function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { totalItems } = useCart();
  const { comparisonItems } = useComparison();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobileCategories, setMobileCategories] = useState<{ id: string; name: string; slug: string; parent_id: string | null }[]>([]);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.from("categories").select("id, name, slug, parent_id, show_in_nav").eq("visible", true).order("display_order").order("name").then(({ data }) => {
      setMobileCategories((((data as any[]) || []).filter((cat) => isCandleCollection(cat)) as any[]) || []);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container flex items-center justify-center py-2">
          <p className="text-xs tracking-[0.15em] uppercase font-light">
            Livrare gratuită pentru comenzi peste 200 RON · Handmade în România
          </p>
        </div>
      </div>

      {/* Main header */}
      <div className={`transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-background"} border-b border-border`}>
        <div className="container flex items-center justify-between py-3 md:py-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="font-serif text-xl md:text-3xl font-semibold tracking-[0.08em] text-foreground">
              VENTUZA
            </h1>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/catalog" className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors">
              Colecții
            </Link>
            <Link to="/personalizare" className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors">
              Personalizare
            </Link>
            <Link to="/abonament" className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors">
              Abonament
            </Link>
            <Link to="/povestea-noastra" className="text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors">
              Povestea Noastră
            </Link>
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-0.5 md:gap-1">
            <div className="hidden md:block w-56 lg:w-64">
              <SearchAutocomplete className="" />
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-foreground/70 hover:text-foreground" onClick={toggleDarkMode} aria-label={isDark ? "Mod luminos" : "Mod întunecat"}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <span className="hidden sm:inline-flex"><LocaleSwitcher /></span>

            {user ? (
              <>
                <Link to="/compare" className="relative">
                  <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                    <GitCompare className="h-4 w-4" />
                    {comparisonItems.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground rounded-full">
                        {comparisonItems.length}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link to="/favorites">
                  <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                    <Heart className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    {totalItems > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground rounded-full">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                      <Shield className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link to="/account">
                  <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="font-medium text-xs tracking-wide uppercase bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-none px-5">
                  Cont
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="lg:hidden text-foreground" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <MegaMenu />

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="lg:hidden bg-background border-b border-border">
          <div className="container py-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută lumânări..." className="pr-10 rounded-none border-foreground/20" />
                <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <nav className="space-y-1 mb-4">
              <Link to="/catalog" onClick={() => setMobileMenu(false)} className="block py-2.5 text-sm tracking-wide uppercase text-foreground border-b border-border/50">Colecții</Link>
              <Link to="/personalizare" onClick={() => setMobileMenu(false)} className="block py-2.5 text-sm tracking-wide uppercase text-foreground border-b border-border/50">Personalizare</Link>
              <Link to="/abonament" onClick={() => setMobileMenu(false)} className="block py-2.5 text-sm tracking-wide uppercase text-foreground border-b border-border/50">Abonament</Link>
              <Link to="/povestea-noastra" onClick={() => setMobileMenu(false)} className="block py-2.5 text-sm tracking-wide uppercase text-foreground border-b border-border/50">Povestea Noastră</Link>
            </nav>
            <ul className="space-y-1">
              {mobileCategories.filter(c => !c.parent_id).map(cat => {
                const children = mobileCategories.filter(c => c.parent_id === cat.id);
                const isExpanded = expandedMobileCat === cat.id;
                return (
                  <li key={cat.slug}>
                    <div className="flex items-center">
                      <Link
                        to={`/catalog?category=${cat.slug}`}
                        onClick={() => setMobileMenu(false)}
                        className="flex-1 px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {cat.name}
                      </Link>
                      {children.length > 0 && (
                        <button onClick={() => setExpandedMobileCat(isExpanded ? null : cat.id)} className="px-2 py-2">
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                    {children.length > 0 && isExpanded && (
                      <ul className="ml-4 space-y-0.5">
                        {children.map(child => (
                          <li key={child.slug}>
                            <Link
                              to={`/catalog?category=${child.slug}`}
                              onClick={() => setMobileMenu(false)}
                              className="block px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
