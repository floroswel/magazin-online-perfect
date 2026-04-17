import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FavoritesContextValue {
  ids: Set<string>;
  count: number;
  toggle: (productId: string) => void;
  isFav: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "ml_favorites_v2";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids))); } catch { /* ignore */ }
  }, [ids]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("favorites")
        .select("product_id")
        .eq("user_id", user.id);
      if (data?.length) {
        setIds((prev) => {
          const merged = new Set(prev);
          data.forEach((r: any) => merged.add(r.product_id));
          return merged;
        });
      }
    })();
  }, [user]);

  const toggle = useCallback((productId: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        if (user) (supabase as any).from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
      } else {
        next.add(productId);
        if (user) (supabase as any).from("favorites").insert({ user_id: user.id, product_id: productId });
      }
      return next;
    });
  }, [user]);

  return (
    <FavoritesContext.Provider value={{ ids, count: ids.size, toggle, isFav: (id) => ids.has(id) }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
