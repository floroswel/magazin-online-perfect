import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag, Percent, Gift, Truck, Copy } from "lucide-react";
import { toast } from "sonner";

const PROMO_TYPES = [
  { value: "percentage", label: "Reducere %", icon: Percent },
  { value: "fixed", label: "Reducere fixă", icon: Tag },
  { value: "buy_x_get_y", label: "Cumpără X primești Y", icon: Gift },
  { value: "free_shipping", label: "Transport gratuit", icon: Truck },
  { value: "bundle", label: "Pachet promoțional", icon: Tag },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-muted text-muted-foreground",
  expired: "bg-red-100 text-red-800",
  scheduled: "bg-blue-100 text-blue-800",
};

function getPromoStatus(promo: any): string {
  if (promo.status === "draft") return "draft";
  const now = new Date();
  if (promo.starts_at && new Date(promo.starts_at) > now) return "scheduled";
  if (promo.ends_at && new Date(promo.ends_at) < now) return "expired";
  return "active";
}

const defaultForm = {
  name: "", type: "percentage", discount_type: "percentage", discount_value: 10,
  max_discount: null as number | null, badge_text: "", starts_at: "", ends_at: "",
  max_uses: null as number | null, max_uses_per_user: 1, is_combinable: false, priority: 0, status: "draft",
  conditions: { min_cart_value: null as number | null, categories: [] as string[], brands: [] as string[], customer_groups: [] as string[], min_quantity: null as number | null } as any,
  buy_x: 2, get_y: 1, gift_product_ids: [] as string[],
};

