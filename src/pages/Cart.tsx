import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Trash2, Minus, Plus, ShoppingBag, Bookmark, BookmarkCheck,
  Gift, Tag, Sparkles, Truck, Calendar, Loader2, X, MessageSquare,
} from "lucide-react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
}

export default function Cart() {
  const { user } = useAuth();
  const {
    items, savedItems, subtotal, updateQty, removeItem,
    saveForLater, moveToCart, updateMeta, addItem,
  } = useCart();

  // ── Settings (free shipping threshold + delivery time)
  const [freeShipThreshold, setFreeShipThreshold] = useState<number>(200);
  const [shippingCost, setShippingCost] = useState<number>(35);
  const [deliveryDays, setDeliveryDays] = useState<string>("1-3");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("key, value_json")
        .in("key", ["free_shipping_threshold", "default_shipping_cost", "delivery_time"]);
      if (!data) return;
      data.forEach((r: any) => {
        const v = typeof r.value_json === "string" ? r.value_json : String(r.value_json ?? "");
        if (r.key === "free_shipping_threshold") setFreeShipThreshold(Number(v) || 200);
        if (r.key === "default_shipping_cost") setShippingCost(Number(v) || 35);
        if (r.key === "delivery_time") setDeliveryDays(v.replace(/[^\d-]/g, "") || "1-3");
      });
    })();
  }, []);

  // ── Coupon
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // ── Loyalty
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("loyalty_points")
        .select("points")
        .eq("user_id", user.id);
      const total = (data || []).reduce((s: number, r: any) => s + (Number(r.points) || 0), 0);
      setLoyaltyBalance(total);
    })();
  }, [user]);

  // ── Cross-sell (recommendations from same categories as cart items)
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  useEffect(() => {
    if (items.length === 0) { setRecommendations([]); return; }
    (async () => {
      const ids = items.map((i) => i.product_id);
      const { data: cats } = await (supabase as any)
        .from("products")
        .select("category_id")
        .in("id", ids);
      const catIds = Array.from(new Set((cats || []).map((c: any) => c.category_id).filter(Boolean)));
      let query = (supabase as any)
        .from("products")
        .select("id, name, slug, price, image_url, category_id")
        .eq("status", "active")
        .eq("visible", true)
        .gt("stock", 0)
        .not("id", "in", `(${ids.join(",")})`)
        .limit(8);
      if (catIds.length > 0) query = query.in("category_id", catIds);
      const { data } = await query;
      setRecommendations(data || []);
    })();
  }, [items.length]);

  // ── Computed totals
  const remaining = Math.max(0, freeShipThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeShipThreshold) * 100);
  const baseShipping = subtotal >= freeShipThreshold ? 0 : (subtotal === 0 ? 0 : shippingCost);

  const couponDiscount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.discount_type === "percentage") {
      const d = subtotal * (Number(coupon.discount_value) / 100);
      const max = coupon.max_discount_amount ? Number(coupon.max_discount_amount) : Infinity;
      return Math.min(d, max);
    }
    return Math.min(subtotal, Number(coupon.discount_value) || 0);
  }, [coupon, subtotal]);

  const loyaltyDiscount = useMemo(() => {
    if (pointsToUse < 50) return 0;
    return (pointsToUse / 100) * 5;
  }, [pointsToUse]);

  const finalShipping = coupon?.includes_free_shipping ? 0 : baseShipping;
  const giftWrapCount = items.filter((i) => i.gift_wrap).length;
  const giftWrapCost = giftWrapCount * 5; // 5 lei per produs cu ambalaj
  const total = Math.max(0, subtotal + finalShipping + giftWrapCost - couponDiscount - loyaltyDiscount);

  // ── Coupon validation
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("validate_coupon", {
        p_coupon_code: couponCode.trim(),
        p_cart_total: subtotal,
        p_user_id: user?.id ?? null,
      });
      if (error) throw error;
      if (data?.valid) {
        setCoupon(data);
        toast.success(`Cod aplicat — ${data.discount_type === "percentage" ? data.discount_value + "%" : data.discount_value + " lei"} reducere`);
      } else {
        toast.error(data?.message || "Cod invalid");
        setCoupon(null);
      }
    } catch (e: any) {
      toast.error(e.message || "Eroare cupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // ── Estimated delivery date
  const deliveryDate = useMemo(() => {
    const max = parseInt(deliveryDays.split("-").pop() || "3", 10) || 3;
    const d = new Date();
    d.setDate(d.getDate() + max);
    return d.toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });
  }, [deliveryDays]);

  // ── Empty cart
  if (items.length === 0 && savedItems.length === 0) {
    return (
      <StorefrontLayout>
        <SeoHead title="Coșul tău e gol — Mama Lucica" description="Coșul tău este gol. Descoperă lumânările noastre artizanale." />
        <div className="ml-container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-2xl mb-2">Coșul tău e gol</h1>
          <p className="text-sm text-muted-foreground mb-6">Adaugă lumânări artizanale și savurează o atmosferă caldă acasă.</p>
          <Link to="/catalog" className="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-sm">Vezi produsele</Link>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <SeoHead title={`Coș (${items.length}) — Mama Lucica`} description="Finalizează comanda ta de lumânări artizanale Mama Lucica." />
      <section className="ml-container py-6 lg:py-10">
        <h1 className="font-display text-2xl lg:text-3xl mb-6">Coșul tău</h1>

        {/* ━━ Bară progres transport gratuit ━━ */}
        {items.length > 0 && (
          <div className="mb-6 p-4 bg-card border border-border rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-accent" />
              {remaining > 0 ? (
                <p className="text-sm">Mai ai <strong className="text-accent">{remaining.toFixed(2)} lei</strong> până la <strong>transport gratuit</strong></p>
              ) : (
                <p className="text-sm font-semibold text-accent">🎉 Beneficiezi de transport gratuit!</p>
              )}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Estimare livrare: <strong className="text-foreground capitalize">{deliveryDate}</strong></span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-3">
            {/* ━━ Produse active în coș ━━ */}
            {items.map((it) => (
              <div key={it.product_id} className="p-3 bg-card border border-border rounded-md">
                <div className="flex gap-3">
                  <Link to={`/produs/${it.slug || ""}`} className="w-20 h-20 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                    {it.image_url ? <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🕯️</div>}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/produs/${it.slug || ""}`} className="text-sm font-medium line-clamp-2 hover:text-accent">{it.name}</Link>
                    <div className="text-base font-bold mt-1 text-accent">{(it.price * it.quantity).toFixed(2)} lei</div>
                    <div className="text-[11px] text-muted-foreground">{it.price.toFixed(2)} lei/buc</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => removeItem(it.product_id)} aria-label="Elimină din coș" className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center border border-border rounded-sm">
                      <button onClick={() => updateQty(it.product_id, it.quantity - 1)} aria-label="Scade" className="p-1.5"><Minus className="h-3 w-3" /></button>
                      <span className="w-8 text-center text-xs font-semibold">{it.quantity}</span>
                      <button onClick={() => updateQty(it.product_id, it.quantity + 1)} aria-label="Crește" className="p-1.5"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>

                {/* Acțiuni rând: salvează / cadou / mențiuni */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/60">
                  <button
                    onClick={() => saveForLater(it.product_id)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border border-border hover:bg-muted"
                  >
                    <Bookmark className="h-3.5 w-3.5" /> Salvează pentru mai târziu
                  </button>
                  <label className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border border-border cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={!!it.gift_wrap}
                      onChange={(e) => updateMeta(it.product_id, { gift_wrap: e.target.checked })}
                      className="h-3 w-3"
                    />
                    <Gift className="h-3.5 w-3.5" /> Ambalaj cadou (+5 lei)
                  </label>
                </div>

                {it.gift_wrap && (
                  <textarea
                    value={it.gift_message || ""}
                    onChange={(e) => updateMeta(it.product_id, { gift_message: e.target.value })}
                    placeholder="Mesaj cadou (opțional)..."
                    rows={2}
                    maxLength={200}
                    className="w-full mt-2 p-2 text-xs border border-border rounded-sm bg-background"
                  />
                )}
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer inline-flex items-center gap-1 hover:text-foreground">
                    <MessageSquare className="h-3 w-3" /> {it.note ? "Mențiune adăugată" : "Adaugă o mențiune"}
                  </summary>
                  <textarea
                    value={it.note || ""}
                    onChange={(e) => updateMeta(it.product_id, { note: e.target.value })}
                    placeholder="Mențiuni speciale pentru acest produs..."
                    rows={2}
                    maxLength={300}
                    className="w-full mt-2 p-2 text-xs border border-border rounded-sm bg-background"
                  />
                </details>
              </div>
            ))}

            {/* ━━ Salvate pentru mai târziu ━━ */}
            {savedItems.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-lg mb-3 inline-flex items-center gap-2">
                  <BookmarkCheck className="h-5 w-5 text-accent" /> Salvate pentru mai târziu ({savedItems.length})
                </h2>
                <div className="space-y-2">
                  {savedItems.map((it) => (
                    <div key={it.product_id} className="flex gap-3 p-3 bg-muted/30 border border-border rounded-md">
                      <Link to={`/produs/${it.slug || ""}`} className="w-16 h-16 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                        {it.image_url ? <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🕯️</div>}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/produs/${it.slug || ""}`} className="text-sm font-medium line-clamp-2 hover:text-accent">{it.name}</Link>
                        <div className="text-sm text-muted-foreground">{it.price.toFixed(2)} lei</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => moveToCart(it.product_id)} className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-sm font-semibold">
                          Mută în coș
                        </button>
                        <button onClick={() => removeItem(it.product_id)} aria-label="Șterge" className="text-muted-foreground hover:text-destructive p-1">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ━━ Cross-sell ━━ */}
            {recommendations.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-lg mb-3 inline-flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" /> Te-ar mai putea interesa
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recommendations.slice(0, 4).map((r) => (
                    <div key={r.id} className="bg-card border border-border rounded-md p-2 group">
                      <Link to={`/produs/${r.slug}`} className="block aspect-square bg-muted rounded-sm overflow-hidden mb-2">
                        {r.image_url ? (
                          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🕯️</div>
                        )}
                      </Link>
                      <Link to={`/produs/${r.slug}`} className="text-xs font-medium line-clamp-2 hover:text-accent mb-1 block">{r.name}</Link>
                      <div className="text-sm font-bold text-accent mb-2">{Number(r.price).toFixed(2)} lei</div>
                      <button
                        onClick={() => {
                          addItem({ product_id: r.id, name: r.name, slug: r.slug, image_url: r.image_url, price: Number(r.price) }, 1);
                          toast.success(`${r.name} adăugat în coș`);
                        }}
                        className="w-full text-[11px] py-1.5 bg-primary text-primary-foreground rounded-sm font-semibold hover:opacity-90"
                      >
                        + Adaugă
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ━━ Sumar comandă ━━ */}
          <aside className="bg-card border border-border rounded-md p-5 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-lg mb-4">Sumar comandă</h2>

            {/* Cupon */}
            <div className="mb-4 pb-4 border-b border-border">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block inline-flex items-center gap-1">
                <Tag className="h-3 w-3" /> Cod reducere
              </label>
              {coupon ? (
                <div className="flex items-center justify-between p-2 bg-accent/10 border border-accent/30 rounded-sm">
                  <div className="text-xs">
                    <div className="font-bold text-accent">{couponCode.toUpperCase()}</div>
                    <div className="text-muted-foreground">-{couponDiscount.toFixed(2)} lei</div>
                  </div>
                  <button onClick={() => { setCoupon(null); setCouponCode(""); }} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Cod cupon"
                    className="flex-1 h-9 px-2 text-sm border border-border rounded-sm bg-background uppercase"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-3 h-9 bg-foreground text-background text-xs font-semibold rounded-sm disabled:opacity-40"
                  >
                    {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aplică"}
                  </button>
                </div>
              )}
            </div>

            {/* Loialitate */}
            {user && loyaltyBalance >= 50 && (
              <div className="mb-4 pb-4 border-b border-border">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Puncte fidelitate ({loyaltyBalance} disponibile)
                </label>
                <input
                  type="range"
                  min={0}
                  max={Math.min(loyaltyBalance, Math.floor(subtotal * 20))} // max 50% reducere via puncte
                  step={50}
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                  <span>{pointsToUse} puncte</span>
                  <span className="text-accent font-semibold">-{loyaltyDiscount.toFixed(2)} lei</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">100 puncte = 5 lei. Minim 50 puncte.</p>
              </div>
            )}

            {/* Totaluri */}
            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-border">
              <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)} lei</span></div>
              {giftWrapCost > 0 && (
                <div className="flex justify-between text-muted-foreground"><span>Ambalaj cadou ({giftWrapCount})</span><span>{giftWrapCost.toFixed(2)} lei</span></div>
              )}
              <div className="flex justify-between">
                <span>Transport</span>
                <span className={finalShipping === 0 ? "text-accent font-semibold" : ""}>
                  {finalShipping === 0 ? "GRATUIT" : `${finalShipping.toFixed(2)} lei`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-accent"><span>Cupon</span><span>-{couponDiscount.toFixed(2)} lei</span></div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-accent"><span>Puncte fidelitate</span><span>-{loyaltyDiscount.toFixed(2)} lei</span></div>
              )}
            </div>
            <div className="flex justify-between text-lg font-bold mb-5">
              <span>Total</span><span className="text-accent">{total.toFixed(2)} lei</span>
            </div>

            <Link to="/checkout" className="block w-full h-12 bg-primary text-primary-foreground font-semibold rounded-sm flex items-center justify-center hover:opacity-90">
              Finalizează comanda
            </Link>
            <Link to="/catalog" className="block w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground">
              ← Continuă cumpărăturile
            </Link>
          </aside>
        </div>
      </section>
    </StorefrontLayout>
  );
}
