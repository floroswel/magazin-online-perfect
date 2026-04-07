import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Heart, ShoppingCart, User, Menu, ChevronRight, X, LogOut, Package,
  Star, Gift, Truck, Phone, Lock, RotateCcw, Flame, Sparkles, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Types ───
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  display_order: number;
  show_in_nav: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
}

// ═══════════════════════════════════════════
// LAYER 1 — TOP INFO BAR (Ticker 1 — configurable)
// ═══════════════════════════════════════════
function TopInfoBar() {
  const { header_topbar } = useEditableContent();
  const { settings: s } = useSettings();

  const ticker1Text = s.ticker1_text?.trim();
  const speed = parseInt(s.ticker1_speed || "30");
  const dir = s.ticker1_direction === "right" ? "reverse" : "normal";

  const [socialMessages, setSocialMessages] = useState<string[]>([]);
  useEffect(() => {
    if (s.ticker_social_proof_show === "true" && s.ticker_social_proof_position === "ticker1") {
      supabase.rpc("get_social_proof_messages", { limit_count: parseInt(s.ticker_social_proof_limit || "10") })
        .then(({ data }) => { if (data) setSocialMessages((data as any[]).map((r: any) => r.message)); });
    }
  }, [s.ticker_social_proof_show, s.ticker_social_proof_position, s.ticker_social_proof_limit]);

  if (s.ticker1_show !== "true" || !ticker1Text) return null;

  let displayText = ticker1Text;
  if (socialMessages.length > 0) {
    displayText = [ticker1Text, ...socialMessages.map(m => "🛒 " + m)].join("  ·  ");
  }

  return (
    <div
      className="hidden md:block border-b border-border overflow-hidden"
      style={{
        backgroundColor: s.ticker1_bg_color || undefined,
        color: s.ticker1_text_color || undefined,
      }}
    >
      <div className="h-8 flex items-center overflow-hidden">
        <div
          className="animate-marquee whitespace-nowrap flex text-[11px] font-medium"
          style={{ animationDuration: `${speed}s`, animationDirection: dir }}
        >
          <span className="px-8">{displayText}</span>
          <span className="px-8">{displayText}</span>
          <span className="px-8">{displayText}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// LAYER 2 — MAIN HEADER (Logo + Search + Icons)
// ═══════════════════════════════════════════
function MainHeader({ categories }: { categories: Category[] }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { items, totalItems, totalPrice, removeFromCart } = useCart();
  const { format } = useCurrency();
  const { settings } = useSettings();
  const isMobile = useIsMobile();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const siteName = settings.header_store_name || settings.site_name || "";
  const siteTagline = settings.header_tagline || settings.site_tagline || "";

  useEffect(() => {
    if (settings.header_store_name) {
      document.title = settings.header_store_name;
    }
    if (settings.header_favicon_url) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = settings.header_favicon_url;
    }
  }, [settings.header_store_name, settings.header_favicon_url]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setShowAccount(false);
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) setShowMiniCart(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase.rpc("search_products", { search_term: q.trim(), result_limit: 6 });
      if (data) setResults(data as SearchResult[]);
      setShowResults(true);
    }, 300);
  };

  const submitSearch = () => {
    if (query.trim()) {
      setShowResults(false);
      const params = new URLSearchParams({ search: query.trim() });
      if (selectedCat) params.set("category", selectedCat);
      navigate(`/catalog?${params.toString()}`);
    }
  };

  const parentCats = categories.filter(c => !c.parent_id && c.show_in_nav);

  return (
    <div className="bg-card border-b border-border" style={{ boxShadow: "var(--shadow-sm)", background: settings.header_bg || undefined }}>
      <div className="lumax-container flex items-center gap-4 md:gap-5 h-[60px] md:h-[70px]">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex flex-col leading-none">
          {!settings.site_name && !settings.logo_url ? (
            <div style={{ width: "120px", height: "40px" }} />
          ) : settings.logo_url && settings.logo_visible !== "false" ? (
            <img src={settings.logo_url} alt={siteName} style={{ height: "40px", objectFit: "contain" }} />
          ) : (
            <span className="text-xl md:text-2xl font-black tracking-tight text-primary">{siteName}</span>
          )}
          {(settings.site_name || settings.logo_url) && (
            <span className="text-[9px] md:text-[10px] text-muted-foreground tracking-widest uppercase">{siteTagline}</span>
          )}
        </Link>

        {/* Search bar */}
        {!isMobile && (
          <div ref={searchRef} className="relative flex-1 max-w-[600px]">
            <div className="flex border-2 border-primary rounded-md overflow-hidden h-[46px]">
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="bg-muted border-none border-r border-border px-3 min-w-[130px] text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="">Toate categoriile</option>
                {parentCats.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <input
                value={query}
                onChange={(e) => doSearch(e.target.value)}
                onFocus={() => query.length >= 2 && setShowResults(true)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Caută produse, mărci..."
                className="flex-1 px-4 text-sm outline-none bg-card text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={submitSearch}
                className="w-[52px] bg-primary hover:bg-lumax-blue-dark text-primary-foreground flex items-center justify-center transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-b-md shadow-lg z-50 max-h-[400px] overflow-y-auto">
                {results.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Niciun rezultat pentru „{query}"
                  </div>
                ) : (
                  <>
                    {results.map(r => (
                      <Link
                        key={r.id}
                        to={`/product/${r.slug}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-lumax-blue-light transition-colors"
                      >
                        <img
                          src={r.image_url || "/placeholder.svg"}
                          alt={r.name}
                          className="w-10 h-10 object-contain rounded bg-secondary flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                          <p className="text-xs font-semibold text-primary">{format(r.price)}</p>
                        </div>
                      </Link>
                    ))}
                    <button
                      onClick={submitSearch}
                      className="w-full px-4 py-2.5 text-center text-sm text-primary hover:bg-secondary transition-colors font-medium border-t border-border"
                    >
                      Vezi toate rezultatele pentru „{query}" →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right icons */}
        <div className="flex items-center gap-1 ml-auto">
          <Link to="/favorites" className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors">
            <Heart className="h-[22px] w-[22px] text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground hidden md:block">Favorite</span>
          </Link>

          <div
            ref={accountRef}
            className="relative"
            onMouseEnter={() => !isMobile && setShowAccount(true)}
            onMouseLeave={() => !isMobile && setShowAccount(false)}
          >
            <button
              onClick={() => { if (isMobile) { user ? navigate("/account") : navigate("/auth"); } else { setShowAccount(prev => !prev); } }}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <User className="h-[22px] w-[22px] text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground hidden md:block truncate max-w-[60px]">
                {user ? (user.user_metadata?.full_name?.split(" ")[0] || "Cont") : "Cont"}
              </span>
            </button>

            {showAccount && !isMobile && (
              <div className="absolute right-0 top-full w-56 bg-card border border-border rounded-lg shadow-lg z-[250] py-2 pt-3">
                {!user ? (
                  <>
                    <div className="px-4 py-2 space-y-2">
                      <Link to="/auth" className="block w-full text-center py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-lumax-blue-dark transition-colors">
                        Autentifică-te
                      </Link>
                      <Link to="/auth" className="block w-full text-center py-2 border-2 border-primary text-primary rounded-md text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
                        Creează cont
                      </Link>
                    </div>
                    <div className="border-t border-border my-1" />
                    <Link to="/account" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors">
                      <Package className="h-4 w-4" /> Comenzile mele
                    </Link>
                    <Link to="/favorites" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors">
                      <Heart className="h-4 w-4" /> Favorite
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{user.user_metadata?.full_name || "Utilizator"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border my-1" />
                    <Link to="/account" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors">
                      <User className="h-4 w-4" /> Contul meu
                    </Link>
                    <Link to="/account" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors">
                      <Package className="h-4 w-4" /> Comenzile mele
                    </Link>
                    <Link to="/favorites" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors">
                      <Heart className="h-4 w-4" /> Favorite
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { signOut(); setShowAccount(false); }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-secondary transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" /> Deconectare
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div
            ref={cartRef}
            className="relative"
            onMouseEnter={() => !isMobile && setShowMiniCart(true)}
            onMouseLeave={() => !isMobile && setShowMiniCart(false)}
          >
            <Link to="/cart" className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors relative">
              <ShoppingCart className="h-[22px] w-[22px] text-muted-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 right-0 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {totalItems}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground hidden md:block">Coș</span>
            </Link>

            {showMiniCart && !isMobile && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-xl shadow-lg z-[300] p-4">
                {items.length === 0 ? (
                  <div className="text-center py-6">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">Coșul tău este gol</p>
                    <Link to="/catalog" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-lumax-blue-dark transition-colors">
                      Descoperă produse
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold mb-3">Coșul meu ({totalItems} produse)</p>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto">
                      {items.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img src={item.product.image_url || "/placeholder.svg"} alt={item.product.name} className="w-12 h-12 object-contain rounded bg-secondary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.product.name}</p>
                            <p className="text-xs text-primary font-semibold">{item.quantity} × {format(item.product.price)}</p>
                          </div>
                          <button onClick={(e) => { e.preventDefault(); removeFromCart(item.product_id); }} className="p-1 hover:bg-secondary rounded transition-colors">
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border mt-3 pt-3">
                      <div className="flex justify-between text-sm font-bold mb-3">
                        <span>Total:</span>
                        <span>{format(totalPrice)}</span>
                      </div>
                      <Link to="/cart" className="block w-full text-center py-2 border-2 border-primary text-primary rounded-md text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors mb-2">
                        Mergi la coș
                      </Link>
                      <Link to="/checkout" className="block w-full text-center py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-lumax-blue-dark transition-colors">
                        Finalizează comanda
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// LAYER 3 — NAV BAR (blue sticky)
// ═══════════════════════════════════════════
function NavBar({ categories }: { categories: Category[] }) {
  const [megaOpen, setMegaOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { settings } = useSettings();

  if (isMobile) return null;

  const parentCats = categories.filter(c => !c.parent_id && c.show_in_nav);
  const childrenOf = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const defaultNavLinks = [
    { icon: "🔥", label: "Oferte", to: "/oferte", badge: "HOT", badge_color: "#FF3300" },
    { icon: "⭐", label: "Bestsellers", to: "/catalog?sort=bestseller", badge: "", badge_color: "" },
    { icon: "🆕", label: "Noutăți", to: "/nou", badge: "NOU", badge_color: "#00A650" },
    { icon: "🎁", label: "Cadouri", to: "/card-cadou", badge: "", badge_color: "" },
    { icon: "🚚", label: "Livrare Gratuită", to: "/catalog?free_shipping=true", badge: "", badge_color: "" },
    { icon: "📞", label: "Contact", to: "/contact", badge: "", badge_color: "" },
  ];

  const navLinks = (() => {
    try {
      const parsed = JSON.parse(settings.nav_links || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((l: any) => l.active !== false)
          .map((l: any) => ({
            icon: l.icon || "",
            label: l.label,
            to: l.url || l.to,
            badge: l.badge || "",
            badge_color: l.badge_color || "#FF3300",
          }));
      }
    } catch {}
    return defaultNavLinks;
  })();

  return (
    <div className="bg-primary sticky top-0 z-[100]" id="lumax-navbar" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.15)", background: settings.nav_bar_color || undefined }}>
      <div className="lumax-container flex items-center h-11">
        <div
          ref={megaRef}
          className="relative"
          onMouseEnter={() => setMegaOpen(true)}
          onMouseLeave={() => { setMegaOpen(false); setHoveredCat(null); }}
        >
          <button className="flex items-center gap-2 px-5 h-11 bg-lumax-blue-dark text-white text-[13px] font-semibold hover:bg-lumax-blue-darker transition-colors">
            <Menu className="h-4 w-4" />
            Toate Categoriile
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {megaOpen && (
            <div className="absolute top-11 left-0 flex z-[200]">
              <div className="w-[260px] bg-card border border-border rounded-bl-lg shadow-lg max-h-[400px] overflow-y-auto">
                {parentCats.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/catalog?category=${cat.slug}`}
                    onMouseEnter={() => setHoveredCat(cat.id)}
                    className={`flex items-center gap-3 px-4 h-11 text-sm cursor-pointer transition-colors ${
                      hoveredCat === cat.id ? "bg-lumax-blue-light text-primary" : "hover:bg-secondary"
                    }`}
                  >
                    <span className="flex-1">{cat.name}</span>
                    {childrenOf(cat.id).length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </Link>
                ))}
                {parentCats.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground text-center">Adaugă categorii din admin</div>
                )}
              </div>

              {hoveredCat && childrenOf(hoveredCat).length > 0 && (
                <div className="w-[240px] bg-card border border-l-0 border-border rounded-br-lg shadow-lg max-h-[400px] overflow-y-auto">
                  {childrenOf(hoveredCat).map(sub => (
                    <Link
                      key={sub.id}
                      to={`/catalog?category=${sub.slug}`}
                      className="block px-4 py-2.5 text-sm hover:bg-lumax-blue-light hover:text-primary transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex items-center h-11 ml-2">
          {navLinks.map((link, idx) => (
            <Link
              key={`${link.to}-${idx}`}
              to={link.to}
              className="relative flex items-center gap-1 h-11 px-3 text-[13px] font-medium text-white/90 hover:text-white transition-colors"
            >
              {link.icon && <span className="text-sm">{link.icon}</span>}
              {link.label}
              {link.badge && (
                <span
                  className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded text-white"
                  style={{ background: link.badge_color || "#FF3300" }}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// LAYER 4 — PROMO TICKER (configurable from admin)
// ═══════════════════════════════════════════
function PromoTicker() {
  const { settings: s } = useSettings();
  const [socialMessages, setSocialMessages] = useState<string[]>([]);

  // Fetch social proof messages
  useEffect(() => {
    if (s.ticker_social_proof_show !== "true") return;
    supabase.rpc("get_social_proof_messages", { limit_count: parseInt(s.ticker_social_proof_limit || "10") })
      .then(({ data }) => {
        if (data) setSocialMessages((data as any[]).map((r: any) => r.message));
      });
  }, [s.ticker_social_proof_show, s.ticker_social_proof_limit]);

  if (s.ticker2_show === "false") return null;

  const separator = ` ${s.ticker2_separator || "·"} `;
  const fixedMessages = (s.ticker2_messages || s.ticker_text || "⚡ FLASH SALE  ·  🚚 TRANSPORT GRATUIT").split("|").filter(Boolean);

  // Intercalate social proof if position is ticker2
  let allMessages = [...fixedMessages];
  if (s.ticker_social_proof_show === "true" && s.ticker_social_proof_position === "ticker2" && socialMessages.length > 0) {
    const merged: string[] = [];
    let si = 0;
    for (let i = 0; i < fixedMessages.length; i++) {
      merged.push(fixedMessages[i]);
      if (si < socialMessages.length) {
        merged.push("🛒 " + socialMessages[si++]);
      }
    }
    while (si < socialMessages.length) merged.push("🛒 " + socialMessages[si++]);
    allMessages = merged;
  }

  const text = allMessages.join(separator);
  const speed = parseInt(s.ticker2_speed || "40");
  const dir = s.ticker2_direction === "right" ? "reverse" : "normal";

  return (
    <div
      className="h-8 text-xs font-bold overflow-hidden flex items-center"
      style={{
        backgroundColor: s.ticker2_bg_color || "#FFB800",
        color: s.ticker2_text_color || "#000000",
      }}
    >
      <div
        className="animate-ticker whitespace-nowrap flex"
        style={{ animationDuration: `${speed}s`, animationDirection: dir }}
      >
        <span className="px-12">{text}</span>
        <span className="px-12">{text}</span>
        <span className="px-12">{text}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// HEADER COMPOSITE — with realtime categories
// ═══════════════════════════════════════════
export default function Header() {
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = () => {
    supabase
      .from("categories")
      .select("id, name, slug, icon, parent_id, display_order, show_in_nav")
      .eq("visible", true)
      .order("display_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  };

  useEffect(() => {
    fetchCategories();
    // Realtime: instantly update categories when admin changes them
    const channel = supabase
      .channel("header-categories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        fetchCategories();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <header>
      <TopInfoBar />
      <MainHeader categories={categories} />
      <NavBar categories={categories} />
      <PromoTicker />
    </header>
  );
}
