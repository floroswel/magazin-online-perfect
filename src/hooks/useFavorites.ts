import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Favorite IDs synced with Supabase `favorites` (same behavior as ProductCard).
 */
export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    const { data } = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
    setFavoriteIds(new Set((data || []).map((r) => r.product_id)));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        toast.error("Autentifică-te pentru a salva la favorite");
        return;
      }
      const was = favoriteIds.has(productId);
      if (was) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
        setFavoriteIds((prev) => {
          const n = new Set(prev);
          n.delete(productId);
          return n;
        });
        toast.success("Eliminat din favorite");
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
        setFavoriteIds((prev) => new Set(prev).add(productId));
        toast.success("Adăugat la favorite");
      }
    },
    [user, favoriteIds]
  );

  return { isFavorite, toggleFavorite, refresh };
}
