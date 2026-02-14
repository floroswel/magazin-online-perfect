import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export function useComparison() {
  const { user } = useAuth();
  const [comparisonItems, setComparisonItems] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComparison = useCallback(async () => {
    if (!user) { setComparisonItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("comparison_lists")
      .select("*, product:products(*)")
      .eq("user_id", user.id);
    setComparisonItems((data || []).map((d: any) => d.product).filter(Boolean));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchComparison(); }, [fetchComparison]);

  const addToComparison = async (productId: string) => {
    if (!user) { toast.error("Autentifică-te mai întâi"); return; }
    if (comparisonItems.length >= 4) { toast.error("Poți compara maximum 4 produse"); return; }
    if (comparisonItems.find(p => p.id === productId)) { toast.info("Produsul este deja în comparare"); return; }
    await supabase.from("comparison_lists").insert({ user_id: user.id, product_id: productId });
    await fetchComparison();
    toast.success("Adăugat la comparare!");
  };

  const removeFromComparison = async (productId: string) => {
    if (!user) return;
    await supabase.from("comparison_lists").delete().eq("user_id", user.id).eq("product_id", productId);
    await fetchComparison();
  };

  const clearComparison = async () => {
    if (!user) return;
    await supabase.from("comparison_lists").delete().eq("user_id", user.id);
    setComparisonItems([]);
  };

  const isInComparison = (productId: string) => comparisonItems.some(p => p.id === productId);

  return { comparisonItems, loading, addToComparison, removeFromComparison, clearComparison, isInComparison };
}
