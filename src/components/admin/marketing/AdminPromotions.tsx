import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag, Percent, Gift, Truck, Copy, Package, DollarSign, BarChart3, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";

const PROMO_TYPES = [
  { value: "percentage", label: "Reducere procentuală", icon: Percent, desc: "X% reducere" },
  { value: "fixed", label: "Reducere sumă fixă", icon: Tag, desc: "X lei reducere" },
  { value: "fixed_price", label: "Preț fix", icon: DollarSign, desc: "Produsul costă exact X lei" },
  { value: "buy_x_get_y", label: "Cumpără X ia Y gratuit", icon: Gift, desc: "Cel mai ieftin e gratuit" },
  { value: "volume_discount", label: "Discount de volum", icon: Package, desc: "Tier-uri cantitative" },
  { value: "free_shipping", label: "Transport gratuit", icon: Truck, desc: "Fără cost livrare" },
  { value: "gift_product", label: "Produs cadou", icon: Gift, desc: "Adaugă automat un produs în coș" },
  { value: "spend_threshold", label: "Cheltuiește X obții Y%", icon: Zap, desc: "Tier-uri pe valoare coș" },
];

const DAYS = [
  { value: 1, label: "Lu" }, { value: 2, label: "Ma" }, { value: 3, label: "Mi" },
  { value: 4, label: "Jo" }, { value: 5, label: "Vi" }, { value: 6, label: "Sâ" }, { value: 0, label: "Du" },
];

function getPromoStatus(promo: any): string {
  if (!promo.active) return "inactive";
  if (promo.status === "draft") return "draft";
  const now = new Date();
  if (promo.starts_at && new Date(promo.starts_at) > now) return "scheduled";
  if (promo.ends_at && new Date(promo.ends_at) < now) return "expired";
  return "active";
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Activ", variant: "default" },
  draft: { label: "Draft", variant: "outline" },
  expired: { label: "Expirat", variant: "destructive" },
  scheduled: { label: "Programat", variant: "secondary" },
  inactive: { label: "Inactiv", variant: "outline" },
};

const defaultForm = {
  name: "", label: "", label_color: "#ef4444", type: "percentage",
  discount_type: "percentage", discount_value: 10, max_discount: null as number | null,
  badge_text: "", status: "draft", active: true, priority: 0,
  // Buy X Get Y
  buy_x: 2, get_y: 1,
  // Volume tiers
  volume_tiers: [{ min_qty: 3, max_qty: 5, discount: 10 }, { min_qty: 6, max_qty: 10, discount: 15 }] as any[],
  // Spend tiers
  spend_tiers: [{ min_spend: 300, discount: 20 }, { min_spend: 500, discount: 30 }] as any[],
  // Gift product
  gift_product_id: null as string | null,
  // Targeting
  applies_to_products: "all",
  product_ids: [] as string[], category_ids: [] as string[], brand_ids: [] as string[],
  excluded_product_ids: [] as string[], excluded_category_ids: [] as string[],
  applies_to_customers: "all",
  customer_group_ids: [] as string[], new_customers_only: false, registered_only: false,
  // Conditions
  conditions: { min_cart_value: null as number | null, min_quantity: null as number | null } as any,
  required_payment_method: "" as string,
  // Scheduling
  starts_at: "", ends_at: "",
  active_days: [0, 1, 2, 3, 4, 5, 6] as number[],
  active_hour_start: null as number | null, active_hour_end: null as number | null,
  // Limits
  max_uses: null as number | null, max_uses_per_user: null as number | null,
  // Stacking
  is_combinable: false, no_combine: false,
  show_countdown: true,
};

