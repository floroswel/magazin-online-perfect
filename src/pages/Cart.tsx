import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";

export default function Cart() {
  const { items, subtotal, updateQty, removeItem } = useCart();
  const FREE_SHIP = 200;
  const shipping = subtotal >= FREE_SHIP ? 0 : 35;
  const total = subtotal + shipping;
  const remaining = Math.max(0, FREE_SHIP - subtotal);

  if (items.length === 0) {
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

        {remaining > 0 && (
          <div className="mb-6 p-3 bg-accent/10 border border-accent/30 rounded-sm text-sm">
            🚚 Mai ai <strong>{remaining.toFixed(2)} lei</strong> până la transport gratuit!
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.product_id} className="flex gap-3 p-3 bg-card border border-border rounded-md">
                <Link to={`/produs/${it.slug || ""}`} className="w-20 h-20 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                  {it.image_url ? <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🕯️</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/produs/${it.slug || ""}`} className="text-sm font-medium line-clamp-2 hover:text-accent">{it.name}</Link>
                  <div className="text-base font-bold mt-1" style={{ color: "#FF3300" }}>{(it.price * it.quantity).toFixed(2)} lei</div>
                  <div className="text-[11px] text-muted-foreground">{it.price.toFixed(2)} lei/buc</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => removeItem(it.product_id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center border border-border rounded-sm">
                    <button onClick={() => updateQty(it.product_id, it.quantity - 1)} className="p-1.5"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-xs font-semibold">{it.quantity}</span>
                    <button onClick={() => updateQty(it.product_id, it.quantity + 1)} className="p-1.5"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="bg-card border border-border rounded-md p-5 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-lg mb-4">Sumar comandă</h2>
            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-border">
              <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)} lei</span></div>
              <div className="flex justify-between"><span>Transport</span><span>{shipping === 0 ? "GRATUIT" : `${shipping.toFixed(2)} lei`}</span></div>
            </div>
            <div className="flex justify-between text-lg font-bold mb-5">
              <span>Total</span><span style={{ color: "#FF3300" }}>{total.toFixed(2)} lei</span>
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
