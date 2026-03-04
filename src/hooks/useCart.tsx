import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Tables<"products">;
}

interface LocalCartItem {
  product_id: string;
  quantity: number;
}

const GUEST_CART_KEY = "guest_cart";

function getGuestCart(): LocalCartItem[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
  } catch { return []; }
}

function setGuestCart(items: LocalCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCartStorage() {
  localStorage.removeItem(GUEST_CART_KEY);
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, qty?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch products for guest cart items
  const hydrateGuestCart = useCallback(async () => {
    const local = getGuestCart();
    if (local.length === 0) { setItems([]); return; }
    const ids = local.map(i => i.product_id);
    const { data: products } = await supabase.from("products").select("*").in("id", ids);
    if (!products) { setItems([]); return; }
    const hydrated: CartItem[] = local.map(li => {
      const product = products.find(p => p.id === li.product_id);
      if (!product) return null;
      return { id: `guest-${li.product_id}`, product_id: li.product_id, quantity: li.quantity, product };
    }).filter(Boolean) as CartItem[];
    setItems(hydrated);
  }, []);

  // Sync guest cart to DB on login
  const syncGuestCartToDb = useCallback(async (userId: string) => {
    const local = getGuestCart();
    if (local.length === 0) return;
    for (const li of local) {
      const { data: existing } = await supabase.from("cart_items")
        .select("quantity").eq("user_id", userId).eq("product_id", li.product_id).maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + li.quantity })
          .eq("user_id", userId).eq("product_id", li.product_id);
      } else {
        await supabase.from("cart_items").insert({ user_id: userId, product_id: li.product_id, quantity: li.quantity });
      }
    }
    clearGuestCartStorage();
  }, []);

  const fetchDbCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // First sync any guest cart items
    await syncGuestCartToDb(user.id);
    const { data } = await supabase
      .from("cart_items")
      .select("*, product:products(*)")
      .eq("user_id", user.id);
    if (data) {
      setItems(data.map((d: any) => ({ id: d.id, product_id: d.product_id, quantity: d.quantity, product: d.product })));
    }
    setLoading(false);
  }, [user, syncGuestCartToDb]);

  useEffect(() => {
    if (user) {
      fetchDbCart();
    } else {
      hydrateGuestCart();
    }
  }, [user, fetchDbCart, hydrateGuestCart]);

  const addToCart = async (productId: string, qty = 1) => {
    if (user) {
      // Authenticated: use DB
      const existing = items.find(i => i.product_id === productId);
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("user_id", user.id).eq("product_id", productId);
      } else {
        await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity: qty });
      }
      await fetchDbCart();
    } else {
      // Guest: use localStorage
      const local = getGuestCart();
      const existing = local.find(i => i.product_id === productId);
      if (existing) {
        existing.quantity += qty;
      } else {
        local.push({ product_id: productId, quantity: qty });
      }
      setGuestCart(local);
      await hydrateGuestCart();
    }
  };

  const removeFromCart = async (productId: string) => {
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
      await fetchDbCart();
    } else {
      const local = getGuestCart().filter(i => i.product_id !== productId);
      setGuestCart(local);
      await hydrateGuestCart();
    }
  };

  const updateQuantity = async (productId: string, qty: number) => {
    if (qty <= 0) { await removeFromCart(productId); return; }
    if (user) {
      await supabase.from("cart_items").update({ quantity: qty }).eq("user_id", user.id).eq("product_id", productId);
      await fetchDbCart();
    } else {
      const local = getGuestCart();
      const item = local.find(i => i.product_id === productId);
      if (item) item.quantity = qty;
      setGuestCart(local);
      await hydrateGuestCart();
    }
  };

  const clearCart = async () => {
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    }
    clearGuestCartStorage();
    setItems([]);
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.quantity * i.product.price, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
