import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Ticket, CreditCard, Banknote, Wallet, MapPin, Award } from "lucide-react";
import MokkaModal from "@/components/mokka/MokkaModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useCurrency } from "@/hooks/useCurrency";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { totalPoints, currentLevel, addPoints } = useLoyalty();
  const { format, currency } = useCurrency();
  const { hasFreeShipping, maxDiscount } = useCustomerGroups();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address: "", city: "", county: "", postalCode: "" });
  const [paymentMethod, setPaymentMethod] = useState("ramburs");
  const [installmentMonths, setInstallmentMonths] = useState("3");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [mokkaModalOpen, setMokkaModalOpen] = useState(false);
  const [mokkaIframeUrl, setMokkaIframeUrl] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<Tables<"addresses">[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [wantInvoice, setWantInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ companyName: "", cui: "", regCom: "", address: "" });

  useEffect(() => {
    if (user) {
      supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).then(({ data }) => {
        setSavedAddresses(data || []);
        const defaultAddr = data?.find(a => a.is_default);
        if (defaultAddr) {
          setForm(prev => ({
            ...prev,
            fullName: defaultAddr.full_name,
            phone: defaultAddr.phone,
            address: defaultAddr.address,
            city: defaultAddr.city,
            county: defaultAddr.county,
            postalCode: defaultAddr.postal_code || "",
          }));
        }
      });
      setForm(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p>Coșul este gol.</p>
          <Link to="/catalog"><Button className="mt-4">Vezi produse</Button></Link>
        </div>
      </Layout>
    );
  }

  const shipping = hasFreeShipping ? 0 : (totalPrice >= 200 ? 0 : 19.99);
  const groupDiscount = maxDiscount > 0 ? totalPrice * (maxDiscount / 100) : 0;
  const loyaltyDiscount = user && currentLevel ? (totalPrice * (currentLevel.discount_percentage / 100)) : 0;
  const subtotalAfterDiscounts = totalPrice - couponDiscount - loyaltyDiscount - groupDiscount;
  const total = Math.max(0, subtotalAfterDiscounts + shipping);
  const pointsEarned = user ? Math.floor(total / 10) : 0;

  const selectSavedAddress = (addrId: string) => {
    const addr = savedAddresses.find(a => a.id === addrId);
    if (!addr) return;
    setForm(prev => ({
      ...prev,
      fullName: addr.full_name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      county: addr.county,
      postalCode: addr.postal_code || "",
    }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const { data: coupon } = await supabase
      .from("coupons").select("*").eq("code", couponCode.trim().toUpperCase()).eq("is_active", true).maybeSingle();
    if (!coupon) { toast.error("Codul de reducere nu este valid"); setCouponLoading(false); return; }
    if (coupon.min_order_value && totalPrice < coupon.min_order_value) {
      toast.error(`Comanda minimă pentru acest cupon este ${format(coupon.min_order_value)}`); setCouponLoading(false); return;
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      toast.error("Acest cupon a expirat"); setCouponLoading(false); return;
    }
    if (user) {
      const { data: usage } = await supabase.from("coupon_usage").select("id").eq("coupon_id", coupon.id).eq("user_id", user.id).maybeSingle();
      if (usage) { toast.error("Ai folosit deja acest cupon"); setCouponLoading(false); return; }
    }
    const discount = coupon.discount_type === "percentage" ? totalPrice * (coupon.discount_value / 100) : coupon.discount_value;
    setCouponDiscount(Math.min(discount, totalPrice));
    setAppliedCoupon(coupon);
    toast.success(`Cupon aplicat! Economisești ${format(discount)}`);
    setCouponLoading(false);
  };

  const removeCoupon = () => { setCouponDiscount(0); setAppliedCoupon(null); setCouponCode(""); };

  const getInstallmentAmount = () => {
    const months = parseInt(installmentMonths);
    const interest = months <= 3 ? 0 : months <= 6 ? 0.05 : months <= 12 ? 0.09 : 0.15;
    return ((total * (1 + interest)) / months).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      toast.error("Numele trebuie să conțină minim 3 caractere"); return;
    }
    if (!form.phone.trim() || !/^(\+?4)?0[0-9]{9}$/.test(form.phone.replace(/\s/g, ""))) {
      toast.error("Numărul de telefon nu este valid (ex: 07xx xxx xxx)"); return;
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      toast.error("Adresa trebuie să conțină minim 5 caractere"); return;
    }
    if (!form.city.trim()) { toast.error("Completează orașul"); return; }
    if (!form.county.trim()) { toast.error("Completează județul"); return; }
    if (!user && (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) {
      toast.error("Adresa de email nu este validă"); return;
    }
    setSubmitting(true);

    const installmentData = (paymentMethod === "mokka" || paymentMethod === "paypo") ? {
      provider: paymentMethod, months: parseInt(installmentMonths), monthly_amount: parseFloat(getInstallmentAmount()),
    } : null;

    const orderData: any = {
      total,
      payment_method: paymentMethod,
      shipping_address: form,
      coupon_id: appliedCoupon?.id || null,
      discount_amount: couponDiscount + loyaltyDiscount,
      loyalty_points_earned: pointsEarned,
      payment_installments: installmentData,
      user_email: user?.email || form.email,
      currency,
    };

    if (user) {
      orderData.user_id = user.id;
    }

    const { data: order, error } = await supabase.from("orders").insert(orderData).select().single();
    if (error || !order) { toast.error("Eroare la plasarea comenzii"); setSubmitting(false); return; }

    const orderItems = items.map(i => ({
      order_id: order.id, product_id: i.product_id, quantity: i.quantity, price: i.product.price,
    }));
    await supabase.from("order_items").insert(orderItems);

    if (appliedCoupon && user) {
      await supabase.from("coupon_usage").insert({ coupon_id: appliedCoupon.id, user_id: user.id, order_id: order.id });
    }

    if (user && pointsEarned > 0) {
      await addPoints(pointsEarned, "purchase", `Comandă #${order.id.slice(0, 8)}`, order.id);
    }

    await clearCart();

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          type: "order_placed",
          to: user?.email || form.email,
          data: { orderId: order.id, customerName: form.fullName, total, paymentMethod, pointsEarned, items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })) },
        },
      });
    } catch (emailErr) { console.error("Email notification failed:", emailErr); }

    toast.success("Comanda a fost plasată cu succes!");
    navigate("/order-confirmation/" + order.id);
    setSubmitting(false);
  };

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Finalizare comandă</h1>

        {/* Guest / Auth toggle */}
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
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => selectSavedAddress(addr.id)}
                        className={`text-left p-3 rounded-lg border text-sm transition-colors hover:border-primary ${form.fullName === addr.full_name && form.address === addr.address ? "border-primary bg-primary/5" : ""}`}
                      >
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

              {/* Invoice option */}
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

              {/* Payment methods */}
              <h2 className="text-lg font-semibold pt-2">Metodă de plată</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="ramburs" id="ramburs" />
                  <Label htmlFor="ramburs" className="cursor-pointer flex-1 flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-muted-foreground" /> Ramburs la livrare
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="cursor-pointer flex-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" /> Card online
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 border-mokka/30 bg-mokka/5">
                  <RadioGroupItem value="mokka" id="mokka" />
                  <Label htmlFor="mokka" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-mokka" />
                      <div>
                        <span className="font-semibold text-mokka">Mokka – Plată în avans</span>
                        <p className="text-xs text-muted-foreground">Rate fără card · Primești instant banii, plătești în rate</p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 bg-emag-blue/5">
                  <RadioGroupItem value="paypo" id="paypo" />
                  <Label htmlFor="paypo" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emag-blue" />
                      <div>
                        <span className="font-semibold">PayPo</span>
                        <p className="text-xs text-muted-foreground">Cumperi acum, plătești mai târziu</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {(paymentMethod === "mokka" || paymentMethod === "paypo") && (
                <Card className="border-emag-blue/30">
                  <CardHeader className="pb-2"><CardTitle className="text-base">{paymentMethod === "mokka" ? "Rate Mokka TBI Bank" : "Rate PayPo"}</CardTitle></CardHeader>
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
                <h2 className="text-lg font-semibold pt-2 mb-2">Cod de reducere</h2>
                {appliedCoupon ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    <Ticket className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 flex-1">
                      {appliedCoupon.code} — {appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}%` : `${appliedCoupon.discount_value} lei`} reducere
                    </span>
                    <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-destructive">Elimină</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Introdu codul" className="flex-1" />
                    <Button type="button" variant="outline" onClick={applyCoupon} disabled={couponLoading}>
                      {couponLoading ? "..." : "Aplică"}
                    </Button>
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
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Cupon ({appliedCoupon?.code})</span>
                  <span>-{format(couponDiscount)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Reducere fidelitate ({currentLevel?.name})</span>
                  <span>-{format(loyaltyDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livrare</span>
                <span>{shipping === 0 ? "GRATUITĂ" : format(shipping)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{format(total)}</span>
              </div>
              {(paymentMethod === "mokka" || paymentMethod === "paypo") && (
                <div className="text-center text-sm text-emag-blue font-medium">
                  sau {installmentMonths} × {format(parseFloat(getInstallmentAmount()))}/lună
                </div>
              )}
              {pointsEarned > 0 && (
                <div className="bg-primary/5 rounded-lg p-2 text-center text-sm">
                  <span className="font-medium">+{pointsEarned} puncte fidelitate</span> la această comandă
                </div>
              )}
              <Button type="submit" className="w-full font-semibold" size="lg" disabled={submitting}>
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
