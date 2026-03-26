import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Hook that resolves the preferential price for a product
 * based on the logged-in customer's group memberships and active price lists.
 *
 * Returns { preferentialPrice, loading }
 * - preferentialPrice is null when no list applies (use standard price)
 */
export function usePriceList(productId: string | undefined) {
  const { user } = useAuth();

  const { data: preferentialPrice = null, isLoading } = useQuery({
    queryKey: ["preferential-price", productId, user?.id],
    queryFn: async () => {
      if (!user || !productId) return null;

      // 1. Check if module is enabled
      const { data: setting } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "price_lists_enabled")
        .maybeSingle();
      if (!setting || setting.value_json !== true) return null;

      // 2. Get user's group memberships
      const { data: memberships } = await supabase
        .from("customer_group_members")
        .select("group_id")
        .eq("user_id", user.id);
      if (!memberships || memberships.length === 0) return null;

      const groupIds = memberships.map((m) => m.group_id);

      // 3. Get active price lists for those groups
      const { data: plGroups } = await supabase
        .from("price_list_groups" as any)
        .select("price_list_id")
        .in("customer_group_id", groupIds);
      if (!plGroups || (plGroups as any[]).length === 0) return null;

      const listIds = [...new Set((plGroups as any[]).map((g: any) => g.price_list_id))];

      // 4. Filter active lists within validity
      const today = new Date().toISOString().split("T")[0];
      const { data: activeLists } = await supabase
        .from("price_lists" as any)
        .select("id")
        .in("id", listIds)
        .eq("status", "active")
        .or(`valid_from.is.null,valid_from.lte.${today}`)
        .or(`valid_to.is.null,valid_to.gte.${today}`);
      if (!activeLists || (activeLists as any[]).length === 0) return null;

      const activeListIds = (activeLists as any[]).map((l: any) => l.id);

      // 5. Get lowest preferential price for this product
      const { data: priceItems } = await supabase
        .from("price_list_items" as any)
        .select("preferential_price")
        .in("price_list_id", activeListIds)
        .eq("product_id", productId);
      if (!priceItems || (priceItems as any[]).length === 0) return null;

      const prices = (priceItems as any[]).map((p: any) => p.preferential_price);
      return Math.min(...prices);
    },
    enabled: !!user && !!productId,
    staleTime: 120_000,
  });

  return { preferentialPrice, loading: isLoading };
}
