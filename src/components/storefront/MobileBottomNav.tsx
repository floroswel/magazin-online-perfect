import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";

export default function MobileBottomNav() {
  const { count: cartCount, setOpen: setCartOpen } = useCart();
  const { count: favCount } = useFavorites();
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (p: string) => location.pathname === p;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border h-14 flex items-stretch shadow-editorial">
      <Link to="/" className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive("/") ? "text-accent" : "text-muted-foreground"}`}>
        <Home className="h-5 w-5" />
        <span className="font-medium">Acasă</span>
      </Link>
      <Link to="/catalog" className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive("/catalog") ? "text-accent" : "text-muted-foreground"}`}>
        <Search className="h-5 w-5" />
        <span className="font-medium">Catalog</span>
      </Link>
      <Link to="/favorite" className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive("/favorite") ? "text-accent" : "text-muted-foreground"}`}>
        <Heart className="h-5 w-5" />
        {favCount > 0 && <span className="absolute top-2 right-1/4 bg-accent text-accent-foreground text-[9px] font-bold rounded-full h-3.5 min-w-3.5 px-1 flex items-center justify-center">{favCount}</span>}
        <span className="font-medium">Favorite</span>
      </Link>
      <button onClick={() => setCartOpen(true)} className="relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
        <ShoppingBag className="h-5 w-5" />
        {cartCount > 0 && <span className="absolute top-2 right-1/4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-3.5 min-w-3.5 px-1 flex items-center justify-center">{cartCount}</span>}
        <span className="font-medium">Coș</span>
      </button>
      <Link to={user ? "/account" : "/auth"} className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] ${isActive("/account") || isActive("/auth") ? "text-accent" : "text-muted-foreground"}`}>
        <User className="h-5 w-5" />
        <span className="font-medium">{user ? "Cont" : "Login"}</span>
      </Link>
    </nav>
  );
}
