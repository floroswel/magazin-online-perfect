import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShoppingCart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

export default function RecoverCart() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "expired" | "error">("loading");
  const [couponCode, setCouponCode] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    recoverCart();
  }, [token, user]);

  const recoverCart = async () => {
    try {
      // Find abandoned cart by token
      const { data: cart, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .eq("recovery_token", token!)
        .maybeSingle();

      if (error || !cart) {
        setStatus("error");
        return;
      }

      // Check expiry
      if (cart.recovery_token_expires_at && new Date(cart.recovery_token_expires_at) < new Date()) {
        setStatus("expired");
        return;
      }

      // Check already recovered
      if (cart.recovered) {
        setStatus("success");
        setCouponCode(cart.recovery_coupon_code);
        return;
      }

      const items = Array.isArray(cart.items) ? (cart.items as any[]) : [];

      if (user) {
        // Restore cart items to cart_items table
        for (const item of items) {
          const pid = item.product_id as string;
          const qty = (item.quantity as number) || 1;
          const { data: existing } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", user.id)
            .eq("product_id", pid)
            .maybeSingle();

          if (existing) {
            await supabase.from("cart_items")
              .update({ quantity: qty })
              .eq("id", existing.id);
          } else {
            await supabase.from("cart_items")
              .insert({ user_id: user.id, product_id: item.product_id, quantity: item.quantity });
          }
        }
      } else {
        // Guest: save to localStorage
        const guestCart = items.map((i: any) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        }));
        localStorage.setItem("guest_cart", JSON.stringify(guestCart));
      }

      // Save coupon to localStorage for auto-apply at checkout
      if (cart.recovery_coupon_code) {
        localStorage.setItem("recovery_coupon", cart.recovery_coupon_code);
        setCouponCode(cart.recovery_coupon_code);
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Se restaurează coșul tău...</p>
        </div>
      </Layout>
    );
  }

  if (status === "expired") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Link expirat</h2>
          <p className="text-muted-foreground mb-4">Acest link de recuperare a expirat. Te rugăm să vizitezi magazinul pentru cele mai recente oferte.</p>
          <Button onClick={() => navigate("/catalog")}>Vezi produse</Button>
        </div>
      </Layout>
    );
  }

  if (status === "error") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Link invalid</h2>
          <p className="text-muted-foreground mb-4">Nu am putut restaura coșul. Te rugăm să vizitezi magazinul.</p>
          <Button onClick={() => navigate("/catalog")}>Vezi produse</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-16 text-center">
        <ShoppingCart className="w-12 h-12 mx-auto text-primary mb-4" />
        <h2 className="text-xl font-bold mb-2">Coșul tău a fost restaurat! 🎉</h2>
        <p className="text-muted-foreground mb-2">Produsele au fost adăugate înapoi în coșul tău.</p>
        {couponCode && (
          <div className="inline-block bg-primary/10 border border-primary/30 rounded-lg px-6 py-3 my-4">
            <p className="text-sm text-muted-foreground">Codul tău de reducere:</p>
            <p className="text-2xl font-bold font-mono tracking-wider text-primary">{couponCode}</p>
            <p className="text-xs text-muted-foreground">Se aplică automat la checkout</p>
          </div>
        )}
        <div className="mt-4">
          <Button size="lg" onClick={() => navigate("/checkout")}>Finalizează comanda →</Button>
        </div>
      </div>
    </Layout>
  );
}