export default function AdminPromotions() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const conditions = { ...form.conditions };
      if (form.type === "buy_x_get_y") { conditions.buy_x = form.buy_x; conditions.get_y = form.get_y; }
      if (form.type === "bundle") { conditions.gift_product_ids = form.gift_product_ids; }
      const payload = {
        name: form.name, type: form.type, discount_type: form.discount_type, discount_value: form.discount_value,
        max_discount: form.max_discount, badge_text: form.badge_text || null,
        starts_at: form.starts_at || null, ends_at: form.ends_at || null,
        max_uses: form.max_uses, max_uses_per_user: form.max_uses_per_user,
        is_combinable: form.is_combinable, priority: form.priority, status: form.status, conditions,
      };
      if (editId) { const { error } = await supabase.from("promotions").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("promotions").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.success(editId ? "Promoție actualizată!" : "Promoție creată!"); setDialogOpen(false); resetForm(); },
    onError: () => toast.error("Eroare la salvare."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("promotions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.success("Promoție ștearsă!"); },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (p: any) => {
      const { id, created_at, updated_at, used_count, ...rest } = p;
      const { error } = await supabase.from("promotions").insert({ ...rest, name: `${rest.name} (copie)`, status: "draft", used_count: 0 });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-promotions"] }); toast.success("Promoție duplicată!"); },
  });

  const resetForm = () => { setForm(defaultForm); setEditId(null); };

  const openEdit = (p: any) => {
    setEditId(p.id);
    const cond = p.conditions || {};
    setForm({
      name: p.name, type: p.type, discount_type: p.discount_type || "percentage", discount_value: p.discount_value || 0,
      max_discount: p.max_discount, badge_text: p.badge_text || "",
      starts_at: p.starts_at ? p.starts_at.slice(0, 16) : "", ends_at: p.ends_at ? p.ends_at.slice(0, 16) : "",
      max_uses: p.max_uses, max_uses_per_user: p.max_uses_per_user || 1,
      is_combinable: p.is_combinable || false, priority: p.priority || 0, status: p.status || "draft",
      conditions: { min_cart_value: cond.min_cart_value || null, categories: cond.categories || [], brands: cond.brands || [], customer_groups: cond.customer_groups || [], min_quantity: cond.min_quantity || null },
      buy_x: cond.buy_x || 2, get_y: cond.get_y || 1, gift_product_ids: cond.gift_product_ids || [],
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Promoții</h2>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Promoție nouă</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editează promoția" : "Promoție nouă"}</DialogTitle></DialogHeader>
            <Tabs defaultValue="general">
              <TabsList className="w-full"><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="conditions">Condiții</TabsTrigger><TabsTrigger value="scheduling">Programare</TabsTrigger></TabsList>
              <TabsContent value="general" className="space-y-4 mt-4">
                <div><Label>Nume promoție</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Black Friday -30%" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tip promoție</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PROMO_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Activ</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                {form.type === "buy_x_get_y" && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                    <div><Label>Cumpără X produse</Label><Input type="number" value={form.buy_x} onChange={e => setForm(f => ({ ...f, buy_x: Number(e.target.value) }))} /></div>
                    <div><Label>Primește Y gratuit</Label><Input type="number" value={form.get_y} onChange={e => setForm(f => ({ ...f, get_y: Number(e.target.value) }))} /></div>
                  </div>
                )}
                {form.type !== "free_shipping" && form.type !== "buy_x_get_y" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Tip discount</Label>
                      <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="percentage">Procentual (%)</SelectItem><SelectItem value="fixed">Fix (RON)</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Valoare</Label><Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} /></div>
                    <div><Label>Discount maxim (RON)</Label><Input type="number" value={form.max_discount ?? ""} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value ? Number(e.target.value) : null }))} placeholder="Nelimitat" /></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Utilizări maxime</Label><Input type="number" value={form.max_uses ?? ""} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))} placeholder="Nelimitat" /></div>
                  <div><Label>Prioritate</Label><Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} /></div>
                </div>
                <div><Label>Text badge produs</Label><Input value={form.badge_text} onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))} placeholder="Ex: -30% BLACK FRIDAY" /></div>
                <div className="flex items-center gap-3"><Switch checked={form.is_combinable} onCheckedChange={v => setForm(f => ({ ...f, is_combinable: v }))} /><Label>Combinabilă cu alte promoții</Label></div>
              </TabsContent>
              <TabsContent value="conditions" className="space-y-4 mt-4">
                <div><Label>Valoare minimă coș (RON)</Label><Input type="number" value={form.conditions.min_cart_value ?? ""} onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, min_cart_value: e.target.value ? Number(e.target.value) : null } }))} placeholder="Fără minim" /></div>
                <div><Label>Cantitate minimă produse</Label><Input type="number" value={form.conditions.min_quantity ?? ""} onChange={e => setForm(f => ({ ...f, conditions: { ...f.conditions, min_quantity: e.target.value ? Number(e.target.value) : null } }))} placeholder="Fără minim" /></div>
                <div><Label>Categorii eligibile</Label>
                  <Select onValueChange={v => { if (!form.conditions.categories.includes(v)) setForm(f => ({ ...f, conditions: { ...f.conditions, categories: [...f.conditions.categories, v] } })); }}>
                    <SelectTrigger><SelectValue placeholder="Adaugă categorie..." /></SelectTrigger>
                    <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-1">{form.conditions.categories.map((id: string) => {
                    const cat = categories.find((c: any) => c.id === id);
                    return <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => setForm(f => ({ ...f, conditions: { ...f.conditions, categories: f.conditions.categories.filter((x: string) => x !== id) } }))}>{cat?.name || id} ×</Badge>;
                  })}</div>
                </div>
                <div><Label>Brand-uri eligibile</Label>
                  <Select onValueChange={v => { if (!form.conditions.brands.includes(v)) setForm(f => ({ ...f, conditions: { ...f.conditions, brands: [...f.conditions.brands, v] } })); }}>
                    <SelectTrigger><SelectValue placeholder="Adaugă brand..." /></SelectTrigger>
                    <SelectContent>{brands.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-1">{form.conditions.brands.map((id: string) => {
                    const brand = brands.find((b: any) => b.id === id);
                    return <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => setForm(f => ({ ...f, conditions: { ...f.conditions, brands: f.conditions.brands.filter((x: string) => x !== id) } }))}>{brand?.name || id} ×</Badge>;
                  })}</div>
                </div>
              </TabsContent>
              <TabsContent value="scheduling" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Începe la</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} /></div>
                  <div><Label>Se termină la</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Lăsând câmpurile goale, promoția va fi activă nedeterminat (cât timp statusul e &quot;Activ&quot;).</p>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>{saveMutation.isPending ? "Se salvează..." : editId ? "Actualizează" : "Creează"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Perioadă</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Utilizări</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : promos.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nicio promoție creată.</TableCell></TableRow>
              ) : promos.map((p: any) => {
                const status = getPromoStatus(p);
                const typeInfo = PROMO_TYPES.find(t => t.value === p.type);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}{p.badge_text && <Badge className="ml-2 text-[10px]" variant="outline">{p.badge_text}</Badge>}</TableCell>
                    <TableCell className="text-sm">{typeInfo?.label || p.type}</TableCell>
                    <TableCell className="text-sm">{p.type === "free_shipping" ? "—" : p.type === "buy_x_get_y" ? `${p.conditions?.buy_x || 2}+${p.conditions?.get_y || 1}` : `${p.discount_value}${p.discount_type === "percentage" ? "%" : " RON"}`}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.starts_at ? new Date(p.starts_at).toLocaleDateString("ro-RO") : "—"} → {p.ends_at ? new Date(p.ends_at).toLocaleDateString("ro-RO") : "∞"}</TableCell>
                    <TableCell><Badge className={`text-xs ${STATUS_COLORS[status] || ""}`}>{status}</Badge></TableCell>
                    <TableCell className="text-sm">{p.used_count || 0}{p.max_uses ? `/${p.max_uses}` : ""}</TableCell>
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
