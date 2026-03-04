import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, Menu, X, LogOut, GitCompare, Award, Shield, Phone, Truck, Zap, Star, Clock, Gift, RotateCcw, Percent, Sun, Moon, ChevronDown } from "lucide-react";
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
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { useDarkMode } from "@/hooks/useDarkMode";

interface TrustBarItem { icon: string; text: string; link: string }

const IconMap: Record<string, any> = {
  phone: Phone, shield: Shield, truck: Truck, zap: Zap,
  rotate: RotateCcw, star: Star, heart: Heart, gift: Gift,
  clock: Clock, percent: Percent,
};

export default function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { totalItems } = useCart();
  const { comparisonItems } = useComparison();
  const navigate = useNavigate();
  const branding = useStoreBranding();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobileCategories, setMobileCategories] = useState<{ id: string; name: string; slug: string; parent_id: string | null }[]>([]);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);
  const [trustBar, setTrustBar] = useState<TrustBarItem[]>([
    { icon: "phone", text: "0800 123 456", link: "tel:0800123456" },
    { icon: "shield", text: "Produse Garantate", link: "" },
    { icon: "truck", text: "Livrare Gratuită peste 200 lei", link: "" },
  ]);

  useEffect(() => {
    supabase.from("categories").select("id, name, slug, parent_id, show_in_nav").eq("visible", true).order("display_order").order("name").then(({ data }) => {
      setMobileCategories((data as any[]) || []);
    });
    supabase.from("app_settings").select("key, value_json")
      .in("key", ["header_trust_bar"])
      .then(({ data }) => {
        data?.forEach((row) => {
          if (row.key === "header_trust_bar" && Array.isArray(row.value_json)) setTrustBar(row.value_json as unknown as TrustBarItem[]);
        });
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="emag-header-gradient">
        <div className="container flex items-center gap-4 py-3">
          <Link to="/" className="flex-shrink-0 text-2xl font-bold text-white">
            {branding.emoji} {branding.name}
          </Link>

           <SearchAutocomplete className="hidden md:block flex-1 max-w-2xl" />

           <div className="flex items-center gap-1 ml-auto">
             <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10" onClick={toggleDarkMode} aria-label={isDark ? "Mod luminos" : "Mod întunecat"}>
               {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
             </Button>
             <LocaleSwitcher />
            {user ? (
              <>
                <Link to="/compare" className="relative">
                  <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10">
                    <GitCompare className="h-5 w-5" />
                    {comparisonItems.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                        {comparisonItems.length}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link to="/favorites">
                  <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10">
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10">
                      <Shield className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link to="/account">
                  <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="text-white/90 hover:text-white hover:bg-white/10" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                  Autentificare
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Trust badges bar — dynamic */}
      <div className="emag-trust-bar">
        <div className="container py-2 flex items-center justify-center gap-8 text-white text-sm">
          {trustBar.map((item, i) => {
            const Ico = IconMap[item.icon] || Shield;
            const content = (
              <div className="flex items-center gap-2">
                <Ico className="h-4 w-4 text-emag-yellow" />
                <span className="font-medium">{item.text}</span>
              </div>
            );
            return item.link ? (
              <a key={i} href={item.link} className="hover:text-emag-yellow transition-colors hidden sm:flex items-center gap-2 first:flex">
                {content}
              </a>
            ) : (
              <div key={i} className="hidden sm:flex items-center gap-2 first:flex">{content}</div>
            );
          })}
        </div>
      </div>

      <MegaMenu />

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="md:hidden bg-card border-b shadow-lg">
          <div className="container py-3">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută produse..." className="pr-10" />
                <Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1 h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
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
                        className="flex-1 px-3 py-2 text-sm font-medium hover:bg-muted rounded-md"
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
                              className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
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
