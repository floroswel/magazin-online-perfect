import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

const ICONS: Record<string, string> = {
  lumanari: "🕯", recipiente: "⬡", cadouri: "🎁", personalizate: "✨",
  florale: "🌸", sezoniere: "🍂", electronice: "⚡", diverse: "📦",
};

export default function CategoryGrid() {
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-grid"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, icon, image_url, visible")
        .eq("visible", true)
        .order("display_order", { ascending: true })
        .limit(8);
      return data || [];
    },
    staleTime: 0,
  });

  // Realtime: instantly update when categories change
  useEffect(() => {
    const channel = supabase
      .channel("categories-grid-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        queryClient.invalidateQueries({ queryKey: ["categories-grid"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <section className="bg-card py-6">
      <div className="ml-container">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">{settings.categories_title || "🗂 Categoriile Noastre"}</h2>
          <Link to="/catalog" className="text-primary text-[13px] font-medium hover:underline">
            Vezi toate →
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center p-4">
                  <Skeleton className="w-16 h-16 rounded-full mb-2" />
                  <Skeleton className="w-14 h-3" />
                </div>
              ))
            : categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalog?category=${cat.slug}`}
                  className="group flex flex-col items-center p-3 md:p-4 rounded-xl hover:bg-ml-primary-light transition-colors"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-ml-primary-light flex items-center justify-center text-2xl md:text-3xl mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {cat.icon || ICONS[cat.slug] || "📦"}
                  </div>
                  <span className="text-[11px] md:text-xs font-semibold text-foreground text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
