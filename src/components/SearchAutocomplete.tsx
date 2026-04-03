import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";


interface Suggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  brand: string | null;
  category_name: string | null;
  rank: number;
}

function highlightMatch(text: string, query: string) {
  if (!query || !text) return text;
  const words = query.trim().split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return text;
  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part)
      ? `<mark class="bg-primary/20 text-foreground rounded-sm px-0.5">${part}</mark>`
      : part
  ).join('');
}

const RECENT_KEY = "recent_searches";
function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5); } catch { return []; }
}
function addRecentSearch(q: string) {
  const recent = getRecentSearches().filter(s => s !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

const TRENDING = ["vanilie", "lavandă", "set cadou", "aromaterapie", "personalizare"];

export default function SearchAutocomplete({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { format } = useCurrency();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("search_products", {
        search_term: q.trim(),
        result_limit: 6,
      });
      if (!error && data) {
        setSuggestions((data as Suggestion[]).filter((item) => isCandleProductLike(item)));
      } else {
        setSuggestions([]);
      }
      setOpen(true);
      setLoading(false);
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addRecentSearch(query.trim());
      setOpen(false);
      navigate(`/catalog?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(prev => Math.min(prev + 1, suggestions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0 && activeIdx < suggestions.length) {
      e.preventDefault();
      goToProduct(suggestions[activeIdx].slug);
    }
  };

  const goToProduct = (slug: string) => {
    setOpen(false);
    setQuery("");
    navigate(`/product/${slug}`);
  };

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => search(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Caută în tot magazinul..."
            className="w-full pr-16 bg-card border-none h-11 rounded-lg text-foreground placeholder:text-muted-foreground placeholder:text-sm"
          />
          {query && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {query.trim().length < 3 ? (
            <div className="p-3">
              {getRecentSearches().length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Căutări recente</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getRecentSearches().map(s => (
                      <button key={s} className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => { setQuery(s); search(s); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Populare</p>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING.map(t => (
                    <button key={t} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      onClick={() => { setQuery(t); search(t); }}>
                      🔥 {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Se caută...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Niciun rezultat pentru „{query}"</div>
          ) : (
            <>
              {suggestions.map((s, idx) => (
                <button
                  key={s.id}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left ${activeIdx === idx ? "bg-muted" : ""}`}
                  onClick={() => goToProduct(s.slug)}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <img
                    src={s.image_url || "/placeholder.svg"}
                    alt={s.name}
                    className="w-10 h-10 object-contain rounded bg-muted flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-foreground truncate"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(s.name, query) }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-semibold">{format(s.price)}</span>
                      {s.brand && (
                        <span
                          className="text-xs text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: highlightMatch(s.brand, query) }}
                        />
                      )}
                      {s.category_name && (
                        <span className="text-xs text-muted-foreground">· {s.category_name}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              <button
                className={`w-full px-4 py-2.5 text-center text-sm text-primary hover:bg-muted transition-colors font-medium border-t border-border ${activeIdx === suggestions.length ? "bg-muted" : ""}`}
                onClick={handleSubmit as any}
              >
                Vezi toate rezultatele pentru „{query}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
