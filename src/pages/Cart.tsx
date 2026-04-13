import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const FREE_SHIPPING = parseInt(settings.free_shipping_threshold || "200");
  const SHIPPING_COST = parseInt(settings.default_shipping_cost || "25");
  const siteName = settings.site_name || "Mama Lucica";

  usePageSeo({ title: `Coșul meu (${totalItems}) | ${siteName}`, description: "Verifică produsele din coș și finalizează comanda." });

  const shippingCost = totalPrice >= FREE_SHIPPING ? 0 : SHIPPING_COST;
  const finalTotal = totalPrice + shippingCost - couponDiscount;
  const remainingForFree = FREE_SHIPPING - totalPrice;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        p_coupon_code: couponCode.trim(),
        p_cart_total: totalPrice,
        p_user_id: user?.id || null,
      });
      if (error) throw error;
      const result = data as any;
      if (result.valid) {
        const disc = result.discount_type === "percentage"
          ? (totalPrice * result.discount_value) / 100
          : result.discount_value;
        setCouponDiscount(Math.min(disc, result.max_discount_amount || disc));
        toast.success("Cupon aplicat cu succes!");
      } else {
        setCouponError(result.message);
      }
    } catch {
      setCouponError("Eroare la validare cupon");
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="lumax-container py-20 text-center">
          <ShoppingCart className="h-20 w-20 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Coșul tău este gol</h1>
          <p className="text-sm text-muted-foreground mb-6">Descoperă produsele noastre și adaugă-le în coș</p>
          <Link to="/catalog" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-sm hover:bg-lumax-blue-dark transition-colors">
            Descoperă Produse
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="lumax-container py-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-extrabold text-foreground">Coșul meu ({totalItems} produse)</h1>
          <Link to="/catalog" className="text-sm text-primary font-semibold hover:underline">← Continuă cumpărăturile</Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Items */}
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.product_id} className="bg-card rounded-xl border border-border p-4 flex gap-4">
                <Link to={`/product/${item.product.slug}`} className="w-[90px] h-[90px] flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                  <img src={item.product.image_url || "/placeholder.svg"} alt={item.product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase">{siteName}</p>
                  <Link to={`/product/${item.product.slug}`} className="text-sm font-semibold text-foreground hover:text-primary line-clamp-2">{item.product.name}</Link>
                  <p className="text-[11px] text-lumax-green font-semibold mt-0.5">✅ În stoc</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-base font-bold text-destructive">{format(item.product.price * item.quantity)}</p>
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product_id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}

            {/* Free shipping bar */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                <div className="h-full bg-lumax-green rounded-full transition-all" style={{ width: `${Math.min(100, (totalPrice / FREE_SHIPPING) * 100)}%` }} />
              </div>
              <p className="text-xs font-semibold text-center">
                {remainingForFree > 0
                  ? <span className="text-muted-foreground">Mai adaugă <span className="text-primary font-bold">{format(remainingForFree)}</span> pentru transport GRATUIT! 🚚</span>
                  : <span className="text-lumax-green">🎉 Ai câștigat transport GRATUIT!</span>
                }
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-[56px] self-start">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <h2 className="text-base font-bold text-foreground">Sumar comandă</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{format(totalPrice)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Transport</span><span className={`font-semibold ${shippingCost === 0 ? "text-lumax-green" : ""}`}>{shippingCost === 0 ? "GRATUIT" : format(shippingCost)}</span></div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Reducere cupon</span><span className="font-semibold text-destructive">-{format(couponDiscount)}</span></div>
                )}
                <hr className="border-border" />
                <div className="flex justify-between text-lg font-extrabold"><span>TOTAL</span><span>{format(finalTotal)}</span></div>
                <p className="text-[11px] text-muted-foreground">Inclusiv TVA 19%</p>
              </div>

              {/* Coupon */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Ai un cod cupon?</label>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Cod cupon..."
                    className="flex-1 h-9 px-3 border border-border rounded-md text-sm focus:ring-primary focus:border-primary bg-background"
                  />
                  <button onClick={applyCoupon} disabled={couponLoading} className="bg-primary text-primary-foreground h-9 px-4 rounded-md text-xs font-bold hover:bg-lumax-blue-dark disabled:opacity-50">
                    {couponLoading ? "..." : "Aplică"}
                  </button>
                </div>
                {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full h-14 bg-destructive text-destructive-foreground text-base font-extrabold rounded-lg hover:opacity-90 transition-opacity shadow-md"
              >
                Finalizează Comanda →
              </button>

              <p className="text-xs text-muted-foreground text-center">🔒 Plată 100% securizată · Visa · Mastercard · Netopia</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
