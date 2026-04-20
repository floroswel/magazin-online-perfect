import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";
import LegalConsents, { EMPTY_CONSENTS, allConsentsAccepted, type LegalConsentsState } from "@/components/storefront/LegalConsents";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, User, Building2, Plus, Minus, Trash2, AlertTriangle } from "lucide-react";

type Judet = { abreviere: string; nume: string };
type Localitate = { id: number; nume: string; tip: string };

const PHONE_RE = /^(\+?40|0)7\d{8}$/;
const CUI_RE = /^(RO)?\d{2,10}$/i;

export default function Checkout() {
  const { items, subtotal, clear, updateQty, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  // Customer type
  const [customerType, setCustomerType] = useState<"pf" | "pj">("pf");

  // Contact + shipping
  const [form, setForm] = useState({
    first_name: "", last_name: "",
    email: user?.email || "", phone: "",
    address: "", judet: "", city: "", postal_code: "",
    notes: "", payment_method: "cod",
  });

  // Company (PJ)
  const [company, setCompany] = useState({
    name: "", cui: "", reg_com: "", address: "",
  });
  const [anafLoading, setAnafLoading] = useState(false);

  // Billing different
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [billing, setBilling] = useState({
    first_name: "", last_name: "",
    address: "", judet: "", city: "", postal_code: "",
  });

  // Geo data
  const [judete, setJudete] = useState<Judet[]>([]);
  const [localitati, setLocalitati] = useState<Localitate[]>([]);
  const [billingLocalitati, setBillingLocalitati] = useState<Localitate[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [loadingBillLoc, setLoadingBillLoc] = useState(false);

  const [consents, setConsents] = useState<LegalConsentsState>(EMPTY_CONSENTS);

  const FREE_SHIP = 200;
  const shipping = subtotal >= FREE_SHIP ? 0 : 35;
  const total = subtotal + shipping;

  // Load judete on mount
  useEffect(() => {
    (supabase as any).from("romania_judete").select("abreviere, nume").order("nume").then(({ data }: any) => {
      if (data) setJudete(data);
    });
  }, []);

  // Load stock for cart products + auto-clamp quantities
  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.product_id);
    (supabase as any)
      .from("products")
      .select("id, stock")
      .in("id", ids)
      .then(({ data }: any) => {
        if (!data) return;
        const map: Record<string, number> = {};
        data.forEach((p: any) => { map[p.id] = Number(p.stock ?? 0); });
        setStockMap(map);
        // Auto-clamp qty in cart if it exceeds stock
        items.forEach((it) => {
          const max = map[it.product_id];
          if (typeof max === "number" && it.quantity > max) {
            updateQty(it.product_id, Math.max(0, max));
            if (max === 0) {
              toast.error(`"${it.name}" nu mai este în stoc — eliminat din coș`);
            } else {
              toast.warning(`"${it.name}": cantitate redusă la ${max} (stoc disponibil)`);
            }
          }
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Load localitati when judet changes
  useEffect(() => {
    if (!form.judet) { setLocalitati([]); return; }
    setLoadingLoc(true);
    setForm((f) => ({ ...f, city: "" }));
    supabase.functions.invoke("get-localities", { body: { judetAuto: form.judet } })
      .then(({ data, error }: any) => {
        if (error || !data?.localities) {
          toast.error("Nu s-au putut încărca localitățile");
          setLocalitati([]);
        } else {
          setLocalitati(data.localities);
        }
      })
      .finally(() => setLoadingLoc(false));
  }, [form.judet]);

  // Load billing localitati
  useEffect(() => {
    if (!billing.judet) { setBillingLocalitati([]); return; }
    setLoadingBillLoc(true);
    setBilling((b) => ({ ...b, city: "" }));
    supabase.functions.invoke("get-localities", { body: { judetAuto: billing.judet } })
      .then(({ data }: any) => {
        if (data?.localities) setBillingLocalitati(data.localities);
      })
      .finally(() => setLoadingBillLoc(false));
  }, [billing.judet]);

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
  const setComp = (k: string, v: any) => setCompany((c) => ({ ...c, [k]: v }));
  const setBill = (k: string, v: any) => setBilling((b) => ({ ...b, [k]: v }));

  const lookupAnaf = async () => {
    const cui = company.cui.trim().replace(/^RO/i, "");
    if (!CUI_RE.test(company.cui.trim())) {
      toast.error("CUI invalid (ex: RO12345678 sau 12345678)");
      return;
    }
    setAnafLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("anaf-lookup", { body: { cui } });
      if (error) throw error;
      if (data?.found) {
        setCompany((c) => ({
          ...c,
          name: data.denumire || c.name,
          reg_com: data.nrRegCom || c.reg_com,
          address: data.adresa || c.address,
        }));
        toast.success("Date firmă completate din ANAF ✓");
      } else {
        toast.error("CUI negăsit la ANAF — completează manual");
      }
    } catch (e: any) {
      toast.error("Eroare ANAF: " + (e.message || ""));
    } finally {
      setAnafLoading(false);
    }
  };

  const validate = (): string | null => {
    if (!form.first_name.trim() || !form.last_name.trim()) return "Completează prenumele și numele.";
    if (!form.email.trim()) return "Email obligatoriu.";
    if (!PHONE_RE.test(form.phone.replace(/\s/g, ""))) return "Telefon invalid (format RO: 07xxxxxxxx).";
    if (!form.address.trim() || !form.judet || !form.city) return "Completează adresa de livrare (stradă, județ, localitate).";
    if (customerType === "pj") {
      if (!company.name.trim()) return "Denumirea firmei este obligatorie.";
      if (!CUI_RE.test(company.cui.trim())) return "CUI firmă invalid.";
    }
    if (billingDifferent) {
      if (!billing.first_name.trim() || !billing.last_name.trim()) return "Prenume + nume facturare.";
      if (!billing.address.trim() || !billing.judet || !billing.city) return "Completează adresa de facturare.";
    }
    if (!allConsentsAccepted(consents)) return "Trebuie să bifezi toate documentele legale.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      const fullName = `${form.first_name.trim()} ${form.last_name.trim()}`;
      const shippingAddr = {
        firstName: form.first_name, lastName: form.last_name, fullName,
        phone: form.phone, email: form.email,
        address: form.address, city: form.city, county: form.judet, postal_code: form.postal_code,
      };
      const billingAddr = billingDifferent ? {
        firstName: billing.first_name, lastName: billing.last_name,
        fullName: `${billing.first_name} ${billing.last_name}`.trim(),
        phone: form.phone, email: form.email,
        address: billing.address, city: billing.city, county: billing.judet, postal_code: billing.postal_code,
      } : shippingAddr;

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
        customer_type: customerType,
        billing_different: billingDifferent,
        company_name: customerType === "pj" ? company.name : null,
        company_cui: customerType === "pj" ? company.cui.toUpperCase() : null,
        company_reg_com: customerType === "pj" ? company.reg_com : null,
        company_address: customerType === "pj" ? company.address : null,
        shipping_address: shippingAddr,
        billing_address: billingAddr,
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

            {/* Customer Type Tabs */}
            <div className="bg-card border border-border rounded-md p-5">
              <h2 className="font-display text-lg mb-4">Tip client</h2>
              <Tabs value={customerType} onValueChange={(v) => setCustomerType(v as "pf" | "pj")}>
                <TabsList className="grid w-full grid-cols-2 h-auto">
                  <TabsTrigger value="pf" className="py-3 gap-2"><User className="h-4 w-4" /> Persoană fizică</TabsTrigger>
                  <TabsTrigger value="pj" className="py-3 gap-2"><Building2 className="h-4 w-4" /> Persoană juridică</TabsTrigger>
                </TabsList>

                <TabsContent value="pj" className="mt-5 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input label="CUI / CIF *" value={company.cui} onChange={(v) => setComp("cui", v)} placeholder="ex: RO12345678" />
                    </div>
                    <button type="button" onClick={lookupAnaf} disabled={anafLoading || !company.cui.trim()}
                      className="self-end h-11 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-semibold hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2 whitespace-nowrap">
                      {anafLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Caută ANAF
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2"><Input label="Denumire firmă *" value={company.name} onChange={(v) => setComp("name", v)} /></div>
                    <Input label="Nr. Reg. Comerțului" value={company.reg_com} onChange={(v) => setComp("reg_com", v)} placeholder="J40/1234/2020" />
                    <Input label="Adresă sediu social" value={company.address} onChange={(v) => setComp("address", v)} />
                  </div>
                  <p className="text-xs text-muted-foreground">💡 Conform reglementărilor 2026, NU colectăm CNP pentru persoane fizice.</p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Contact */}
            <div className="bg-card border border-border rounded-md p-5">
              <h2 className="font-display text-lg mb-4">Date contact{customerType === "pj" ? " — persoană de contact" : ""}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Prenume *" value={form.first_name} onChange={(v) => set("first_name", v)} autoComplete="given-name" />
                <Input label="Nume *" value={form.last_name} onChange={(v) => set("last_name", v)} autoComplete="family-name" />
                <Input label="Email *" type="email" value={form.email} onChange={(v) => set("email", v)} autoComplete="email" />
                <Input label="Telefon *" type="tel" value={form.phone} onChange={(v) => set("phone", v)} inputMode="tel" placeholder="07xxxxxxxx" autoComplete="tel" />
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-card border border-border rounded-md p-5">
              <h2 className="font-display text-lg mb-4">Adresă livrare</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Input label="Adresă (stradă, nr., bloc, ap.) *" value={form.address} onChange={(v) => set("address", v)} autoComplete="street-address" />
                </div>
                <GeoSelect label="Județ *" value={form.judet} onChange={(v) => set("judet", v)} options={judete.map(j => ({ value: j.abreviere, label: j.nume }))} placeholder="Alege județul" />
                <GeoSelect label="Localitate *" value={form.city} onChange={(v) => set("city", v)}
                  options={localitati.map(l => ({ value: l.nume, label: l.tip === "municipiu" ? `${l.nume} (municipiu)` : l.tip === "oraș" ? `${l.nume} (oraș)` : l.nume }))}
                  placeholder={!form.judet ? "Alege întâi județul" : loadingLoc ? "Se încarcă..." : "Alege localitatea"}
                  disabled={!form.judet || loadingLoc} />
                <Input label="Cod poștal" value={form.postal_code} onChange={(v) => set("postal_code", v)} inputMode="numeric" autoComplete="postal-code" />
              </div>

              <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm">
                <input type="checkbox" checked={billingDifferent} onChange={(e) => setBillingDifferent(e.target.checked)} />
                Adresa de facturare este diferită de cea de livrare
              </label>
            </div>

            {/* Billing address */}
            {billingDifferent && (
              <div className="bg-card border border-border rounded-md p-5">
                <h2 className="font-display text-lg mb-4">Adresă facturare</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Prenume *" value={billing.first_name} onChange={(v) => setBill("first_name", v)} />
                  <Input label="Nume *" value={billing.last_name} onChange={(v) => setBill("last_name", v)} />
                  <div className="sm:col-span-2"><Input label="Adresă *" value={billing.address} onChange={(v) => setBill("address", v)} /></div>
                  <GeoSelect label="Județ *" value={billing.judet} onChange={(v) => setBill("judet", v)} options={judete.map(j => ({ value: j.abreviere, label: j.nume }))} placeholder="Alege județul" />
                  <GeoSelect label="Localitate *" value={billing.city} onChange={(v) => setBill("city", v)}
                    options={billingLocalitati.map(l => ({ value: l.nume, label: l.nume }))}
                    placeholder={!billing.judet ? "Alege întâi județul" : loadingBillLoc ? "Se încarcă..." : "Alege localitatea"}
                    disabled={!billing.judet || loadingBillLoc} />
                  <Input label="Cod poștal" value={billing.postal_code} onChange={(v) => setBill("postal_code", v)} inputMode="numeric" />
                </div>
              </div>
            )}

            {/* Payment */}
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

            <div className="bg-card border border-border rounded-md p-5">
              <h3 className="font-semibold text-sm mb-3">Acord legal</h3>
              <LegalConsents value={consents} onChange={setConsents} idPrefix="checkout" compact />
            </div>
          </div>

          <aside className="bg-card border border-border rounded-md p-5 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-lg mb-4">Comanda ta ({items.length} {items.length === 1 ? "produs" : "produse"})</h2>
            <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
              {items.map((it) => {
                const stock = stockMap[it.product_id];
                const stockKnown = typeof stock === "number";
                const maxReached = stockKnown && it.quantity >= stock;
                const lowStock = stockKnown && stock > 0 && stock <= 5;
                return (
                  <div key={it.product_id} className="flex gap-3 pb-3 border-b border-border last:border-b-0">
                    <Link to={it.slug ? `/produs/${it.slug}` : "#"} className="shrink-0">
                      {it.image_url ? (
                        <img src={it.image_url} alt={it.name} loading="lazy" className="w-16 h-16 object-cover rounded-sm border border-border" />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-sm" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={it.slug ? `/produs/${it.slug}` : "#"} className="text-sm font-medium line-clamp-2 hover:text-accent">
                        {it.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">{it.price.toFixed(2)} lei / buc</div>
                      {lowStock && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Doar {stock} în stoc
                        </div>
                      )}
                      {stockKnown && stock === 0 && (
                        <div className="text-[11px] text-destructive mt-0.5">Stoc epuizat</div>
                      )}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="inline-flex items-center border border-border rounded-sm overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQty(it.product_id, it.quantity - 1)}
                            disabled={loading}
                            aria-label="Scade cantitatea"
                            className="w-7 h-7 inline-flex items-center justify-center hover:bg-muted disabled:opacity-40"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold tabular-nums">{it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (maxReached) {
                                toast.warning(`Stoc disponibil: ${stock} buc.`);
                                return;
                              }
                              updateQty(it.product_id, it.quantity + 1);
                            }}
                            disabled={loading || maxReached}
                            aria-label="Crește cantitatea"
                            title={maxReached ? `Maxim ${stock} bucăți disponibile` : ""}
                            className="w-7 h-7 inline-flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-sm font-semibold whitespace-nowrap">
                          {(it.price * it.quantity).toFixed(2)} lei
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(it.product_id)}
                          disabled={loading}
                          aria-label="Elimină din coș"
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 text-sm border-t border-border pt-3 mb-4">
              <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)} lei</span></div>
              <div className="flex justify-between"><span>Transport</span><span>{shipping === 0 ? "GRATUIT" : `${shipping.toFixed(2)} lei`}</span></div>
            </div>
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total</span><span style={{ color: "#FF3300" }}>{total.toFixed(2)} lei</span>
            </div>
            <button type="submit" disabled={loading || !allConsentsAccepted(consents)} className="w-full h-12 bg-accent text-accent-foreground font-bold rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Se procesează..." : "Plasează comanda"}
            </button>
          </aside>
        </form>
      </section>
    </StorefrontLayout>
  );
}

function Input({ label, value, onChange, type = "text", inputMode, placeholder, autoComplete }: any) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      <input type={type} inputMode={inputMode} placeholder={placeholder} autoComplete={autoComplete}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 border border-border rounded-sm bg-background text-sm focus:outline-none focus:border-accent" />
    </label>
  );
}

function GeoSelect({ label, value, onChange, options, placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-11 rounded-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}
