import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

/**
 * Prefetch product detail data on hover.
 * Prefetch category products on hover.
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchProduct = useCallback((slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ["product-prefetch", slug],
      queryFn: async () => {
        const { data } = await supabase
          .from("products")
          .select("id, name, slug, price, image_url, description, short_description, stock")
          .eq("slug", slug)
          .maybeSingle();
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 min
    });
  }, [queryClient]);

  const prefetchCategory = useCallback((categorySlug: string) => {
    queryClient.prefetchQuery({
      queryKey: ["category-prefetch", categorySlug],
      queryFn: async () => {
        const { data } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("slug", categorySlug)
          .maybeSingle();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return { prefetchProduct, prefetchCategory };
}
