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
  saved_for_later?: boolean;
  gift_wrap?: boolean;
  gift_message?: string | null;
  note?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  savedItems: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  updateMeta: (productId: string, meta: Partial<Pick<CartItem, "gift_wrap" | "gift_message" | "note">>) => void;
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
        .select("product_id, quantity, saved_for_later, gift_wrap, gift_message, note, products:product_id(name, slug, image_url, price)")
        .eq("user_id", user.id);
      if (data?.length) {
        const dbItems: CartItem[] = data.map((r: any) => ({
          product_id: r.product_id,
          name: r.products?.name ?? "Produs",
          slug: r.products?.slug,
          image_url: r.products?.image_url,
          price: Number(r.products?.price ?? 0),
          quantity: r.quantity,
          saved_for_later: !!r.saved_for_later,
          gift_wrap: !!r.gift_wrap,
          gift_message: r.gift_message ?? null,
          note: r.note ?? null,
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
        next.map((i) => ({
          user_id: user.id,
          product_id: i.product_id,
          quantity: i.quantity,
          saved_for_later: !!i.saved_for_later,
          gift_wrap: !!i.gift_wrap,
          gift_message: i.gift_message ?? null,
          note: i.note ?? null,
        }))
      );
    }
  }, [user]);

  const addItem: CartContextValue["addItem"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product_id === item.product_id);
      const next = existing
        ? prev.map((p) => p.product_id === item.product_id ? { ...p, quantity: p.quantity + qty } : p)
        : [...prev, { ...item, quantity: qty, saved_for_later: false, gift_wrap: false, gift_message: null, note: null }];
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

  const saveForLater: CartContextValue["saveForLater"] = (productId) => {
    setItems((prev) => {
      const next = prev.map((p) =>
        p.product_id === productId ? { ...p, saved_for_later: true } : p
      );
      persistDb(next);
      return next;
    });
  };

  const moveToCart: CartContextValue["moveToCart"] = (productId) => {
    setItems((prev) => {
      const next = prev.map((p) =>
        p.product_id === productId ? { ...p, saved_for_later: false } : p
      );
      persistDb(next);
      return next;
    });
  };

  const updateMeta: CartContextValue["updateMeta"] = (productId, meta) => {
    setItems((prev) => {
      const next = prev.map((p) =>
        p.product_id === productId ? { ...p, ...meta } : p
      );
      persistDb(next);
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    persistDb([]);
  };

  const activeItems = items.filter((i) => !i.saved_for_later);
  const savedItems = items.filter((i) => i.saved_for_later);
  const count = activeItems.reduce((s, i) => s + i.quantity, 0);
  const subtotal = activeItems.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: activeItems,
      savedItems,
      count,
      subtotal,
      addItem, updateQty, removeItem,
      saveForLater, moveToCart, updateMeta,
      clear, open, setOpen
    }}>
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
