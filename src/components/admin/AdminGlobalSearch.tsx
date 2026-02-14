import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, FolderTree, ShoppingCart, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "product" | "order" | "category";
  path: string;
}

const typeIcons = {
  product: Package,
  order: ShoppingCart,
  category: FolderTree,
};

const typeLabels = {
  product: "Produs",
  order: "Comandă",
  category: "Categorie",
};

const typeBg = {
  product: "bg-purple-100 text-purple-700",
  order: "bg-blue-100 text-blue-700",
  category: "bg-green-100 text-green-700",
};

export default function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);

    const like = `%${q}%`;

    const [prodRes, catRes, ordRes] = await Promise.all([
      supabase.from("products").select("id, name, brand, price, slug").ilike("name", like).limit(5),
      supabase.from("categories").select("id, name, slug, icon").ilike("name", like).limit(5),
      supabase.from("orders").select("id, user_email, total, status, created_at").or(`user_email.ilike.${like},id.ilike.${like}`).limit(5),
    ]);

    const items: SearchResult[] = [];

    (prodRes.data || []).forEach((p: any) =>
      items.push({
        id: p.id, type: "product",
        title: p.name,
        subtitle: `${p.brand || "—"} · ${Number(p.price).toFixed(0)} RON`,
        path: "/admin/products",
      })
    );

    (catRes.data || []).forEach((c: any) =>
      items.push({
        id: c.id, type: "category",
        title: `${c.icon || "📁"} ${c.name}`,
        subtitle: c.slug,
        path: "/admin/categories",
      })
    );

    (ordRes.data || []).forEach((o: any) =>
      items.push({
        id: o.id, type: "order",
        title: `#${o.id.slice(0, 8)} — ${o.user_email || "Client necunoscut"}`,
        subtitle: `${Number(o.total).toFixed(0)} RON · ${format(new Date(o.created_at), "dd MMM yyyy", { locale: ro })}`,
        path: "/admin/orders",
      })
    );

    setResults(items);
    setSelectedIdx(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) {
      navigate(results[selectedIdx].path);
      setOpen(false);
      setQuery("");
    }
  };

  const selectResult = (r: SearchResult) => {
    navigate(r.path);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.length >= 2) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Caută produse, comenzi, categorii... (Ctrl+K)"
          className="pl-9 pr-9 h-10 bg-muted/50 border-none focus-visible:ring-1"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Se caută...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Niciun rezultat pentru „{query}"</div>
          ) : (
            <div className="py-1">
              {results.map((r, i) => {
                const Icon = typeIcons[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => selectResult(r)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      i === selectedIdx ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", typeBg[r.type])}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase shrink-0">
                      {typeLabels[r.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
