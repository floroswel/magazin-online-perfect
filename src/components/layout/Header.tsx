import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, Menu, X, LogOut, GitCompare, Award, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCart } from "@/hooks/useCart";
import { useComparison } from "@/hooks/useComparison";
import { Badge } from "@/components/ui/badge";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useComparison } from "@/hooks/useComparison";
import { Badge } from "@/components/ui/badge";

const categories = [
  { name: "Telefoane", slug: "telefoane" },
  { name: "Laptopuri", slug: "laptopuri" },
  { name: "TV", slug: "tv" },
  { name: "Electrocasnice", slug: "electrocasnice" },
  { name: "Casă & Grădină", slug: "casa-gradina" },
  { name: "Fashion", slug: "fashion" },
  { name: "Sport", slug: "sport" },
  { name: "Gaming", slug: "gaming" },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { totalItems } = useCart();
  const { comparisonItems } = useComparison();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar — dark blue */}
      <div className="emag-header-gradient">
        <div className="container flex items-center gap-4 py-3">
          <Link to="/" className="flex-shrink-0 text-2xl font-bold text-white">
            🛒 MegaShop
          </Link>

          <SearchAutocomplete className="hidden md:block flex-1 max-w-2xl" />

          <div className="flex items-center gap-1 ml-auto">
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

      {/* Trust badges bar */}
      <div className="emag-trust-bar">
        <div className="container py-2 flex items-center justify-center gap-8 text-white text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emag-yellow" />
            <span className="font-medium">Produse Garantate</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emag-yellow" />
            <span className="font-medium">Livrare Gratuită peste 200 lei</span>
          </div>
        </div>
      </div>

      {/* Categories nav */}
      <nav className="bg-card border-b shadow-sm">
        <div className="container">
          <ul className="hidden md:flex items-center gap-1 py-1 overflow-x-auto">
            {categories.map(cat => (
              <li key={cat.slug}>
                <Link
                  to={`/catalog?category=${cat.slug}`}
                  className="block px-3 py-2 text-sm font-medium text-foreground hover:text-primary rounded-md hover:bg-muted transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

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
              {categories.map(cat => (
                <li key={cat.slug}>
                  <Link
                    to={`/catalog?category=${cat.slug}`}
                    onClick={() => setMobileMenu(false)}
                    className="block px-3 py-2 text-sm font-medium hover:bg-muted rounded-md"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
