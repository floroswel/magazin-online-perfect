import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import useRomaniaGeo from "@/hooks/useRomaniaGeo";
import { Gift, Lock, RotateCcw, Package, ChevronDown, Search, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Types ───
interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  price: number;
  free_above: number | null;
  estimated_days: string | null;
}


// ─── Defaults ───
const DEFAULT_SHIPPING: ShippingMethod[] = [
  { id: "standard", name: "Curier standard", description: "Livrare în 3-5 zile lucrătoare", icon: "🚚", price: 25, free_above: 200, estimated_days: "3-5 zile" },
  { id: "express", name: "Curier express", description: "Livrare în 1-2 zile lucrătoare", icon: "⚡", price: 35, free_above: null, estimated_days: "1-2 zile" },
  { id: "easybox", name: "Easybox", description: "Ridicare din locker Sameday", icon: "📦", price: 15, free_above: null, estimated_days: "2-3 zile" },
];

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const siteName = settings.site_name || "Mama Lucica";
  usePageSeo({ title: `Finalizare Comandă | ${siteName}`, noindex: true });

  // ─── Settings ───
  const s = (key: string, def = "") => settings[key] || def;
  const sBool = (key: string, def = true) => (settings[key] ?? (def ? "true" : "false")) === "true";

  // ─── Auth state ───
  const [authMode, setAuthMode] = useState<"logged" | "login" | "guest">(user ? "logged" : "guest");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => { if (user) setAuthMode("logged"); }, [user]);

  const handleLogin = async () => {
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    if (error) toast.error(error.message);
    else toast.success("Autentificare reușită!");
    setLoginLoading(false);
  };

  // ─── Form state ───
  const [form, setForm] = useState({
    email: user?.email || "",
    lastName: "", firstName: "", phone: "",
    differentContact: false,
    contactLastName: "", contactFirstName: "", contactPhone: "",
    countyId: "", localityId: "", address: "", postalCode: "", bloc: "",
    shippingMethod: "standard",
    differentBilling: false, billingType: "fizica" as "fizica" | "juridica",
    billingCui: "", billingCompany: "", billingRegCom: "",
    billingCountyId: "", billingLocalityId: "", billingAddress: "",
    openPackage: false,
    paymentMethod: "ramburs",
    tbiMonths: 4,
    observations: "",
    termsAccepted: false, privacyAccepted: false, newsletter: false,
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { if (user?.email && !form.email) set("email", user.email); }, [user]);

  // ─── Coupon ───
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const { data, error } = await supabase.rpc("validate_coupon", {
      p_coupon_code: couponCode.toUpperCase(),
      p_cart_total: totalPrice,
      p_user_id: user?.id || null,
    });
    setCouponLoading(false);
    if (error || !data) return toast.error("Eroare la validare");
    const result = data as any;
    if (!result.valid) return toast.error(result.message);
    setCouponApplied(result);
    toast.success("Cod aplicat: " + result.message);
  };

  // ─── Loyalty points ───
  // Fetch total balance (sum of all point transactions)
  const { data: loyaltyBalance } = useQuery({
    queryKey: ["loyalty-balance", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase.from("loyalty_points").select("points").eq("user_id", user.id);
      return (data || []).reduce((sum: number, r: any) => sum + r.points, 0);
    },
    enabled: !!user,
  });

  // Conversion: 100 points = 5 RON (from use_loyalty_points DB function)
  const POINTS_PER_RON = 20; // 100pts / 5RON
  const maxPercentAllowed = parseInt(s("checkout_fidelity_max_percent", "30"));

  // Max discount = min(points value in RON, 30% of cart total)
  const loyaltyBalanceRON = useMemo(() => {
    if (!loyaltyBalance || loyaltyBalance <= 0) return 0;
    return loyaltyBalance / POINTS_PER_RON; // points → RON
  }, [loyaltyBalance]);

  const maxLoyaltyDiscount = useMemo(() => {
    const maxByPercent = totalPrice * (maxPercentAllowed / 100);
    return Math.min(loyaltyBalanceRON, maxByPercent);
  }, [loyaltyBalanceRON, maxPercentAllowed, totalPrice]);

  // Slider value = RON to apply (0 → maxLoyaltyDiscount)
  const [loyaltyDiscountRON, setLoyaltyDiscountRON] = useState(0);

  // Clamp if cart total changes
  useEffect(() => {
    if (loyaltyDiscountRON > maxLoyaltyDiscount) {
      setLoyaltyDiscountRON(Math.floor(maxLoyaltyDiscount));
    }
  }, [maxLoyaltyDiscount]);

  const loyaltyDiscount = loyaltyDiscountRON;
  const loyaltyPointsUsed = Math.round(loyaltyDiscountRON * POINTS_PER_RON);

  // ─── Counties & localities via hook ───
  const shipping = useRomaniaGeo();
  const billing = useRomaniaGeo();

  const counties = shipping.judete;

  // Fetch localities when county changes
  useEffect(() => {
    set("localityId", "");
    if (form.countyId) {
      shipping.fetchLocalitati(parseInt(form.countyId));
    } else {
      shipping.clearLocalitati();
    }
  }, [form.countyId]);

  useEffect(() => {
    set("billingLocalityId", "");
    if (form.billingCountyId) {
      billing.fetchLocalitati(parseInt(form.billingCountyId));
    } else {
      billing.clearLocalitati();
    }
  }, [form.billingCountyId]);

  const localities = shipping.localitati;
  const billingLocalities = billing.localitati;

  // ─── Shipping ───
  const { data: shippingMethodsDB } = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: async () => {
      const { data } = await supabase.from("shipping_methods").select("*").eq("is_active", true).order("sort_order");
      return (data || []) as ShippingMethod[];
    },
  });
  const shippingMethods = shippingMethodsDB && shippingMethodsDB.length > 0 ? shippingMethodsDB : DEFAULT_SHIPPING;

  // ─── CUI lookup ───
  const [cuiLoading, setCuiLoading] = useState(false);
  const lookupCUI = async () => {
    const cui = form.billingCui.replace(/\D/g, "");
    if (!cui || cui.length < 2) return toast.error("Introduceți un CUI valid");
    setCuiLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const resp = await fetch("https://webservicesp.anaf.ro/AsynchWebService/api/v8/ws/tva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ cui: parseInt(cui), data: today }]),
      });
      const data = await resp.json();
      const found = data?.found?.[0];
      if (found) {
        set("billingCompany", found.denumire || "");
        set("billingRegCom", found.nrRegCom || "");
        set("billingAddress", found.adresa || "");
        toast.success("Date firma completate!");
      } else {
        toast.error("CUI negăsit la ANAF");
      }
    } catch {
      toast.error("Eroare conexiune ANAF");
    }
    setCuiLoading(false);
  };

  // ─── Calculations ───
  const selectedMethod = shippingMethods.find(m => (m.id || m.name) === form.shippingMethod) || shippingMethods[0];
  const freeThreshold = parseInt(s("checkout_free_shipping_threshold", "200"));
  const shippingCost = selectedMethod
    ? (selectedMethod.free_above && totalPrice >= selectedMethod.free_above ? 0 : selectedMethod.price === 0 ? 0 : selectedMethod.price)
    : 0;
  const rambursCostValue = parseInt(settings.ramburs_extra_cost || "5");
  const rambursCost = form.paymentMethod === "ramburs" ? rambursCostValue : 0;
  const openPackagePrice = parseFloat(s("checkout_open_package_price", "24.99"));
  const openPackageCost = form.openPackage ? openPackagePrice : 0;

  const couponDiscount = useMemo(() => {
    if (!couponApplied) return 0;
    if (couponApplied.discount_type === "percentage") {
      const d = totalPrice * (couponApplied.discount_value / 100);
      return couponApplied.max_discount_amount ? Math.min(d, couponApplied.max_discount_amount) : d;
    }
    return couponApplied.discount_value || 0;
  }, [couponApplied, totalPrice]);

  const finalTotal = Math.max(0, totalPrice - couponDiscount - loyaltyDiscount + shippingCost + rambursCost + openPackageCost);

  // ─── Validation ───
  const canSubmit = form.email && form.lastName && form.firstName && form.phone
    && form.countyId && form.localityId && form.address
    && form.termsAccepted && form.privacyAccepted;

  // ─── Place order ───
  const placeOrder = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const selectedCounty = counties?.find(c => c.id === parseInt(form.countyId));
      const selectedLocality = localities?.find(l => l.id === parseInt(form.localityId));
      const contactName = form.differentContact
        ? `${form.contactFirstName} ${form.contactLastName}`
        : `${form.firstName} ${form.lastName}`;
      const contactPhone = form.differentContact ? form.contactPhone : form.phone;

      const shippingAddress = {
        fullName: contactName,
        phone: contactPhone,
        address: form.address,
        bloc: form.bloc,
        city: selectedLocality?.nume || "",
        county: selectedCounty?.nume || "",
        postalCode: form.postalCode,
      };

      let billingAddress: any = shippingAddress;
      if (form.differentBilling) {
        const billingCounty = counties?.find(c => c.id === parseInt(form.billingCountyId));
        const billingLoc = billingLocalities?.find(l => l.id === parseInt(form.billingLocalityId));
        billingAddress = {
          fullName: form.billingType === "juridica" ? form.billingCompany : `${form.firstName} ${form.lastName}`,
          type: form.billingType,
          cui: form.billingCui,
          regCom: form.billingRegCom,
          company: form.billingCompany,
          address: form.billingAddress || form.address,
          city: billingLoc?.nume || selectedLocality?.nume || "",
          county: billingCounty?.nume || selectedCounty?.nume || "",
        };
      }

      const paymentStatus = ["card", "mokka", "paypo"].includes(form.paymentMethod) ? "pending" : "unpaid";
      const orderStatus = ["card", "mokka", "paypo"].includes(form.paymentMethod) ? "pending_payment" : "pending";

      const orderData: any = {
        user_id: user?.id || "00000000-0000-0000-0000-000000000000",
        user_email: form.email,
        status: orderStatus,
        payment_method: form.paymentMethod,
        payment_status: paymentStatus,
        total: finalTotal,
        subtotal: totalPrice,
        shipping_total: shippingCost,
        discount_amount: couponDiscount + loyaltyDiscount,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        notes: form.observations || "",
        coupon_id: couponApplied?.coupon_id || null,
      };

      const { data: order, error } = await supabase.from("orders").insert(orderData).select("id, order_number").single();
      if (error) throw error;

      // Order items
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

      // Record coupon usage
      if (couponApplied?.coupon_id && user?.id) {
        await supabase.from("coupon_usage" as any).insert({ coupon_id: couponApplied.coupon_id, user_id: user.id, order_id: order.id } as any);
      }

      // Redeem loyalty points
      if (loyaltyPointsUsed > 0 && user?.id) {
        await supabase.rpc("use_loyalty_points", { p_user_id: user.id, p_points_to_use: loyaltyPointsUsed, p_order_id: order.id });
      }

      // Open package service fee
      if (form.openPackage) {
        await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: null,
          product_name: "Serviciu deschidere colet la livrare",
          quantity: 1,
          unit_price: openPackagePrice,
          total_price: openPackagePrice,
        } as any);
      }

      // Emails (fire-and-forget)
      supabase.functions.invoke("send-email", {
        body: {
          type: "order_placed", to: form.email,
          data: {
            orderId: order.id, orderNumber: order.order_number,
            customerName: `${form.firstName} ${form.lastName}`,
            total: finalTotal, paymentMethod: form.paymentMethod,
            items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price, image_url: i.product.image_url })),
            shippingAddress,
          },
        },
      }).catch(console.error);

      supabase.functions.invoke("send-email", {
        body: {
          type: "admin_new_order", to: settings.contact_email || "admin@mamalucica.ro",
          data: {
            orderId: order.id, orderNumber: order.order_number,
            customerName: `${form.firstName} ${form.lastName}`, email: form.email,
            total: finalTotal, paymentMethod: form.paymentMethod,
            items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
            shippingAddress,
          },
        },
      }).catch(console.error);

      await clearCart();

      // Payment redirects
      if (form.paymentMethod === "card") {
        try {
          const { data: payData } = await supabase.functions.invoke("netopia-payment", {
            body: { orderId: order.id, amount: finalTotal, email: form.email, firstName: form.firstName, lastName: form.lastName },
          });
          if (payData?.paymentUrl) { window.location.href = payData.paymentUrl; return; }
        } catch (e) { console.error("Netopia redirect failed:", e); }
      }
      if (form.paymentMethod === "mokka") {
        try {
          const { data: payData } = await supabase.functions.invoke("mokka-payment", {
            body: { orderId: order.id, amount: finalTotal, email: form.email },
          });
          if (payData?.redirectUrl) { window.location.href = payData.redirectUrl; return; }
        } catch (e) { console.error("Mokka redirect failed:", e); }
      }
      if (form.paymentMethod === "paypo") {
        try {
          const { data: payData } = await supabase.functions.invoke("paypo-payment", {
            body: { orderId: order.id, amount: finalTotal, email: form.email },
          });
          if (payData?.redirectUrl) { window.location.href = payData.redirectUrl; return; }
        } catch (e) { console.error("PayPo redirect failed:", e); }
      }

      navigate(`/order-confirmation/${order.id}`);
    } catch (err: any) {
      toast.error("Eroare: " + (err.message || "Încearcă din nou"));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Empty cart ───
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

  const sectionClass = "bg-card rounded-xl border border-border p-5 md:p-6";

  return (
    <Layout>
      <div className="lumax-container py-6 pb-16">
        <h1 className="text-xl md:text-2xl font-extrabold mb-6">Finalizare Comandă</h1>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* ─── LEFT COLUMN ─── */}
          <div className="space-y-5">

            {/* ─── BANNER FIDELITATE ─── */}
            {sBool("checkout_fidelity_banner_show") && !user && (
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Gift className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">Vrei REDUCERE la toate comenzile viitoare?</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {s("checkout_fidelity_banner_text", "Fă-ți cont și acumulează Puncte de Fidelitate ce pot fi utilizate ca Reducere la următoarele comenzi!")}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setAuthMode("login")}>Creează cont</Button>
                      <Button size="sm" variant="outline" onClick={() => setAuthMode("guest")}>Continuă fără cont</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── BLOC 1: AUTENTIFICARE ─── */}
            {!user && (
              <div className={sectionClass}>
                <h2 className="text-base font-bold mb-3">Ai mai cumpărat de la noi?</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="authMode" checked={authMode === "login"} onChange={() => setAuthMode("login")} className="text-primary" />
                    <span className="text-sm font-medium">Intră în cont</span>
                  </label>
                  {authMode === "login" && (
                    <div className="pl-6 space-y-2">
                      <Input placeholder="Email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                      <Input placeholder="Parolă" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
                      <div className="flex gap-2 items-center">
                        <Button size="sm" onClick={handleLogin} disabled={loginLoading}>
                          {loginLoading ? "Se conectează..." : "Autentifică-te"}
                        </Button>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline">Am uitat parola</Link>
                      </div>
                    </div>
                  )}
                  {sBool("checkout_guest_option_show") && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="authMode" checked={authMode === "guest"} onChange={() => setAuthMode("guest")} className="text-primary" />
                      <span className="text-sm font-medium">Doresc comandă fără cont de client</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* ─── BLOC 2: COD REDUCERE / PUNCTE ─── */}
            {sBool("checkout_coupon_show") && (
              <div className={sectionClass}>
                <h2 className="text-base font-bold mb-3">Cod reducere / Puncte fidelitate</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Ai un cod de reducere?</Label>
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Introdu codul"
                        className="flex-1"
                        disabled={!!couponApplied}
                      />
                      {couponApplied ? (
                        <Button variant="outline" onClick={() => { setCouponApplied(null); setCouponCode(""); }}>Șterge</Button>
                      ) : (
                        <Button onClick={applyCoupon} disabled={couponLoading}>{couponLoading ? "..." : "Aplică"}</Button>
                      )}
                    </div>
                    {couponApplied && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Cod aplicat: -{couponApplied.discount_type === "percentage" ? `${couponApplied.discount_value}%` : format(couponApplied.discount_value)}
                      </p>
                    )}
                  </div>

                  {user && loyaltyBalance && loyaltyBalance > 0 && (
                    <div className="border-t border-border pt-3">
                      <Label className="text-sm mb-1.5 block">
                        Folosește punctele tale: <span className="font-bold text-primary">{loyaltyBalance} puncte</span> = {format(loyaltyBalanceRON)}
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Poți aplica maxim {maxPercentAllowed}% din valoarea comenzii ({format(maxLoyaltyDiscount)})
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">0</span>
                        <Slider
                          value={[loyaltyDiscountRON]}
                          onValueChange={([v]) => setLoyaltyDiscountRON(v)}
                          max={Math.floor(maxLoyaltyDiscount)}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground">{format(maxLoyaltyDiscount)}</span>
                      </div>
                      {loyaltyDiscount > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Aplici {loyaltyPointsUsed} puncte = -{format(loyaltyDiscount)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── BLOC 3: DATE DE CONTACT ─── */}
            <div className={sectionClass}>
              <h2 className="text-base font-bold mb-3">Date de contact</h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input value={form.email} onChange={e => set("email", e.target.value)} type="email" placeholder="email@exemplu.ro" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nume *</Label>
                    <Input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Popescu" />
                  </div>
                  <div>
                    <Label className="text-xs">Prenume *</Label>
                    <Input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Maria" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Telefon *</Label>
                  <Input value={form.phone} onChange={e => set("phone", e.target.value)} type="tel" placeholder="07XX XXX XXX" />
                </div>

                {sBool("checkout_different_contact_show") && (
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={form.differentContact} onCheckedChange={v => set("differentContact", !!v)} />
                      <span className="text-sm">Date de contact diferite pentru livrare</span>
                    </label>
                    {form.differentContact && (
                      <div className="grid grid-cols-2 gap-3 mt-3 pl-6">
                        <div>
                          <Label className="text-xs">Nume livrare</Label>
                          <Input value={form.contactLastName} onChange={e => set("contactLastName", e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Prenume livrare</Label>
                          <Input value={form.contactFirstName} onChange={e => set("contactFirstName", e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Telefon livrare</Label>
                          <Input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} type="tel" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ─── BLOC 4: LIVRARE (adresă) ─── */}
            <div className={sectionClass}>
              <h2 className="text-base font-bold mb-3">Adresa de livrare</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Județ *</Label>
                    <Select value={form.countyId} onValueChange={v => set("countyId", v)}>
                      <SelectTrigger><SelectValue placeholder="Alege județul" /></SelectTrigger>
                      <SelectContent>
                        {(counties || []).map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.nume}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Localitate *</Label>
                    <Select value={form.localityId} onValueChange={v => set("localityId", v)} disabled={!form.countyId}>
                      <SelectTrigger><SelectValue placeholder={form.countyId ? "Alege localitatea" : "Alege mai întâi județul"} /></SelectTrigger>
                      <SelectContent>
                        {(localities || []).map(l => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.nume}{l.tip ? ` (${l.tip})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Adresă (stradă, nr.) *</Label>
                  <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Str. Exemplu, Nr. 10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Cod Poștal</Label>
                    <Input value={form.postalCode} onChange={e => set("postalCode", e.target.value)} placeholder="010101" />
                  </div>
                  <div>
                    <Label className="text-xs">Bloc / Sc. / Ap.</Label>
                    <Input value={form.bloc} onChange={e => set("bloc", e.target.value)} placeholder="Bl. A, Sc. 1, Ap. 5" />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── BLOC 5: METODĂ LIVRARE ─── */}
            <div className={sectionClass}>
              <h2 className="text-base font-bold mb-3">Metodă de livrare</h2>
              <div className="space-y-2">
                {shippingMethods.map(method => {
                  const key = method.id || method.name;
                  const isFree = method.free_above && totalPrice >= method.free_above;
                  const displayPrice = method.price === 0 || isFree ? "GRATUIT" : `${method.price} RON`;
                  return (
                    <button
                      key={key}
                      onClick={() => set("shippingMethod", key)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        form.shippingMethod === key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{method.icon || "🚚"}</span>
                          <div>
                            <p className="text-sm font-bold">{method.name}</p>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${displayPrice === "GRATUIT" ? "text-green-600" : ""}`}>{displayPrice}</span>
                      </div>
                      {method.free_above && !isFree && (
                        <p className="text-xs text-muted-foreground mt-1 ml-9">Gratuit la comenzi peste {method.free_above} RON</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── BLOC 6: FACTURARE ─── */}
            {sBool("checkout_different_billing_show") && (
              <div className={sectionClass}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.differentBilling} onCheckedChange={v => set("differentBilling", !!v)} />
                  <span className="text-sm font-bold">Doresc date de facturare diferite</span>
                </label>

                {form.differentBilling && (
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="billingType" checked={form.billingType === "fizica"} onChange={() => set("billingType", "fizica")} />
                        <span className="text-sm">Persoană fizică</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="billingType" checked={form.billingType === "juridica"} onChange={() => set("billingType", "juridica")} />
                        <span className="text-sm">Persoană juridică</span>
                      </label>
                    </div>

                    {form.billingType === "juridica" && sBool("checkout_cui_search_show") && (
                      <div className="space-y-3 border border-border rounded-lg p-4">
                        <Label className="text-xs font-semibold">Caută firma după CUI (doar cifre)</Label>
                        <div className="flex gap-2">
                          <Input value={form.billingCui} onChange={e => set("billingCui", e.target.value.replace(/\D/g, ""))} placeholder="CUI (ex: 12345678)" />
                          <Button variant="outline" onClick={lookupCUI} disabled={cuiLoading}>
                            <Search className="w-4 h-4 mr-1" /> {cuiLoading ? "..." : "Caută la ANAF"}
                          </Button>
                        </div>
                        {form.billingCompany && (
                          <div className="space-y-2 text-sm">
                            <div>
                              <Label className="text-xs">Nume firmă</Label>
                              <Input value={form.billingCompany} onChange={e => set("billingCompany", e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-xs">Nr. Reg. Com.</Label>
                              <Input value={form.billingRegCom} onChange={e => set("billingRegCom", e.target.value)} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Județ facturare</Label>
                        <Select value={form.billingCountyId} onValueChange={v => set("billingCountyId", v)}>
                          <SelectTrigger><SelectValue placeholder="Alege județul" /></SelectTrigger>
                          <SelectContent>
                            {(counties || []).map(c => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.nume}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Localitate facturare</Label>
                        <Select value={form.billingLocalityId} onValueChange={v => set("billingLocalityId", v)} disabled={!form.billingCountyId}>
                          <SelectTrigger><SelectValue placeholder="Alege localitatea" /></SelectTrigger>
                          <SelectContent>
                            {(billingLocalities || []).map(l => (
                              <SelectItem key={l.id} value={String(l.id)}>{l.nume}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Adresă facturare</Label>
                      <Input value={form.billingAddress} onChange={e => set("billingAddress", e.target.value)} placeholder="Adresa completă" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── BLOC 7: SERVICII EXTRA ─── */}
            {sBool("checkout_extra_services_show") && sBool("checkout_open_package_service_show") && (
              <div className={sectionClass}>
                <h2 className="text-base font-bold mb-3">Servicii extra</h2>
                <p className="text-xs text-muted-foreground mb-2">Vrei să te asiguri că totul e în regulă?</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.openPackage} onCheckedChange={v => set("openPackage", !!v)} />
                  <span className="text-sm">Serviciu deschidere colet la livrare ({openPackagePrice} RON)</span>
                </label>
              </div>
            )}

            {/* ─── BLOC 8: PLATĂ ─── */}
            <div className={sectionClass}>
              <h2 className="text-base font-bold mb-3">Alege metoda de plată *</h2>
              <div className="space-y-2">
                {/* Ramburs */}
                <button onClick={() => set("paymentMethod", "ramburs")} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${form.paymentMethod === "ramburs" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💵</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">Plată la livrare (Ramburs)</p>
                      {sBool("checkout_ramburs_free_shipping") && (
                        <p className="text-xs text-green-600 mt-0.5">{s("checkout_ramburs_benefit_text", "+ Transport Gratuit la comenzi > 200 RON + Plătești când ajunge coletul")}</p>
                      )}
                    </div>
                  </div>
                </button>

                {/* Card */}
                <button onClick={() => set("paymentMethod", "card")} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${form.paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💳</span>
                    <div>
                      <p className="text-sm font-bold">Online cu card (Netopia)</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
                    </div>
                  </div>
                </button>

                {/* Transfer */}
                <button onClick={() => set("paymentMethod", "transfer")} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${form.paymentMethod === "transfer" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏦</span>
                    <div>
                      <p className="text-sm font-bold">Ordin de Plată (Transfer bancar)</p>
                      <p className="text-xs text-muted-foreground">Plătești după plasarea comenzii</p>
                    </div>
                  </div>
                </button>

                {form.paymentMethod === "transfer" && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 ml-9 space-y-2 text-sm">
                    <p className="font-bold">Detalii transfer bancar:</p>
                    <p className="text-muted-foreground">Bancă: <span className="font-semibold text-foreground">{settings.company_bank || "Banca Transilvania"}</span></p>
                    <p className="text-muted-foreground">IBAN: <span className="font-semibold text-foreground">{settings.company_iban || "RO00XXXX"}</span></p>
                    <p className="text-muted-foreground">Beneficiar: <span className="font-semibold text-foreground">{settings.company_name || "Mama Lucica SRL"}</span></p>
                    <p className="text-muted-foreground">La plată, menționați: <span className="font-semibold text-foreground">Numărul comenzii</span></p>
                    <p className="text-xs text-amber-700 font-semibold mt-1">⏰ Ordinul de plată este valabil 3 zile lucrătoare de la plasarea comenzii.</p>
                  </div>
                )}

                {/* Mokka */}
                <button onClick={() => set("paymentMethod", "mokka")} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${form.paymentMethod === "mokka" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🟠</span>
                    <div>
                      <p className="text-sm font-bold">Online în rate prin StarBT</p>
                      <p className="text-xs text-muted-foreground">Până la 30 de rate, 0% dobândă</p>
                    </div>
                  </div>
                </button>

              </div>
            </div>

            {/* ─── BLOC 9: OBSERVAȚII ─── */}
            {sBool("checkout_observations_show") && (
              <div className={sectionClass}>
                <h2 className="text-base font-bold mb-3">Mesajul tău (opțional)</h2>
                <Textarea value={form.observations} onChange={e => set("observations", e.target.value)} placeholder="Instrucțiuni speciale, program livrare, etc." rows={3} />
              </div>
            )}

            {/* ─── TERMENI & CONFIDENȚIALITATE ─── */}
            <div className={sectionClass}>
              <div className="space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={form.termsAccepted} onCheckedChange={v => set("termsAccepted", !!v)} className="mt-0.5" />
                  <span className="text-xs text-muted-foreground">
                    Sunt de acord cu{" "}
                    <Link to="/termeni-si-conditii" className="text-primary underline" target="_blank">Termenii și Condițiile</Link> *
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={form.privacyAccepted} onCheckedChange={v => set("privacyAccepted", !!v)} className="mt-0.5" />
                  <span className="text-xs text-muted-foreground">
                    Sunt de acord cu{" "}
                    <Link to="/politica-de-confidentialitate" className="text-primary underline" target="_blank">Politica de Confidențialitate</Link> *
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={form.newsletter} onCheckedChange={v => set("newsletter", !!v)} className="mt-0.5" />
                  <span className="text-xs text-muted-foreground">Vreau să primesc oferte și noutăți pe email</span>
                </label>
              </div>
            </div>

            {/* Mobile order button */}
            <div className="lg:hidden">
              <Button onClick={placeOrder} disabled={!canSubmit || submitting} className="w-full h-14 text-base font-extrabold" size="lg">
                {submitting ? "Se procesează..." : `🔒 Plasează Comanda — ${format(finalTotal)}`}
              </Button>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: SUMAR ─── */}
          <div className="lg:sticky lg:top-[80px] self-start">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-base font-bold mb-4">Sumar comandă</h3>

              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.product_id} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img src={item.product.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{format(item.product.price)} × {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold whitespace-nowrap">{format(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <Separator className="mb-3" />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{format(totalPrice)}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transport</span>
                  <span className={shippingCost === 0 ? "text-green-600 font-semibold" : ""}>{shippingCost === 0 ? "GRATUIT" : format(shippingCost)}</span>
                </div>
                {openPackageCost > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Serviciu deschidere</span><span>{format(openPackageCost)}</span></div>
                )}
                {rambursCost > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Cost ramburs</span><span>{format(rambursCost)}</span></div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Cod reducere</span><span>-{format(couponDiscount)}</span></div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Puncte folosite</span><span>-{format(loyaltyDiscount)}</span></div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-extrabold pt-1">
                  <span>TOTAL</span>
                  <span>{format(finalTotal)}</span>
                </div>
              </div>

              {/* Desktop order button */}
              <div className="hidden lg:block mt-4">
                <Button onClick={placeOrder} disabled={!canSubmit || submitting} className="w-full h-14 text-base font-extrabold" size="lg">
                  {submitting ? "Se procesează..." : `Plasează comanda →`}
                </Button>
              </div>

              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Plată securizată SSL</div>
                <div className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" /> Retur gratuit 30 zile</div>
                <div className="flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Livrare 1-3 zile lucrătoare</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
