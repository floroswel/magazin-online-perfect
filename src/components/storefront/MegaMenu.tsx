import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ArrowRight } from "lucide-react";

interface Cat {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url?: string | null;
}

export default function MegaMenu({ rootCat }: { rootCat: Cat }) {
  const [open, setOpen] = useState(false);

  const { data: subs = [] } = useQuery({
    queryKey: ["mega-subs", rootCat.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("categories")
        .select("id,name,slug,parent_id,image_url")
        .eq("parent_id", rootCat.id)
        .eq("visible", true)
        .order("display_order")
        .limit(12);
      return (data || []) as Cat[];
    },
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const { data: featured = [] } = useQuery({
    queryKey: ["mega-featured", rootCat.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("products")
        .select("id,name,slug,price,image_url")
        .eq("category_id", rootCat.id)
        .eq("visible", true)
        .eq("featured", true)
        .limit(3);
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60_000,
  });

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link to={`/categorie/${rootCat.slug}`} className="cat-icon-pill">
        <span className="text-lg" aria-hidden>🕯️</span>
        {rootCat.name}
        {subs.length > 0 && <ChevronDown className="h-3 w-3 opacity-60" />}
      </Link>

      {open && (subs.length > 0 || featured.length > 0) && (
        <div className="absolute left-0 top-full pt-2 z-50 w-[720px] max-w-[calc(100vw-2rem)]">
          <div className="bg-popover border border-border rounded-xl shadow-2xl p-6 grid grid-cols-3 gap-6">
            {/* Subcategorii */}
            <div className="col-span-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Subcategorii</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {subs.length === 0 && (
                  <Link to={`/categorie/${rootCat.slug}`} className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5 py-1">
                    Vezi toate produsele <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
                {subs.map((s) => (
                  <Link
                    key={s.id}
                    to={`/categorie/${s.slug}`}
                    className="text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5 py-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary opacity-50" />
                    {s.name}
                  </Link>
                ))}
              </div>
              <Link to={`/categorie/${rootCat.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-4">
                Vezi toate din {rootCat.name} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Produse featured */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Recomandate</div>
              <div className="space-y-2">
                {featured.length === 0 && (
                  <div className="text-xs text-muted-foreground">Niciun produs recomandat încă.</div>
                )}
                {featured.map((p: any) => (
                  <Link key={p.id} to={`/produs/${p.slug}`} className="flex items-center gap-2 group">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{Number(p.price).toFixed(2)} lei</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
