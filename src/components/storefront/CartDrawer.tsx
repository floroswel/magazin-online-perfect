import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CartDrawer() {
  const { items, subtotal, updateQty, removeItem, open, setOpen } = useCart();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const FREE_SHIP = 200;
  const remaining = Math.max(0, FREE_SHIP - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIP) * 100);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Coș cumpărături">
      <div className="absolute inset-0 bg-scrim/50" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-card shadow-editorial flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl">Coșul tău <span className="text-sm text-muted-foreground">({items.length})</span></h2>
          <button onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-sm"><X className="h-5 w-5" /></button>
        </div>

        {items.length > 0 && (
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            {remaining > 0 ? (
              <p className="text-xs mb-1.5">Mai adaugă <strong className="text-accent">{remaining.toFixed(2)} lei</strong> pentru livrare gratuită 🚚</p>
            ) : (
              <p className="text-xs text-success font-semibold mb-1.5">✓ Beneficiezi de livrare gratuită!</p>
            )}
            <div className="h-1 bg-border rounded-full overflow-hidden max-w-full">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-display text-xl mb-1">Coșul e gol</p>
              <p className="text-sm text-muted-foreground mb-6">Adaugă produse și începe-ți ritualul</p>
              <Link to="/catalog" onClick={() => setOpen(false)} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm text-xs font-semibold uppercase tracking-wider">
                Vezi produsele
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.product_id} className="p-4 flex gap-3">
                  <div className="w-16 h-16 shrink-0 bg-muted rounded-sm overflow-hidden">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{item.name}</p>
                    <p className="text-sm text-accent font-semibold mt-1">{(item.price * item.quantity).toFixed(2)} lei</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded-sm">
                        <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="px-2 py-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                        <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="px-2 py-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => removeItem(item.product_id)} className="text-xs text-muted-foreground hover:text-destructive ml-auto">Șterge</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Subtotal</span>
              <span className="font-display text-2xl">{subtotal.toFixed(2)} lei</span>
            </div>
            <Link to="/checkout" onClick={() => setOpen(false)} className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-wider hover:opacity-90">
              Finalizează comanda →
            </Link>
            <Link to="/cos" onClick={() => setOpen(false)} className="block w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground underline">
              Vezi coșul detaliat
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
