import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CartItem {
  product_id: string;
  name: string;
  slug?: string;
  image_url?: string | null;
  price: number;
  quantity: number;
  burn_time_hours?: number | null;
  weight_grams?: number | null;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ml_cart_v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  // Sync DB → local on login
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("cart_items")
        .select("product_id, quantity, products:product_id(name, slug, image_url, price, burn_time_hours, weight_grams)")
        .eq("user_id", user.id);
      if (data?.length) {
        const dbItems: CartItem[] = data.map((r: any) => ({
          product_id: r.product_id,
          name: r.products?.name ?? "Produs",
          slug: r.products?.slug,
          image_url: r.products?.image_url,
          price: Number(r.products?.price ?? 0),
          quantity: r.quantity,
          burn_time_hours: r.products?.burn_time_hours,
          weight_grams: r.products?.weight_grams,
        }));
        setItems((local) => mergeCarts(local, dbItems));
      }
    })();
  }, [user]);

  const persistDb = useCallback(async (next: CartItem[]) => {
    if (!user) return;
    await (supabase as any).from("cart_items").delete().eq("user_id", user.id);
    if (next.length) {
      await (supabase as any).from("cart_items").insert(
        next.map((i) => ({ user_id: user.id, product_id: i.product_id, quantity: i.quantity }))
      );
    }
  }, [user]);

  const addItem: CartContextValue["addItem"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product_id === item.product_id);
      const next = existing
        ? prev.map((p) => p.product_id === item.product_id ? { ...p, quantity: p.quantity + qty } : p)
        : [...prev, { ...item, quantity: qty }];
      persistDb(next);
      return next;
    });
  };

  const updateQty: CartContextValue["updateQty"] = (productId, qty) => {
    setItems((prev) => {
      const next = qty <= 0
        ? prev.filter((p) => p.product_id !== productId)
        : prev.map((p) => p.product_id === productId ? { ...p, quantity: qty } : p);
      persistDb(next);
      return next;
    });
  };

  const removeItem: CartContextValue["removeItem"] = (productId) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.product_id !== productId);
      persistDb(next);
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    persistDb([]);
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, addItem, updateQty, removeItem, clear, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

function mergeCarts(local: CartItem[], remote: CartItem[]): CartItem[] {
  const byId = new Map<string, CartItem>();
  remote.forEach((r) => byId.set(r.product_id, r));
  local.forEach((l) => {
    const existing = byId.get(l.product_id);
    byId.set(l.product_id, existing ? { ...existing, quantity: Math.max(existing.quantity, l.quantity) } : l);
  });
  return Array.from(byId.values());
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
