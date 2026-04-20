import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Package, Tag, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  type: "product" | "category" | "brand";
  id: string;
  label: string;
  slug?: string;
  price?: number;
  image_url?: string | null;
}

const RECENT_KEY = "ml_recent_searches";

export default function SearchAutocomplete({ placeholder }: { placeholder?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw).slice(0, 5));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const term = `%${q.trim()}%`;
      const [prods, cats, brs] = await Promise.all([
        (supabase as any).from("products").select("id,name,slug,price,image_url").ilike("name", term).eq("visible", true).limit(6),
        (supabase as any).from("categories").select("id,name,slug").ilike("name", term).limit(3),
        (supabase as any).from("brands").select("id,name,slug").ilike("name", term).limit(3),
      ]);
      const out: Suggestion[] = [
        ...(prods.data || []).map((p: any) => ({ type: "product" as const, id: p.id, label: p.name, slug: p.slug, price: Number(p.price), image_url: p.image_url })),
        ...(cats.data || []).map((c: any) => ({ type: "category" as const, id: c.id, label: c.name, slug: c.slug })),
        ...(brs.data || []).map((b: any) => ({ type: "brand" as const, id: b.id, label: b.name, slug: b.slug })),
      ];
      setResults(out);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    saveRecent(q.trim());
    setOpen(false);
    navigate(`/cautare?q=${encodeURIComponent(q.trim())}`);
  };

  const goTo = (s: Suggestion) => {
    saveRecent(s.label);
    setOpen(false);
    setQ("");
    if (s.type === "product") navigate(`/produs/${s.slug}`);
    else if (s.type === "category") navigate(`/categorie/${s.slug}`);
    else navigate(`/cautare?q=${encodeURIComponent(s.label)}`);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={submit}>
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder || "Caută..."}
            className="search-pill"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} className="absolute right-24 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label="Șterge">
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 h-9 bg-primary text-primary-foreground text-xs font-semibold rounded-full uppercase tracking-wide hover:bg-primary/90 transition-colors">
            Caută
          </button>
        </div>
      </form>

      {open && (q.trim().length >= 2 || recent.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
          {q.trim().length < 2 && recent.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground px-2 pb-2 font-semibold">
                <TrendingUp className="h-3 w-3" /> Căutări recente
              </div>
              {recent.map((r) => (
                <button key={r} type="button" onClick={() => { setQ(r); }} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" /> {r}
                </button>
              ))}
            </div>
          )}

          {q.trim().length >= 2 && (
            <div className="p-3 space-y-1">
              {loading && <div className="px-3 py-4 text-sm text-muted-foreground text-center">Se caută...</div>}
              {!loading && results.length === 0 && <div className="px-3 py-4 text-sm text-muted-foreground text-center">Niciun rezultat pentru „{q}"</div>}
              {!loading && results.map((s) => (
                <button key={`${s.type}-${s.id}`} type="button" onClick={() => goTo(s)} className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg transition-colors flex items-center gap-3">
                  {s.type === "product" ? (
                    s.image_url ? <img src={s.image_url} alt="" className="w-10 h-10 rounded object-cover bg-muted shrink-0" /> : <div className="w-10 h-10 rounded bg-muted shrink-0 flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                  ) : s.type === "category" ? (
                    <div className="w-10 h-10 rounded bg-secondary shrink-0 flex items-center justify-center"><Tag className="h-4 w-4 text-primary" /></div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-secondary shrink-0 flex items-center justify-center"><Award className="h-4 w-4 text-primary" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">
                      {s.type === "product" ? `Produs · ${s.price?.toFixed(2)} lei` : s.type === "category" ? "Categorie" : "Brand"}
                    </div>
                  </div>
                </button>
              ))}
              {!loading && results.length > 0 && (
                <button type="button" onClick={(e) => submit(e as any)} className="w-full text-center px-3 py-2.5 text-xs font-semibold text-primary hover:bg-secondary rounded-lg transition-colors border-t border-border mt-2">
                  Vezi toate rezultatele pentru „{q}" →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
