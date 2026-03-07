import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Ticket, CreditCard, Banknote, Wallet, MapPin, Award, Store, Building2, Info } from "lucide-react";
import MokkaModal from "@/components/mokka/MokkaModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useCurrency } from "@/hooks/useCurrency";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAffiliateCode } from "@/hooks/useAffiliateTracking";
import type { Tables } from "@/integrations/supabase/types";

const methodIcons: Record<string, any> = {
  cash: Banknote, card: CreditCard, bank_transfer: Building2, wallet: Wallet, installments: CreditCard, pickup: Store,
};

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { totalPoints, currentLevel, addPoints, config: loyaltyConfig, pointsToValue, maxRedeemablePoints } = useLoyalty();
  const { format, currency } = useCurrency();
  const { hasFreeShipping, maxDiscount, userGroups } = useCustomerGroups();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address: "", city: "", county: "", postalCode: "" });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState("3");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupons, setAppliedCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponExpanded, setCouponExpanded] = useState(false);
  const [mokkaModalOpen, setMokkaModalOpen] = useState(false);
  const [mokkaIframeUrl, setMokkaIframeUrl] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<Tables<"addresses">[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [wantInvoice, setWantInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ companyName: "", cui: "", regCom: "", address: "" });
  const [pointsToUse, setPointsToUse] = useState(0);

  // Fetch enabled payment methods from DB
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["checkout-payment-methods"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_methods").select("*").eq("is_active", true).order("display_order", { ascending: true });
      return data || [];
    },
  });

  // Filter methods by order total, county, and customer groups
  const availableMethods = useMemo(() => {
    const userGroupIds = userGroups.map((g: any) => g.id);
    return paymentMethods.filter((m: any) => {
      if (m.min_amount && totalPrice < m.min_amount) return false;
      if (m.max_amount && totalPrice > m.max_amount) return false;
      if (m.allowed_counties?.length && form.county && !m.allowed_counties.some((c: string) => c.toLowerCase() === form.county.toLowerCase())) return false;
      if (m.allowed_customer_groups?.length && !m.allowed_customer_groups.some((gid: string) => userGroupIds.includes(gid))) return false;
      return true;
    });
  }, [paymentMethods, totalPrice, form.county, userGroups]);

  // Auto-select first method
  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.find((m: any) => m.key === paymentMethod)) {
      setPaymentMethod(availableMethods[0].key);
    }
  }, [availableMethods, paymentMethod]);

  const selectedMethod = availableMethods.find((m: any) => m.key === paymentMethod);

  useEffect(() => {
    if (user) {
      supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).then(({ data }) => {
        setSavedAddresses(data || []);
        const defaultAddr = data?.find(a => a.is_default);
        if (defaultAddr) {
          setForm(prev => ({ ...prev, fullName: defaultAddr.full_name, phone: defaultAddr.phone, address: defaultAddr.address, city: defaultAddr.city, county: defaultAddr.county, postalCode: defaultAddr.postal_code || "" }));
        }
      });
      setForm(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  if (items.length === 0) {
    return <Layout><div className="container py-16 text-center"><p>Coșul este gol.</p><Link to="/catalog"><Button className="mt-4">Vezi produse</Button></Link></div></Layout>;
  }

  // Calculate extra fee from selected payment method
  const extraFee = selectedMethod ? (selectedMethod.extra_fee_type === "fixed" ? (selectedMethod.extra_fee_value || 0) : selectedMethod.extra_fee_type === "percent" ? totalPrice * ((selectedMethod.extra_fee_value || 0) / 100) : 0) : 0;

  const baseShipping = hasFreeShipping ? 0 : (totalPrice >= 200 ? 0 : 19.99);
  const groupDiscount = maxDiscount > 0 ? totalPrice * (maxDiscount / 100) : 0;
  const loyaltyDiscount = user && currentLevel ? (totalPrice * (currentLevel.discount_percentage / 100)) : 0;
  const pointsDiscount = pointsToValue(pointsToUse);
  const couponDiscount = appliedCoupons.reduce((sum, c) => sum + c._discount, 0);
  const couponFreeShipping = appliedCoupons.some(c => c.discount_type === "free_shipping" || c.includes_free_shipping);
  const shipping = couponFreeShipping ? 0 : baseShipping;
  const subtotalAfterDiscounts = totalPrice - couponDiscount - loyaltyDiscount - groupDiscount - pointsDiscount;
  const total = Math.max(0, subtotalAfterDiscounts + shipping + extraFee);
  const maxPoints = maxRedeemablePoints(totalPrice);
  const pointsEarned = user && loyaltyConfig.program_enabled ? Math.floor(total / loyaltyConfig.earn_rate_per_amount) * loyaltyConfig.earn_rate_points : 0;

  const selectSavedAddress = (addrId: string) => {
    const addr = savedAddresses.find(a => a.id === addrId);
    if (!addr) return;
    setForm(prev => ({ ...prev, fullName: addr.full_name, phone: addr.phone, address: addr.address, city: addr.city, county: addr.county, postalCode: addr.postal_code || "" }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const code = couponCode.trim().toUpperCase();
    // Check if already applied
    if (appliedCoupons.find(c => c.code === code)) { toast.error("Acest cod este deja aplicat"); setCouponLoading(false); return; }
    // Check stacking
    if (appliedCoupons.length > 0) {
      const existingAllowStacking = appliedCoupons.every(c => c.combine_with_codes);
      if (!existingAllowStacking) { toast.error("Codurile existente nu permit combinarea cu alte coduri"); setCouponLoading(false); return; }
    }
    const { data: coupon } = await supabase.from("coupons").select("*").eq("code", code).eq("is_active", true).maybeSingle();
    if (!coupon) { toast.error("Cod invalid"); setCouponLoading(false); return; }
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) { toast.error("Acest cod nu este încă activ"); setCouponLoading(false); return; }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) { toast.error("Cod expirat"); setCouponLoading(false); return; }
    if (coupon.min_order_value && totalPrice < coupon.min_order_value) { toast.error(`Valoare minimă comandă: ${format(coupon.min_order_value)}`); setCouponLoading(false); return; }
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    if (coupon.min_quantity && totalQty < coupon.min_quantity) { toast.error(`Cantitate minimă: ${coupon.min_quantity} produse`); setCouponLoading(false); return; }
    if (coupon.max_uses && (coupon.used_count || 0) >= coupon.max_uses) { toast.error("Ai atins limita de utilizări"); setCouponLoading(false); return; }
    if (appliedCoupons.length > 0 && !coupon.combine_with_codes) { toast.error("Acest cod nu se combină cu alte coduri"); setCouponLoading(false); return; }
    if (user) {
      if (coupon.max_uses_per_customer) {
        const { count } = await supabase.from("coupon_usage").select("id", { count: "exact", head: true }).eq("coupon_id", coupon.id).eq("user_id", user.id);
        if ((count || 0) >= coupon.max_uses_per_customer) { toast.error("Ai folosit deja acest cod de maximul de ori permis"); setCouponLoading(false); return; }
      }
      if (coupon.first_order_only) {
        const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id);
        if ((count || 0) > 0) { toast.error("Acest cod e valabil doar pentru prima comandă"); setCouponLoading(false); return; }
      }
      if (coupon.specific_customer_id && coupon.specific_customer_id !== user.id) { toast.error("Acest cod nu este valabil pentru contul tău"); setCouponLoading(false); return; }
    }
    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === "percentage" || coupon.discount_type === "combined") {
      discount = totalPrice * (coupon.discount_value / 100);
    } else if (coupon.discount_type === "fixed") {
      discount = coupon.discount_value;
    }
    discount = Math.min(discount, totalPrice);
    const enriched = { ...coupon, _discount: discount };
    setAppliedCoupons(prev => [...prev, enriched]);
    setCouponCode("");
    toast.success(`Cupon aplicat! Economisești ${format(discount)}`);
    setCouponLoading(false);
  };

  const removeCoupon = (couponId: string) => {
    setAppliedCoupons(prev => prev.filter(c => c.id !== couponId));
  };

  const getInstallmentAmount = () => {
    const months = parseInt(installmentMonths);
    const interest = months <= 3 ? 0 : months <= 6 ? 0.05 : months <= 12 ? 0.09 : 0.15;
    return ((total * (1 + interest)) / months).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || form.fullName.trim().length < 3) { toast.error("Numele trebuie să conțină minim 3 caractere"); return; }
    if (!form.phone.trim() || !/^(\+?4)?0[0-9]{9}$/.test(form.phone.replace(/\s/g, ""))) { toast.error("Numărul de telefon nu este valid"); return; }
    if (!form.address.trim() || form.address.trim().length < 5) { toast.error("Adresa trebuie să conțină minim 5 caractere"); return; }
    if (!form.city.trim()) { toast.error("Completează orașul"); return; }
    if (!form.county.trim()) { toast.error("Completează județul"); return; }
    if (!user && (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) { toast.error("Adresa de email nu este validă"); return; }
    setSubmitting(true);

    const isInstallments = selectedMethod?.type === "installments";
    const installmentData = isInstallments ? { provider: selectedMethod.provider || paymentMethod, months: parseInt(installmentMonths), monthly_amount: parseFloat(getInstallmentAmount()) } : null;

    const orderData: any = {
      total, payment_method: paymentMethod, shipping_address: form,
      coupon_id: appliedCoupons[0]?.id || null,
      discount_amount: couponDiscount + loyaltyDiscount + groupDiscount + pointsDiscount,
      loyalty_points_earned: pointsEarned,
      payment_installments: installmentData,
      user_email: user?.email || form.email,
      currency,
    };
    if (extraFee > 0) orderData.payment_fee = extraFee;
    if (user) orderData.user_id = user.id;

    // Bank transfer → status pending
    if (selectedMethod?.type === "bank_transfer") orderData.status = "în așteptare plată";

    const affCode = getAffiliateCode();
    if (affCode) {
      const { data: aff } = await supabase.from("affiliates").select("id").eq("affiliate_code", affCode).eq("status", "active").maybeSingle();
      if (aff) orderData.affiliate_id = aff.id;
    }

    const { data: order, error } = await supabase.from("orders").insert(orderData).select().single();
    if (error || !order) { toast.error("Eroare la plasarea comenzii"); setSubmitting(false); return; }

    const orderItems = items.map(i => ({ order_id: order.id, product_id: i.product_id, quantity: i.quantity, price: i.product.price }));
    await supabase.from("order_items").insert(orderItems);

    if (appliedCoupons.length > 0 && user) {
      for (const ac of appliedCoupons) {
        await supabase.from("coupon_usage").insert({ coupon_id: ac.id, user_id: user.id, order_id: order.id });
      }
    }
    if (user && pointsToUse > 0) await addPoints(-pointsToUse, "redeem", `Folosite la comandă #${order.id.slice(0, 8)}`, order.id);
    if (user && pointsEarned > 0 && pointsToUse < totalPoints) await addPoints(pointsEarned, "purchase", `Comandă #${order.id.slice(0, 8)}`, order.id);

    await clearCart();

    try {
      await supabase.functions.invoke("send-email", {
        body: { type: "order_placed", to: user?.email || form.email, data: { orderId: order.id, customerName: form.fullName, total, paymentMethod, pointsEarned, items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })) } },
      });
    } catch (emailErr) { console.error("Email notification failed:", emailErr); }

    toast.success("Comanda a fost plasată cu succes!");
    navigate("/order-confirmation/" + order.id);
    setSubmitting(false);
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const feeLabel = (m: any) => {
    if (m.extra_fee_type === "fixed" && m.extra_fee_value > 0) return `+${m.extra_fee_value} lei`;
    if (m.extra_fee_type === "percent" && m.extra_fee_value > 0) return `+${m.extra_fee_value}%`;
    return null;
  };

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Finalizare comandă</h1>

        {!user && (
          <Card className="mb-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Ai deja un cont?</p>
                <p className="text-xs text-muted-foreground">Autentifică-te pentru a beneficia de puncte de fidelitate și istoric comenzi.</p>
              </div>
              <Link to="/auth?redirect=/checkout"><Button variant="outline" size="sm">Autentifică-te</Button></Link>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Saved addresses */}
              {user && savedAddresses.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><MapPin className="h-5 w-5" /> Adrese salvate</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {savedAddresses.map(addr => (
                      <button key={addr.id} type="button" onClick={() => selectSavedAddress(addr.id)}
                        className={`text-left p-3 rounded-lg border text-sm transition-colors hover:border-primary ${form.fullName === addr.full_name && form.address === addr.address ? "border-primary bg-primary/5" : ""}`}>
                        <p className="font-medium">{addr.label} — {addr.full_name}</p>
                        <p className="text-muted-foreground text-xs">{addr.address}, {addr.city}, {addr.county}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <h2 className="text-lg font-semibold">Adresa de livrare</h2>
              <div className="space-y-3">
                <div><Label>Nume complet *</Label><Input value={form.fullName} onChange={e => updateField("fullName", e.target.value)} required /></div>
                {!user && <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} required /></div>}
                <div><Label>Telefon *</Label><Input value={form.phone} onChange={e => updateField("phone", e.target.value)} required /></div>
                <div><Label>Adresă *</Label><Input value={form.address} onChange={e => updateField("address", e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Oraș *</Label><Input value={form.city} onChange={e => updateField("city", e.target.value)} required /></div>
                  <div><Label>Județ *</Label><Input value={form.county} onChange={e => updateField("county", e.target.value)} required /></div>
                </div>
                <div><Label>Cod poștal</Label><Input value={form.postalCode} onChange={e => updateField("postalCode", e.target.value)} /></div>
              </div>

              {/* Invoice */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={wantInvoice} onCheckedChange={v => setWantInvoice(!!v)} />
                  <span className="text-sm font-medium">Doresc factură pe firmă</span>
                </label>
                {wantInvoice && (
                  <div className="mt-3 space-y-3 pl-6 border-l-2 border-primary/20">
                    <div><Label>Denumire firmă</Label><Input value={invoiceForm.companyName} onChange={e => setInvoiceForm(p => ({ ...p, companyName: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>CUI</Label><Input value={invoiceForm.cui} onChange={e => setInvoiceForm(p => ({ ...p, cui: e.target.value }))} /></div>
                      <div><Label>Reg. Com.</Label><Input value={invoiceForm.regCom} onChange={e => setInvoiceForm(p => ({ ...p, regCom: e.target.value }))} /></div>
                    </div>
                    <div><Label>Adresă sediu</Label><Input value={invoiceForm.address} onChange={e => setInvoiceForm(p => ({ ...p, address: e.target.value }))} /></div>
                  </div>
                )}
              </div>

              {/* Dynamic payment methods */}
              <h2 className="text-lg font-semibold pt-2">Metodă de plată</h2>
              {availableMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nu sunt metode de plată disponibile pentru această comandă.</p>
              ) : (
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {availableMethods.map((m: any) => {
                    const Icon = methodIcons[m.type] || CreditCard;
                    const fee = feeLabel(m);
                    return (
                      <div key={m.key} className="flex items-center space-x-2 border rounded-lg p-3 hover:border-primary/50 transition-colors">
                        <RadioGroupItem value={m.key} id={`pm-${m.key}`} />
                        <Label htmlFor={`pm-${m.key}`} className="cursor-pointer flex-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{m.name}</span>
                                {fee && <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">{fee}</Badge>}
                              </div>
                              {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}

              {/* Bank transfer details */}
              {selectedMethod?.type === "bank_transfer" && selectedMethod.bank_details && (() => {
                const bd = selectedMethod.bank_details as Record<string, any>;
                return (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2"><Info className="h-4 w-4" /> Detalii plată transfer bancar</div>
                    {bd.bank_name && <p className="text-xs"><span className="text-muted-foreground">Banca:</span> {bd.bank_name}</p>}
                    {bd.iban && <p className="text-xs"><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{bd.iban}</span></p>}
                    {bd.account_holder && <p className="text-xs"><span className="text-muted-foreground">Titular:</span> {bd.account_holder}</p>}
                    {selectedMethod.payment_deadline_days && <p className="text-xs text-amber-700 mt-1">⏳ Termen plată: {selectedMethod.payment_deadline_days} zile</p>}
                  </CardContent>
                </Card>
                );
              })()}

              {/* Installment selector */}
              {selectedMethod?.type === "installments" && (
                <Card className="border-primary/30">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Rate {selectedMethod.name}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Număr de rate</Label>
                      <Select value={installmentMonths} onValueChange={setInstallmentMonths}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 rate (0% dobândă)</SelectItem>
                          <SelectItem value="6">6 rate (5% dobândă)</SelectItem>
                          <SelectItem value="12">12 rate (9% dobândă)</SelectItem>
                          <SelectItem value="24">24 rate (15% dobândă)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Rată lunară</p>
                      <p className="text-2xl font-bold text-primary">{format(parseFloat(getInstallmentAmount()))}/lună</p>
                      <p className="text-xs text-muted-foreground">× {installmentMonths} luni</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Coupon */}
              <div>
                <button type="button" onClick={() => setCouponExpanded(!couponExpanded)} className="text-sm font-semibold pt-2 mb-2 flex items-center gap-2 hover:text-primary transition-colors">
                  <Ticket className="h-4 w-4" /> Ai un cod de reducere?
                </button>
                {couponExpanded && (
                  <div className="space-y-2">
                    {appliedCoupons.map(ac => (
                      <div key={ac.id} className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                        <Ticket className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400 flex-1">
                          {ac.code} — {ac.discount_type === "free_shipping" ? "Transport gratuit" : ac.discount_type === "percentage" || ac.discount_type === "combined" ? `${ac.discount_value}%` : `${ac.discount_value} lei`}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => removeCoupon(ac.id)} className="text-destructive h-7 px-2">✕</Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Introdu codul" className="flex-1" />
                      <Button type="button" variant="outline" onClick={applyCoupon} disabled={couponLoading}>{couponLoading ? "..." : "Aplică"}</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-card rounded-lg border p-6 h-fit sticky top-24 space-y-3">
              <h2 className="font-bold text-lg">Rezumat comandă</h2>
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{item.product.name} x{item.quantity}</span>
                  <span>{format(item.product.price * item.quantity)}</span>
                </div>
              ))}
              {couponDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Cupon ({appliedCoupon?.code})</span><span>-{format(couponDiscount)}</span></div>}
              {loyaltyDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Reducere fidelitate ({currentLevel?.name})</span><span>-{format(loyaltyDiscount)}</span></div>}
              {pointsDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Puncte folosite ({pointsToUse})</span><span>-{format(pointsDiscount)}</span></div>}
              {groupDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount grup</span><span>-{format(groupDiscount)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Livrare</span><span>{shipping === 0 ? "GRATUITĂ" : format(shipping)}</span></div>
              {extraFee > 0 && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span>Taxă {selectedMethod?.name}</span>
                  <span>+{format(extraFee)}</span>
                </div>
              )}

              {/* Points slider */}
              {user && maxPoints > 0 && loyaltyConfig.program_enabled && (
                <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium"><Award className="h-4 w-4 text-primary" /><span>Folosește punctele ({totalPoints} disponibile)</span></div>
                  <Slider value={[pointsToUse]} onValueChange={([v]) => setPointsToUse(v)} max={maxPoints} min={0} step={1} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{pointsToUse} puncte</span><span>= -{format(pointsToValue(pointsToUse))} reducere</span></div>
                  <p className="text-[10px] text-muted-foreground">Max {loyaltyConfig.max_redeem_percent}% din total, minim {loyaltyConfig.min_points_redeem} puncte</p>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">{format(total)}</span></div>
              {selectedMethod?.type === "installments" && (
                <div className="text-center text-sm text-primary font-medium">sau {installmentMonths} × {format(parseFloat(getInstallmentAmount()))}/lună</div>
              )}
              {pointsEarned > 0 && (
                <div className="bg-primary/5 rounded-lg p-2 text-center text-sm"><span className="font-medium">+{pointsEarned} puncte fidelitate</span> la această comandă</div>
              )}
              <Button type="submit" className="w-full font-semibold" size="lg" disabled={submitting || availableMethods.length === 0}>
                {submitting ? "Se procesează..." : "Plasează comanda"}
              </Button>
            </div>
          </div>
        </form>
        <MokkaModal isOpen={mokkaModalOpen} onClose={() => setMokkaModalOpen(false)} iframeUrl={mokkaIframeUrl} />
      </div>
    </Layout>
  );
}
