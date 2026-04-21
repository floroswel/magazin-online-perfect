import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ChevronRight } from "lucide-react";

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

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        to={`/categorie/${rootCat.slug}`}
        className="inline-flex items-center gap-1 h-[42px] px-4 text-[12px] font-bold uppercase tracking-wide text-gray-300 hover:text-white transition-colors whitespace-nowrap"
        onMouseEnter={e => e.currentTarget.style.background = "var(--btn-primary-bg, #141414)"}
        onMouseLeave={e => e.currentTarget.style.background = ""}
      >
        {rootCat.name}
      </Link>

      {open && subs.length > 0 && (
        <div className="absolute left-0 top-full z-50 w-[500px] max-w-[calc(100vw-2rem)]">
          <div className="bg-white border border-gray-200 shadow-2xl p-5 rounded-b-lg">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-3">Subcategorii</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {subs.map((s) => (
                <Link key={s.id} to={`/categorie/${s.slug}`} className="text-sm text-gray-700 transition-colors py-1" onMouseEnter={e => e.currentTarget.style.color = "var(--btn-primary-bg, #141414)"} onMouseLeave={e => e.currentTarget.style.color = ""}>
                  {s.name}
                </Link>
              ))}
            </div>
            <Link to={`/categorie/${rootCat.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold hover:underline mt-4" style={{ color: "var(--btn-primary-bg, #141414)" }}>
              Vezi toate din {rootCat.name} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
