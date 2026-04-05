import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Date personale", "Adresa", "Livrare", "Plată"];
const COUNTIES = ["Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brașov","Brăila","București","Buzău","Caraș-Severin","Călărași","Cluj","Constanța","Covasna","Dâmbovița","Dolj","Galați","Giurgiu","Gorj","Harghita","Hunedoara","Ialomița","Iași","Ilfov","Maramureș","Mehedinți","Mureș","Neamț","Olt","Prahova","Satu Mare","Sălaj","Sibiu","Suceava","Teleorman","Timiș","Tulcea","Vaslui","Vâlcea","Vrancea"];

interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  price: number;
  free_above: number | null;
  estimated_days: string | null;
}

const DEFAULT_SHIPPING: ShippingMethod[] = [
  { id: "standard", name: "Standard", description: "Livrare în 3-5 zile lucrătoare", icon: "🚚", price: 25, free_above: 200, estimated_days: "3-5 zile" },
  { id: "express", name: "Curier Express", description: "Livrare în 1-2 zile lucrătoare", icon: "⚡", price: 35, free_above: null, estimated_days: "1-2 zile" },
  { id: "pickup", name: "Ridicare personală", description: "Ridicare din magazin", icon: "🏪", price: 0, free_above: null, estimated_days: "Imediat" },
];

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { format } = useCurrency();
  const { user } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const rambursCostValue = parseInt(settings.ramburs_extra_cost || "5");
  const siteName = settings.site_name || "LUMAX";

  const { data: shippingMethodsDB } = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipping_methods")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return (data || []) as ShippingMethod[];
    },
  });

  const shippingMethods = shippingMethodsDB && shippingMethodsDB.length > 0 ? shippingMethodsDB : DEFAULT_SHIPPING;

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: user?.email || "", phone: "",
    street: "", city: "", county: "", postalCode: "",
    shippingMethod: "standard", paymentMethod: "ramburs",
    gdprAccepted: false, newsletter: false,
  });

  // Set default shipping method from DB
  useEffect(() => {
    if (shippingMethods.length > 0 && !shippingMethods.find(m => m.id === form.shippingMethod || m.name === form.shippingMethod)) {
      setForm(prev => ({ ...prev, shippingMethod: shippingMethods[0].id || shippingMethods[0].name }));
    }
  }, [shippingMethods]);

  usePageSeo({ title: `Finalizare Comandă | ${siteName}`, noindex: true });

  const selectedMethod = shippingMethods.find(m => m.id === form.shippingMethod || m.name === form.shippingMethod) || shippingMethods[0];
  const shippingCost = selectedMethod
    ? (selectedMethod.free_above && totalPrice >= selectedMethod.free_above ? 0 : selectedMethod.price)
    : 0;
  const rambursCost = form.paymentMethod === "ramburs" ? rambursCostValue : 0;
  const finalTotal = totalPrice + shippingCost + rambursCost;

  const updateForm = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const canNextStep = () => {
    if (step === 0) return form.firstName && form.lastName && form.email && form.phone;
    if (step === 1) return form.street && form.city && form.county;
    if (step === 2) return true;
    if (step === 3) return form.gdprAccepted;
    return false;
  };

  const placeOrder = async () => {
    if (!form.gdprAccepted) return;
    setSubmitting(true);
    try {
      const orderData = {
        user_id: user?.id || "00000000-0000-0000-0000-000000000000",
        user_email: form.email,
        status: form.paymentMethod === "card" ? "pending_payment" : "pending",
        payment_method: form.paymentMethod,
        payment_status: form.paymentMethod === "card" ? "pending" : "unpaid",
        total: finalTotal,
        subtotal: totalPrice,
        shipping_total: shippingCost,
        shipping_address: {
          fullName: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          street: form.street,
          city: form.city,
          county: form.county,
          postalCode: form.postalCode,
        },
        billing_address: {
          fullName: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          street: form.street,
          city: form.city,
          county: form.county,
        },
        notes: "",
      };

      const { data: order, error } = await supabase.from("orders").insert(orderData as any).select("id, order_number").single();
      if (error) throw error;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        image_url: item.product.image_url,
      }));
      await supabase.from("order_items").insert(orderItems as any);

      supabase.functions.invoke("send-email", {
        body: { type: "order_confirmation", to: form.email, data: { orderId: order.id, orderNumber: order.order_number, total: finalTotal, name: form.firstName } },
      }).catch(console.error);

      await clearCart();

      if (form.paymentMethod === "card") {
        try {
          const { data: payData } = await supabase.functions.invoke("netopia-payment", {
            body: { orderId: order.id, amount: finalTotal, email: form.email, firstName: form.firstName, lastName: form.lastName },
          });
          if (payData?.paymentUrl) {
            window.location.href = payData.paymentUrl;
            return;
          }
        } catch (e) {
          console.error("Netopia redirect failed:", e);
        }
      }

      navigate(`/order-confirmation/${order.id}`);
    } catch (err: any) {
      toast.error("Eroare la plasarea comenzii: " + (err.message || "Încearcă din nou"));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="lumax-container py-20 text-center">
          <p className="text-lg font-bold mb-2">Coșul este gol</p>
          <Link to="/catalog" className="text-primary text-sm font-semibold hover:underline">← Înapoi la catalog</Link>
        </div>
      </Layout>
    );
  }

  const inputClass = "w-full h-10 px-3 border border-border rounded-md text-sm bg-background focus:ring-primary focus:border-primary";

  return (
    <Layout>
      <div className="lumax-container py-6 pb-12">
        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? "bg-lumax-green text-white" : i === step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${i < step ? "bg-lumax-green" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Form area */}
          <div className="bg-card rounded-xl border border-border p-6">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Date personale</h2>
                {!user && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                    Ai cont? <Link to="/auth" className="text-primary font-semibold hover:underline">Autentifică-te</Link> pentru o comandă mai rapidă.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.firstName} onChange={e => updateForm("firstName", e.target.value)} placeholder="Prenume *" className={inputClass} />
                  <input value={form.lastName} onChange={e => updateForm("lastName", e.target.value)} placeholder="Nume *" className={inputClass} />
                </div>
                <input value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="Email *" type="email" className={inputClass} />
                <input value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="Telefon *" type="tel" className={inputClass} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Adresa de livrare</h2>
                <input value={form.street} onChange={e => updateForm("street", e.target.value)} placeholder="Strada, nr., bloc, ap. *" className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.city} onChange={e => updateForm("city", e.target.value)} placeholder="Oraș *" className={inputClass} />
                  <select value={form.county} onChange={e => updateForm("county", e.target.value)} className={inputClass}>
                    <option value="">Județ *</option>
                    {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <input value={form.postalCode} onChange={e => updateForm("postalCode", e.target.value)} placeholder="Cod poștal" className={inputClass} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold">Metoda de livrare</h2>
                {shippingMethods.map(method => {
                  const methodKey = method.id || method.name;
                  const isFree = method.free_above && totalPrice >= method.free_above;
                  const displayPrice = method.price === 0 || isFree ? "GRATUIT" : `${method.price} lei`;
                  return (
                    <button
                      key={methodKey}
                      onClick={() => updateForm("shippingMethod", methodKey)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        form.shippingMethod === methodKey ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{method.icon || "🚚"}</span>
                          <div>
                            <p className="text-sm font-bold">{method.name}</p>
                            <p className="text-xs text-muted-foreground">{method.description}{method.estimated_days ? ` · ${method.estimated_days}` : ""}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${displayPrice === "GRATUIT" ? "text-lumax-green" : "text-foreground"}`}>{displayPrice}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold">Metoda de plată</h2>
                {[
                  { v: "card", icon: "💳", title: "Plata cu cardul", desc: "Visa, Mastercard — Powered by Netopia" },
                  { v: "ramburs", icon: "💵", title: "Ramburs la curier", desc: `Plătești la primirea coletului (+${rambursCostValue} lei)` },
                  { v: "transfer", icon: "🏦", title: "Transfer bancar (OP)", desc: "Plătești după plasarea comenzii" },
                ].map(o => (
                  <button
                    key={o.v}
                    onClick={() => updateForm("paymentMethod", o.v)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      form.paymentMethod === o.v ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{o.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{o.title}</p>
                        <p className="text-xs text-muted-foreground">{o.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Transfer bancar IBAN info */}
                {form.paymentMethod === "transfer" && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-2 space-y-1 text-sm">
                    <p className="font-bold text-foreground">Detalii transfer bancar:</p>
                    <p className="text-muted-foreground">Bancă: <span className="font-semibold text-foreground">{settings.company_bank || "Banca Transilvania"}</span></p>
                    <p className="text-muted-foreground">IBAN: <span className="font-semibold text-foreground">{settings.company_iban || "RO00XXXX0000000000000000"}</span></p>
                    <p className="text-muted-foreground">Beneficiar: <span className="font-semibold text-foreground">{settings.company_name || "LUMAX SRL"}</span></p>
                  </div>
                )}

                <div className="space-y-3 mt-6">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.gdprAccepted} onChange={e => updateForm("gdprAccepted", e.target.checked)} className="mt-1 rounded border-border text-primary focus:ring-primary" />
                    <span className="text-xs text-muted-foreground">
                      Sunt de acord cu{" "}
                      <Link to="/termeni-si-conditii" className="text-primary underline" target="_blank">Termenii și Condițiile</Link> și{" "}
                      <Link to="/politica-de-confidentialitate" className="text-primary underline" target="_blank">Politica de Confidențialitate</Link> *
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.newsletter} onChange={e => updateForm("newsletter", e.target.checked)} className="mt-1 rounded border-border text-primary focus:ring-primary" />
                    <span className="text-xs text-muted-foreground">Vreau să primesc oferte și noutăți pe email</span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="h-11 px-6 border border-border rounded-lg text-sm font-semibold hover:bg-secondary">← Înapoi</button>
              )}
              <div className="ml-auto">
                {step < 3 ? (
                  <button onClick={() => setStep(step + 1)} disabled={!canNextStep()} className="h-11 px-8 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-lumax-blue-dark disabled:opacity-50 disabled:cursor-not-allowed">
                    Continuă →
                  </button>
                ) : (
                  <button onClick={placeOrder} disabled={!form.gdprAccepted || submitting} className="h-14 px-8 bg-destructive text-destructive-foreground rounded-lg text-base font-extrabold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                    {submitting ? "Se procesează..." : `🔒 Plasează Comanda — ${format(finalTotal)}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-[60px] self-start">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-base font-bold mb-4">Comanda ta</h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.product_id} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img src={item.product.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{format(item.product.price)} × {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold">{format(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <hr className="border-border mb-3" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{format(totalPrice)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Transport</span><span className={shippingCost === 0 ? "text-lumax-green font-semibold" : ""}>{shippingCost === 0 ? "GRATUIT" : format(shippingCost)}</span></div>
                {rambursCost > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Ramburs</span><span>{format(rambursCost)}</span></div>}
                <hr className="border-border" />
                <div className="flex justify-between text-lg font-extrabold"><span>TOTAL</span><span>{format(finalTotal)}</span></div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">🔒 SSL · Visa · Mastercard · Netopia</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
