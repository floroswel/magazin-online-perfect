import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: user?.email || "", phone: "",
    address: "", city: "", county: "", postal_code: "",
    notes: "", payment_method: "cod",
    accept_terms: false, accept_privacy: false,
  });

  const FREE_SHIP = 200;
  const shipping = subtotal >= FREE_SHIP ? 0 : 35;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <StorefrontLayout>
        <div className="ml-container py-20 text-center">
          <h1 className="font-display text-2xl mb-3">Coș gol</h1>
          <Link to="/catalog" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm">Vezi produsele</Link>
        </div>
      </StorefrontLayout>
    );
  }

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accept_terms || !form.accept_privacy) {
      toast.error("Trebuie să accepți Termenii și Politica de Confidențialitate.");
      return;
    }
    if (!form.full_name || !form.email || !form.phone || !form.address || !form.city || !form.county) {
      toast.error("Completează toate câmpurile obligatorii.");
      return;
    }
    setLoading(true);
    try {
      const orderPayload: any = {
        user_id: user?.id ?? null,
        user_email: form.email,
        status: form.payment_method === "cod" ? "pending" : "pending_payment",
        payment_status: "pending",
        payment_method: form.payment_method,
        subtotal,
        shipping_total: shipping,
        total,
        notes: form.notes || null,
        shipping_address: {
          fullName: form.full_name, phone: form.phone, email: form.email,
          address: form.address, city: form.city, county: form.county, postal_code: form.postal_code,
        },
        billing_address: {
          fullName: form.full_name, phone: form.phone, email: form.email,
          address: form.address, city: form.city, county: form.county, postal_code: form.postal_code,
        },
      };
      const { data: order, error } = await (supabase as any).from("orders").insert(orderPayload).select("id, order_number").single();
      if (error) throw error;
      const itemsPayload = items.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        product_name: it.name,
        quantity: it.quantity,
        unit_price: it.price,
        total_price: it.price * it.quantity,
      }));
      await (supabase as any).from("order_items").insert(itemsPayload);
      clear();
      toast.success("Comandă plasată cu succes!");
      navigate(`/track?order=${order.order_number || order.id}`);
    } catch (err: any) {
      toast.error("Eroare la plasarea comenzii: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StorefrontLayout hideFooter>
      <SeoHead title="Finalizare comandă — Mama Lucica" description="Finalizează comanda în câțiva pași simpli." />
      <section className="ml-container py-6 lg:py-10">
        <h1 className="font-display text-2xl lg:text-3xl mb-6">Finalizare comandă</h1>
        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-md p-5">
              <h2 className="font-display text-lg mb-4">Date contact</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Nume complet *" value={form.full_name} onChange={(v) => set("full_name", v)} />
                <Input label="Email *" type="email" value={form.email} onChange={(v) => set("email", v)} />
                <Input label="Telefon *" type="tel" value={form.phone} onChange={(v) => set("phone", v)} inputMode="tel" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-md p-5">
              <h2 className="font-display text-lg mb-4">Adresă livrare</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Input label="Adresă (stradă, nr.) *" value={form.address} onChange={(v) => set("address", v)} /></div>
                <Input label="Oraș *" value={form.city} onChange={(v) => set("city", v)} />
                <Input label="Județ *" value={form.county} onChange={(v) => set("county", v)} />
                <Input label="Cod poștal" value={form.postal_code} onChange={(v) => set("postal_code", v)} inputMode="numeric" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-md p-5">
              <h2 className="font-display text-lg mb-4">Metodă de plată</h2>
              <div className="space-y-2">
                {[
                  { v: "cod", l: "Ramburs la curier", d: "Plătești cash sau cu cardul la livrare" },
                  { v: "card", l: "Card online (Netopia)", d: "Visa, Mastercard - securizat 3D Secure" },
                  { v: "transfer", l: "Transfer bancar", d: "Confirmare în 1-3 zile lucrătoare" },
                ].map((opt) => (
                  <label key={opt.v} className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer ${form.payment_method === opt.v ? "border-accent bg-accent/5" : "border-border"}`}>
                    <input type="radio" name="payment_method" value={opt.v} checked={form.payment_method === opt.v} onChange={(e) => set("payment_method", e.target.value)} className="mt-1" />
                    <div><div className="text-sm font-semibold">{opt.l}</div><div className="text-xs text-muted-foreground">{opt.d}</div></div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-md p-5">
              <h2 className="font-display text-lg mb-4">Mențiuni (opțional)</h2>
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Mențiuni pentru curier..." rows={3} className="w-full p-3 border border-border rounded-sm bg-background text-sm" />
            </div>

            <div className="bg-card border border-border rounded-md p-5 space-y-2">
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.accept_terms} onChange={(e) => set("accept_terms", e.target.checked)} className="mt-0.5" />
                <span>Sunt de acord cu <Link to="/page/termeni-conditii" className="text-accent underline">Termenii și Condițiile</Link>.</span>
              </label>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.accept_privacy} onChange={(e) => set("accept_privacy", e.target.checked)} className="mt-0.5" />
                <span>Am citit <Link to="/page/politica-de-confidentialitate" className="text-accent underline">Politica de Confidențialitate</Link>.</span>
              </label>
            </div>
          </div>

          <aside className="bg-card border border-border rounded-md p-5 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-lg mb-4">Comanda ta</h2>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {items.map((it) => (
                <div key={it.product_id} className="flex justify-between text-sm gap-3">
                  <span className="line-clamp-1">{it.quantity} × {it.name}</span>
                  <span className="font-semibold whitespace-nowrap">{(it.price * it.quantity).toFixed(2)} lei</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-border pt-3 mb-4">
              <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)} lei</span></div>
              <div className="flex justify-between"><span>Transport</span><span>{shipping === 0 ? "GRATUIT" : `${shipping.toFixed(2)} lei`}</span></div>
            </div>
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total</span><span style={{ color: "#FF3300" }}>{total.toFixed(2)} lei</span>
            </div>
            <button type="submit" disabled={loading} className="w-full h-12 bg-accent text-accent-foreground font-bold rounded-sm hover:opacity-90 disabled:opacity-40">
              {loading ? "Se procesează..." : "Plasează comanda"}
            </button>
          </aside>
        </form>
      </section>
    </StorefrontLayout>
  );
}

function Input({ label, value, onChange, type = "text", inputMode }: any) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-3 border border-border rounded-sm bg-background text-sm focus:outline-none focus:border-accent" />
    </label>
  );
}
