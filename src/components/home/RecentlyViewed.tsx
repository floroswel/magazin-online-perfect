import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";

const STORAGE_KEY = "lumax_recently_viewed";

export function addRecentlyViewed(productId: string) {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const updated = [productId, ...ids.filter((id) => id !== productId)].slice(0, 8);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export default function RecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {}
  }, []);

  const { data: products } = useQuery({
    queryKey: ["recently-viewed", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);
      if (!data) return [];
      return ids.map((id) => data.find((p) => p.id === id)).filter(Boolean) as any[];
    },
  });

  if (!products || products.length === 0) return null;

  return (
    <section className="bg-card py-6">
      <div className="lumax-container">
        <h2 className="section-title">👁 Vizualizate Recent</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {products.map((p: any) => (
            <div key={p.id} className="flex-shrink-0 w-[200px] md:w-[220px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