export default function AdminPromotions() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [productSearch, setProductSearch] = useState("");

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promotions").select("*").order("priority", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["promo-categories"],
    queryFn: async () => { const { data } = await supabase.from("categories").select("id, name").order("name"); return data || []; },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["promo-brands"],
    queryFn: async () => { const { data } = await supabase.from("brands").select("id, name").order("name"); return data || []; },
  });

  const { data: customerGroups = [] } = useQuery({
    queryKey: ["promo-customer-groups"],
    queryFn: async () => { const { data } = await supabase.from("customer_groups").select("id, name").order("name"); return data || []; },
  });

  const { data: searchProducts = [] } = useQuery({
    queryKey: ["promo-product-search", productSearch],
    queryFn: async () => {
      if (!productSearch || productSearch.length < 2) return [];
      const { data } = await supabase.from("products").select("id, name").ilike("name", `%${productSearch}%`).limit(20);
      return data || [];
    },
    enabled: productSearch.length >= 2,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name, label: form.label || null, label_color: form.label_color,
        type: form.type, discount_type: form.discount_type, discount_value: form.discount_value,
        max_discount: form.max_discount, badge_text: form.badge_text || form.label || null,
        status: form.status, active: form.active, priority: form.priority,
        applies_to_products: form.applies_to_products,
        product_ids: form.product_ids, category_ids: form.category_ids, brand_ids: form.brand_ids,
        excluded_product_ids: form.excluded_product_ids, excluded_category_ids: form.excluded_category_ids,
        applies_to_customers: form.applies_to_customers,
        customer_group_ids: form.customer_group_ids,
        new_customers_only: form.new_customers_only, registered_only: form.registered_only,
        required_payment_method: form.required_payment_method || null,
        starts_at: form.starts_at || null, ends_at: form.ends_at || null,
        active_days: form.active_days,
        active_hour_start: form.active_hour_start, active_hour_end: form.active_hour_end,
        max_uses: form.max_uses, max_uses_per_user: form.max_uses_per_user,
        is_combinable: form.is_combinable, no_combine: form.no_combine,
        show_countdown: form.show_countdown,
        gift_product_id: form.gift_product_id,
        volume_tiers: form.type === "volume_discount" ? form.volume_tiers : [],
        spend_tiers: form.type === "spend_threshold" ? form.spend_tiers : [],
        conditions: {
          ...form.conditions,
          ...(form.type === "buy_x_get_y" ? { buy_x: form.buy_x, get_y: form.get_y } : {}),
        },
      };
      if (editId) {
        const { error } = await supabase.from("promotions").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promotions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.success(editId ? "Promoție actualizată!" : "Promoție creată!"); setDialogOpen(false); resetForm(); },
    onError: (e: any) => toast.error(`Eroare: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("promotions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.success("Promoție ștearsă!"); },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (p: any) => {
      const { id, created_at, updated_at, used_count, total_orders, total_revenue, total_discount_given, ...rest } = p;
      const { error } = await supabase.from("promotions").insert({ ...rest, name: `${rest.name} (copie)`, status: "draft", used_count: 0 });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.success("Promoție duplicată!"); },
  });

  const resetForm = () => { setForm(defaultForm); setEditId(null); setProductSearch(""); };

  const openEdit = (p: any) => {
    setEditId(p.id);
    const cond = p.conditions || {};
    setForm({
      name: p.name || "", label: p.label || "", label_color: p.label_color || "#ef4444",
      type: p.type, discount_type: p.discount_type || "percentage", discount_value: p.discount_value || 0,
      max_discount: p.max_discount, badge_text: p.badge_text || "", status: p.status || "draft",
      active: p.active !== false, priority: p.priority || 0,
      buy_x: cond.buy_x || 2, get_y: cond.get_y || 1,
      volume_tiers: p.volume_tiers || [], spend_tiers: p.spend_tiers || [],
      gift_product_id: p.gift_product_id,
      applies_to_products: p.applies_to_products || "all",
      product_ids: p.product_ids || [], category_ids: p.category_ids || [], brand_ids: p.brand_ids || [],
      excluded_product_ids: p.excluded_product_ids || [], excluded_category_ids: p.excluded_category_ids || [],
      applies_to_customers: p.applies_to_customers || "all",
      customer_group_ids: p.customer_group_ids || [],
      new_customers_only: p.new_customers_only || false, registered_only: p.registered_only || false,
      conditions: { min_cart_value: cond.min_cart_value || null, min_quantity: cond.min_quantity || null },
      required_payment_method: p.required_payment_method || "",
      starts_at: p.starts_at ? p.starts_at.slice(0, 16) : "", ends_at: p.ends_at ? p.ends_at.slice(0, 16) : "",
      active_days: p.active_days || [0, 1, 2, 3, 4, 5, 6],
      active_hour_start: p.active_hour_start, active_hour_end: p.active_hour_end,
      max_uses: p.max_uses, max_uses_per_user: p.max_uses_per_user,
      is_combinable: p.is_combinable || false, no_combine: p.no_combine || false,
      show_countdown: p.show_countdown !== false,
    });
    setDialogOpen(true);
  };

  const addToList = (field: string, value: string) => {
    setForm(f => {
      const arr = (f as any)[field] || [];
      if (arr.includes(value)) return f;
      return { ...f, [field]: [...arr, value] };
    });
  };

  const removeFromList = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: ((f as any)[field] || []).filter((x: string) => x !== value) }));
  };

  const typeInfo = PROMO_TYPES.find(t => t.value === form.type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Promoții Avansate</h2>
          <p className="text-sm text-muted-foreground">Gestionează promoțiile magazinului cu reguli complexe.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Promoție nouă</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editează promoția" : "Promoție nouă"}</DialogTitle></DialogHeader>
            <Tabs defaultValue="general">
              <TabsList className="flex-wrap w-full">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="targeting">Produse</TabsTrigger>
                <TabsTrigger value="customers">Clienți</TabsTrigger>
                <TabsTrigger value="conditions">Condiții</TabsTrigger>
                <TabsTrigger value="scheduling">Programare</TabsTrigger>
                <TabsTrigger value="stacking">Stacking</TabsTrigger>
              </TabsList>

              {/* ═══ GENERAL ═══ */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nume intern</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Black Friday -30%" /></div>
                  <div><Label>Label (badge pe storefront)</Label><Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: SUPER DEAL" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Culoare label</Label><div className="flex gap-2"><Input type="color" value={form.label_color} onChange={e => setForm(f => ({ ...f, label_color: e.target.value }))} className="w-12 h-9 p-1" /><Input value={form.label_color} onChange={e => setForm(f => ({ ...f, label_color: e.target.value }))} className="flex-1" /></div></div>
                  <div><Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Activ</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Prioritate</Label><Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} /></div>
                </div>
                <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} /><Label>Activ</Label></div>

                <div><Label>Tip promoție</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {PROMO_TYPES.map(t => (
                      <button key={t.value} type="button"
                        className={`p-3 rounded-lg border text-left transition-all ${form.type === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                        onClick={() => setForm(f => ({ ...f, type: t.value }))}>
                        <div className="flex items-center gap-2">
                          <t.icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{t.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type-specific fields */}
                {(form.type === "percentage" || form.type === "fixed" || form.type === "fixed_price") && (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
                    <div><Label>{form.type === "percentage" ? "Procent (%)" : form.type === "fixed" ? "Sumă (RON)" : "Preț fix (RON)"}</Label>
                      <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} />
                    </div>
                    {form.type === "percentage" && (
                      <div><Label>Discount maxim (RON)</Label><Input type="number" value={form.max_discount ?? ""} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value ? Number(e.target.value) : null }))} placeholder="Nelimitat" /></div>
                    )}
                    <div><Label>Text badge</Label><Input value={form.badge_text} onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))} placeholder={`Ex: -${form.discount_value}%`} /></div>
                  </div>
                )}

                {form.type === "buy_x_get_y" && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                    <div><Label>Cumpără X produse</Label><Input type="number" value={form.buy_x} onChange={e => setForm(f => ({ ...f, buy_x: Number(e.target.value) }))} /></div>
                    <div><Label>Primește Y gratuit</Label><Input type="number" value={form.get_y} onChange={e => setForm(f => ({ ...f, get_y: Number(e.target.value) }))} /></div>
                  </div>
                )}

                {form.type === "volume_discount" && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <Label>Tier-uri de volum</Label>
                    {form.volume_tiers.map((tier, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input type="number" placeholder="Min buc" value={tier.min_qty} onChange={e => { const t = [...form.volume_tiers]; t[i] = { ...t[i], min_qty: Number(e.target.value) }; setForm(f => ({ ...f, volume_tiers: t })); }} className="w-24" />
                        <span className="text-xs text-muted-foreground">—</span>
                        <Input type="number" placeholder="Max buc" value={tier.max_qty || ""} onChange={e => { const t = [...form.volume_tiers]; t[i] = { ...t[i], max_qty: Number(e.target.value) || null }; setForm(f => ({ ...f, volume_tiers: t })); }} className="w-24" />
                        <span className="text-xs text-muted-foreground">buc →</span>
                        <Input type="number" placeholder="% discount" value={tier.discount} onChange={e => { const t = [...form.volume_tiers]; t[i] = { ...t[i], discount: Number(e.target.value) }; setForm(f => ({ ...f, volume_tiers: t })); }} className="w-20" />
                        <span className="text-xs">%</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setForm(f => ({ ...f, volume_tiers: f.volume_tiers.filter((_, j) => j !== i) }))}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, volume_tiers: [...f.volume_tiers, { min_qty: 1, max_qty: null, discount: 5 }] }))}><Plus className="h-3 w-3 mr-1" /> Adaugă tier</Button>
                  </div>
                )}

                {form.type === "spend_threshold" && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <Label>Tier-uri valoare coș</Label>
                    {form.spend_tiers.map((tier, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground">Cheltuiește</span>
                        <Input type="number" value={tier.min_spend} onChange={e => { const t = [...form.spend_tiers]; t[i] = { ...t[i], min_spend: Number(e.target.value) }; setForm(f => ({ ...f, spend_tiers: t })); }} className="w-24" />
                        <span className="text-xs text-muted-foreground">lei →</span>
                        <Input type="number" value={tier.discount} onChange={e => { const t = [...form.spend_tiers]; t[i] = { ...t[i], discount: Number(e.target.value) }; setForm(f => ({ ...f, spend_tiers: t })); }} className="w-20" />
                        <span className="text-xs">% reducere</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setForm(f => ({ ...f, spend_tiers: f.spend_tiers.filter((_, j) => j !== i) }))}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, spend_tiers: [...f.spend_tiers, { min_spend: 100, discount: 10 }] }))}><Plus className="h-3 w-3 mr-1" /> Adaugă tier</Button>
                  </div>
                )}

                {form.type === "gift_product" && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <Label>Produs cadou</Label>
                    <Input placeholder="Caută produs..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    {searchProducts.length > 0 && (
                      <div className="border rounded-lg max-h-32 overflow-y-auto">
                        {searchProducts.map((p: any) => (
                          <button key={p.id} type="button" className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50"
                            onClick={() => { setForm(f => ({ ...f, gift_product_id: p.id })); setProductSearch(p.name); }}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {form.gift_product_id && <p className="text-xs text-muted-foreground">ID produs selectat: {form.gift_product_id.slice(0, 8)}...</p>}
                  </div>
                )}
              </TabsContent>

              {/* ═══ TARGETING PRODUCTS ═══ */}
              <TabsContent value="targeting" className="space-y-4 mt-4">
                <div><Label>Se aplică la</Label>
                  <Select value={form.applies_to_products} onValueChange={v => setForm(f => ({ ...f, applies_to_products: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate produsele</SelectItem>
                      <SelectItem value="categories">Categorii specifice</SelectItem>
                      <SelectItem value="brands">Branduri specifice</SelectItem>
                      <SelectItem value="products">Produse specifice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.applies_to_products === "categories" && (
                  <div>
                    <Label>Categorii eligibile</Label>
                    <Select onValueChange={v => addToList("category_ids", v)}>
                      <SelectTrigger><SelectValue placeholder="Adaugă categorie..." /></SelectTrigger>
                      <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-1">{form.category_ids.map(id => {
                      const cat = categories.find((c: any) => c.id === id);
                      return <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => removeFromList("category_ids", id)}>{cat?.name || id} ×</Badge>;
                    })}</div>
                  </div>
                )}

                {form.applies_to_products === "brands" && (
                  <div>
                    <Label>Branduri eligibile</Label>
                    <Select onValueChange={v => addToList("brand_ids", v)}>
                      <SelectTrigger><SelectValue placeholder="Adaugă brand..." /></SelectTrigger>
                      <SelectContent>{brands.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-1">{form.brand_ids.map(id => {
                      const brand = brands.find((b: any) => b.id === id);
                      return <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => removeFromList("brand_ids", id)}>{brand?.name || id} ×</Badge>;
                    })}</div>
                  </div>
                )}

                {form.applies_to_products === "products" && (
                  <div>
                    <Label>Produse specifice</Label>
                    <Input placeholder="Caută produs..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    {searchProducts.length > 0 && (
                      <div className="border rounded-lg max-h-40 overflow-y-auto mt-1">
                        {searchProducts.map((p: any) => (
                          <button key={p.id} type="button" className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50"
                            onClick={() => addToList("product_ids", p.id)}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">{form.product_ids.map(id => (
                      <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => removeFromList("product_ids", id)}>{id.slice(0, 8)}... ×</Badge>
                    ))}</div>
                  </div>
                )}

                <div className="border-t pt-3">
                  <Label className="text-muted-foreground">Excluderi</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label className="text-xs">Exclude categorii</Label>
                      <Select onValueChange={v => addToList("excluded_category_ids", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Adaugă..." /></SelectTrigger>
                        <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1 mt-1">{form.excluded_category_ids.map(id => {
                        const cat = categories.find((c: any) => c.id === id);
                        return <Badge key={id} variant="destructive" className="text-[10px] cursor-pointer" onClick={() => removeFromList("excluded_category_ids", id)}>{cat?.name || id} ×</Badge>;
                      })}</div>
                    </div>
                    <div>
                      <Label className="text-xs">Exclude produse</Label>
                      <Input placeholder="Caută..." className="h-8 text-xs" onChange={e => setProductSearch(e.target.value)} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ═══ CUSTOMERS ═══ */}
              <TabsContent value="customers" className="space-y-4 mt-4">
                <div><Label>Se aplică la clienți</Label>
                  <Select value={form.applies_to_customers} onValueChange={v => setForm(f => ({ ...f, applies_to_customers: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toți clienții</SelectItem>
                      <SelectItem value="groups">Grupuri specifice</SelectItem>
                      <SelectItem value="new">Numai clienți noi</SelectItem>
                      <SelectItem value="registered">Numai clienți înregistrați</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.applies_to_customers === "groups" && (
                  <div>
                    <Label>Grupuri de clienți</Label>
                    <Select onValueChange={v => addToList("customer_group_ids", v)}>
                      <SelectTrigger><SelectValue placeholder="Adaugă grup..." /></SelectTrigger>
                      <SelectContent>{customerGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-1">{form.customer_group_ids.map(id => {
                      const g = customerGroups.find((g: any) => g.id === id);
                      return <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => removeFromList("customer_group_ids", id)}>{g?.name || id} ×</Badge>;
                    })}</div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-3"><Switch checked={form.new_customers_only} onCheckedChange={v => setForm(f => ({ ...f, new_customers_only: v }))} /><Label>Numai clienți noi (prima comandă)</Label></div>
                  <div className="flex items-center gap-3"><Switch checked={form.registered_only} onCheckedChange={v => setForm(f => ({ ...f, registered_only: v }))} /><Label>Numai clienți înregistrați</Label></div>
                </div>
              </TabsContent>

              {/* ═══ CONDITIONS ═══ */}
              <TabsContent value="conditions" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Valoare minimă coș (RON)</Label><Input type="number" value={form.conditions.min_cart_value ?? ""} onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, min_cart_value: e.target.value ? Number(e.target.value) : null } }))} placeholder="Fără minim" /></div>
                  <div><Label>Cantitate minimă produse</Label><Input type="number" value={form.conditions.min_quantity ?? ""} onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, min_quantity: e.target.value ? Number(e.target.value) : null } }))} placeholder="Fără minim" /></div>
                </div>
                <div><Label>Metodă de plată obligatorie</Label>
                  <Select value={form.required_payment_method} onValueChange={v => setForm(f => ({ ...f, required_payment_method: v }))}>
                    <SelectTrigger><SelectValue placeholder="Oricare" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Oricare</SelectItem>
                      <SelectItem value="card">Card online</SelectItem>
                      <SelectItem value="ramburs">Ramburs (COD)</SelectItem>
                      <SelectItem value="transfer_bancar">Transfer bancar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Utilizări maxime totale</Label><Input type="number" value={form.max_uses ?? ""} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))} placeholder="Nelimitat" /></div>
                  <div><Label>Utilizări maxime per client</Label><Input type="number" value={form.max_uses_per_user ?? ""} onChange={e => setForm(f => ({ ...f, max_uses_per_user: e.target.value ? Number(e.target.value) : null }))} placeholder="Nelimitat" /></div>
                </div>
              </TabsContent>

              {/* ═══ SCHEDULING ═══ */}
              <TabsContent value="scheduling" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Începe la</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} /></div>
                  <div><Label>Se termină la</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>Zilele săptămânii active</Label>
                  <div className="flex gap-2 mt-1">
                    {DAYS.map(d => (
                      <button key={d.value} type="button"
                        className={`w-9 h-9 rounded-lg text-xs font-medium border transition-all ${form.active_days.includes(d.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}
                        onClick={() => setForm(f => ({ ...f, active_days: f.active_days.includes(d.value) ? f.active_days.filter(x => x !== d.value) : [...f.active_days, d.value] }))}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Oră start (Flash Sale)</Label><Input type="number" min={0} max={23} value={form.active_hour_start ?? ""} onChange={e => setForm(f => ({ ...f, active_hour_start: e.target.value ? Number(e.target.value) : null }))} placeholder="Ex: 10" /></div>
                  <div><Label>Oră sfârșit</Label><Input type="number" min={0} max={23} value={form.active_hour_end ?? ""} onChange={e => setForm(f => ({ ...f, active_hour_end: e.target.value ? Number(e.target.value) : null }))} placeholder="Ex: 22" /></div>
                </div>
                <div className="flex items-center gap-3"><Switch checked={form.show_countdown} onCheckedChange={v => setForm(f => ({ ...f, show_countdown: v }))} /><Label>Afișează countdown pe storefront</Label></div>
                <p className="text-xs text-muted-foreground">Promoțiile programate se activează/dezactivează automat. Countdown-ul apare pe card-uri, pagina de produs și coș.</p>
              </TabsContent>

              {/* ═══ STACKING ═══ */}
              <TabsContent value="stacking" className="space-y-4 mt-4">
                <div className="flex items-center gap-3"><Switch checked={form.is_combinable} onCheckedChange={v => setForm(f => ({ ...f, is_combinable: v }))} /><Label>Combinabilă cu alte promoții</Label></div>
                <div className="flex items-center gap-3"><Switch checked={form.no_combine} onCheckedChange={v => setForm(f => ({ ...f, no_combine: v }))} /><Label>Această promoție NU se combină cu altele</Label></div>
                <p className="text-xs text-muted-foreground">Dacă mai multe promoții se aplică și niciuna nu permite combinare, se aplică cea cu prioritatea cea mai mare.</p>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>{saveMutation.isPending ? "Se salvează..." : editId ? "Actualizează" : "Creează"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Promoții active</p>
          <p className="text-2xl font-bold text-foreground">{promos.filter((p: any) => getPromoStatus(p) === "active").length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Programate</p>
          <p className="text-2xl font-bold text-foreground">{promos.filter((p: any) => getPromoStatus(p) === "scheduled").length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Total comenzi generate</p>
          <p className="text-2xl font-bold text-foreground">{promos.reduce((s: number, p: any) => s + (p.total_orders || 0), 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Total discount acordat</p>
          <p className="text-2xl font-bold text-foreground">{promos.reduce((s: number, p: any) => s + Number(p.total_discount_given || 0), 0).toLocaleString("ro-RO")} RON</p>
        </CardContent></Card>
      </div>

      {/* ═══ TABLE ═══ */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promoție</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Perioadă</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Utilizări</TableHead>
                <TableHead>Comenzi / Venit</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : promos.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nicio promoție creată.</TableCell></TableRow>
              ) : promos.map((p: any) => {
                const status = getPromoStatus(p);
                const sb = STATUS_BADGE[status] || STATUS_BADGE.draft;
                const typeInfo = PROMO_TYPES.find(t => t.value === p.type);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{p.name}</div>
                      {(p.label || p.badge_text) && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: p.label_color || "#ef4444" }}>
                          {p.label || p.badge_text}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{typeInfo?.label || p.type}</TableCell>
                    <TableCell className="text-sm">
                      {p.type === "free_shipping" ? "Transport gratuit" :
                       p.type === "buy_x_get_y" ? `${p.conditions?.buy_x || 2}+${p.conditions?.get_y || 1}` :
                       p.type === "volume_discount" ? `${(p.volume_tiers || []).length} tier-uri` :
                       p.type === "spend_threshold" ? `${(p.spend_tiers || []).length} tier-uri` :
                       p.type === "gift_product" ? "Produs cadou" :
                       `${p.discount_value}${p.discount_type === "percentage" ? "%" : " RON"}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.starts_at ? new Date(p.starts_at).toLocaleDateString("ro-RO") : "—"} → {p.ends_at ? new Date(p.ends_at).toLocaleDateString("ro-RO") : "∞"}
                    </TableCell>
                    <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                    <TableCell className="text-sm">{p.used_count || 0}{p.max_uses ? `/${p.max_uses}` : ""}</TableCell>
                    <TableCell className="text-xs">
                      <div>{p.total_orders || 0} comenzi</div>
                      <div className="text-muted-foreground">{Number(p.total_revenue || 0).toLocaleString("ro-RO")} RON</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateMutation.mutate(p)} title="Duplică"><Copy className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
