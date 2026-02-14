import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", city: "", county: "", postalCode: "" });
  const [paymentMethod, setPaymentMethod] = useState("ramburs");

  if (!user) return <Layout><div className="container py-16 text-center"><p>Autentifică-te mai întâi.</p><Link to="/auth"><Button className="mt-4">Autentifică-te</Button></Link></div></Layout>;
  if (items.length === 0) return <Layout><div className="container py-16 text-center"><p>Coșul este gol.</p><Link to="/catalog"><Button className="mt-4">Vezi produse</Button></Link></div></Layout>;

  const shipping = totalPrice >= 200 ? 0 : 19.99;
  const total = totalPrice + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.address || !form.city || !form.county) {
      toast.error("Completează toate câmpurile obligatorii");
      return;
    }
    setSubmitting(true);
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      total,
      payment_method: paymentMethod,
      shipping_address: form,
    }).select().single();

    if (error || !order) { toast.error("Eroare la plasarea comenzii"); setSubmitting(false); return; }

    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.product.price,
    }));
    await supabase.from("order_items").insert(orderItems);
    await clearCart();
    toast.success("Comanda a fost plasată cu succes!");
    navigate("/order-confirmation/" + order.id);
    setSubmitting(false);
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Finalizare comandă</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Adresa de livrare</h2>
              <div className="space-y-3">
                <div><Label>Nume complet *</Label><Input value={form.fullName} onChange={e => updateField("fullName", e.target.value)} required /></div>
                <div><Label>Telefon *</Label><Input value={form.phone} onChange={e => updateField("phone", e.target.value)} required /></div>
                <div><Label>Adresă *</Label><Input value={form.address} onChange={e => updateField("address", e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Oraș *</Label><Input value={form.city} onChange={e => updateField("city", e.target.value)} required /></div>
                  <div><Label>Județ *</Label><Input value={form.county} onChange={e => updateField("county", e.target.value)} required /></div>
                </div>
                <div><Label>Cod poștal</Label><Input value={form.postalCode} onChange={e => updateField("postalCode", e.target.value)} /></div>
              </div>

              <h2 className="text-lg font-semibold pt-2">Metodă de plată</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="ramburs" id="ramburs" />
                  <Label htmlFor="ramburs" className="cursor-pointer flex-1">Ramburs la livrare</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="cursor-pointer flex-1">Card online</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-card rounded-lg border p-6 h-fit space-y-3">
              <h2 className="font-bold text-lg">Rezumat comandă</h2>
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{item.product.name} x{item.quantity}</span>
                  <span>{(item.product.price * item.quantity).toLocaleString("ro-RO")} lei</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Livrare</span>
                <span>{shipping === 0 ? "GRATUITĂ" : `${shipping} lei`}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{total.toLocaleString("ro-RO")} lei</span>
              </div>
              <Button type="submit" className="w-full font-semibold" size="lg" disabled={submitting}>
                {submitting ? "Se procesează..." : "Plasează comanda"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
