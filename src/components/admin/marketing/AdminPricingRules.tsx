import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

const defaultForm = {
  name: "",
  is_active: false,
  priority: 10,
  applies_to_products: "all",
  product_ids: [] as string[],
  category_ids: [] as string[],
  brand_ids: [] as string[],
  applies_to_customers: "all",
  customer_group_ids: [] as string[],
  discount_type: "percentage",
  discount_value: 10,
  badge_text: "PROMO",
  min_quantity: null as number | null,
  min_order_value: null as number | null,
  starts_at: "",
  ends_at: "",
  allow_stacking: false,
};

export default function AdminPricingRules() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [productSearch, setProductSearch] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["admin-pricing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["admin-brands-list"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: customerGroups = [] } = useQuery({
    queryKey: ["admin-customer-groups-list"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_groups").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: searchedProducts = [] } = useQuery({
    queryKey: ["search-products", productSearch],
    queryFn: async () => {
      if (!productSearch || productSearch.length < 2) return [];
      const { data } = await supabase.from("products").select("id, name").ilike("name", `%${productSearch}%`).limit(10);
      return data || [];
    },
    enabled: productSearch.length >= 2,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        is_active: form.is_active,
        priority: form.priority,
        applies_to_products: form.applies_to_products,
        product_ids: form.product_ids,
        category_ids: form.category_ids,
        brand_ids: form.brand_ids,
        applies_to_customers: form.applies_to_customers,
        customer_group_ids: form.customer_group_ids,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        badge_text: form.badge_text || "PROMO",
        min_quantity: form.min_quantity,
        min_order_value: form.min_order_value,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        allow_stacking: form.allow_stacking,
        updated_at: new Date().toISOString(),
      };
      if (editId) {
        const { error } = await supabase.from("pricing_rules").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pricing_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pricing-rules"] });
      toast.success(editId ? "Regulă actualizată!" : "Regulă creată!");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Eroare la salvare."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pricing-rules"] });
      toast.success("Regulă ștearsă!");
    },
  });

  const resetForm = () => { setForm(defaultForm); setEditId(null); setProductSearch(""); };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      name: r.name,
      is_active: r.is_active,
      priority: r.priority,
      applies_to_products: r.applies_to_products,
      product_ids: r.product_ids || [],
      category_ids: r.category_ids || [],
      brand_ids: r.brand_ids || [],
      applies_to_customers: r.applies_to_customers,
      customer_group_ids: r.customer_group_ids || [],
      discount_type: r.discount_type,
      discount_value: r.discount_value,
      badge_text: r.badge_text || "PROMO",
      min_quantity: r.min_quantity,
      min_order_value: r.min_order_value,
      starts_at: r.starts_at ? r.starts_at.slice(0, 16) : "",
      ends_at: r.ends_at ? r.ends_at.slice(0, 16) : "",
      allow_stacking: r.allow_stacking,
    });
    setDialogOpen(true);
  };

  const toggleMulti = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  const isRuleActive = (r: any) => {
    if (!r.is_active) return false;
    const now = new Date();
    if (r.starts_at && new Date(r.starts_at) > now) return false;
    if (r.ends_at && new Date(r.ends_at) < now) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Reguli de Preț Dinamice
          </h2>
          <p className="text-sm text-muted-foreground">Gestionați reguli automate de discount pentru produse.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Regulă nouă</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editează regula" : "Regulă nouă de preț"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Name & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nume regulă</Label>
                  <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Weekend Sale" />
                </div>
                <div>
                  <Label>Prioritate (mai mic = prima)</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: Number(e.target.value) }))} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Regulă activă</Label>
              </div>

              {/* Applies to products */}
              <div>
                <Label>Se aplică la produse</Label>
                <Select value={form.applies_to_products} onValueChange={(v) => setForm(f => ({ ...f, applies_to_products: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate produsele</SelectItem>
                    <SelectItem value="categories">Categorii specifice</SelectItem>
                    <SelectItem value="brands">Mărci specifice</SelectItem>
                    <SelectItem value="products">Produse specifice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.applies_to_products === "categories" && (
                <div>
                  <Label>Categorii</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto border rounded-md p-2">
                    {categories.map((c: any) => (
                      <Badge
                        key={c.id}
                        variant={form.category_ids.includes(c.id) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setForm(f => ({ ...f, category_ids: toggleMulti(f.category_ids, c.id) }))}
                      >
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {form.applies_to_products === "brands" && (
                <div>
                  <Label>Mărci</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto border rounded-md p-2">
                    {brands.map((b: any) => (
                      <Badge
                        key={b.id}
                        variant={form.brand_ids.includes(b.id) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setForm(f => ({ ...f, brand_ids: toggleMulti(f.brand_ids, b.id) }))}
                      >
                        {b.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {form.applies_to_products === "products" && (
                <div>
                  <Label>Caută produse</Label>
                  <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Caută produs..." />
                  {searchedProducts.length > 0 && (
                    <div className="border rounded-md mt-1 max-h-32 overflow-y-auto">
                      {searchedProducts.map((p: any) => (
                        <button
                          key={p.id}
                          className="w-full text-left text-sm px-3 py-1.5 hover:bg-muted"
                          onClick={() => {
                            if (!form.product_ids.includes(p.id)) {
                              setForm(f => ({ ...f, product_ids: [...f.product_ids, p.id] }));
                            }
                          }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {form.product_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.product_ids.map(id => (
                        <Badge key={id} variant="secondary" className="text-xs cursor-pointer" onClick={() => setForm(f => ({ ...f, product_ids: f.product_ids.filter(x => x !== id) }))}>
                          {id.slice(0, 8)}… ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Applies to customers */}
              <div>
                <Label>Se aplică la clienți</Label>
                <Select value={form.applies_to_customers} onValueChange={(v) => setForm(f => ({ ...f, applies_to_customers: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toți clienții</SelectItem>
                    <SelectItem value="groups">Grupuri specifice</SelectItem>
                    <SelectItem value="guests">Doar vizitatori</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.applies_to_customers === "groups" && (
                <div>
                  <Label>Grupuri clienți</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1 border rounded-md p-2">
                    {customerGroups.map((g: any) => (
                      <Badge
                        key={g.id}
                        variant={form.customer_group_ids.includes(g.id) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setForm(f => ({ ...f, customer_group_ids: toggleMulti(f.customer_group_ids, g.id) }))}
                      >
                        {g.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Discount */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Tip discount</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm(f => ({ ...f, discount_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Procentual (%)</SelectItem>
                      <SelectItem value="fixed">Sumă fixă (lei)</SelectItem>
                      <SelectItem value="fixed_price">Preț fix nou</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valoare</Label>
                  <Input type="number" value={form.discount_value} onChange={(e) => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Text badge</Label>
                  <Input value={form.badge_text} onChange={(e) => setForm(f => ({ ...f, badge_text: e.target.value }))} placeholder="PROMO" />
                </div>
              </div>

              {/* Conditions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cantitate minimă în coș</Label>
                  <Input type="number" value={form.min_quantity ?? ""} onChange={(e) => setForm(f => ({ ...f, min_quantity: e.target.value ? Number(e.target.value) : null }))} placeholder="Fără limită" />
                </div>
                <div>
                  <Label>Valoare minimă comandă (lei)</Label>
                  <Input type="number" value={form.min_order_value ?? ""} onChange={(e) => setForm(f => ({ ...f, min_order_value: e.target.value ? Number(e.target.value) : null }))} placeholder="Fără limită" />
                </div>
              </div>

              {/* Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Începe la</Label>
                  <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                </div>
                <div>
                  <Label>Se termină la</Label>
                  <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                </div>
              </div>

              {/* Stacking */}
              <div className="flex items-center gap-3">
                <Switch checked={form.allow_stacking} onCheckedChange={(v) => setForm(f => ({ ...f, allow_stacking: v }))} />
                <Label>Permite combinarea cu alte reguli</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
                {saveMutation.isPending ? "Se salvează..." : editId ? "Actualizează" : "Creează"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prioritate</TableHead>
                <TableHead>Nume</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Aplică la</TableHead>
                <TableHead>Valabilitate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : rules.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nicio regulă de preț creată.</TableCell></TableRow>
              ) : rules.map((r: any) => {
                const active = isRuleActive(r);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.priority}</TableCell>
                    <TableCell className="font-medium">
                      {r.name}
                      {r.badge_text && <Badge variant="outline" className="ml-2 text-xs">{r.badge_text}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.discount_type === "percentage" && `${r.discount_value}%`}
                      {r.discount_type === "fixed" && `${r.discount_value} lei`}
                      {r.discount_type === "fixed_price" && `→ ${r.discount_value} lei`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.applies_to_products === "all" ? "Toate" : r.applies_to_products}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.starts_at ? new Date(r.starts_at).toLocaleDateString("ro-RO") : "—"} →{" "}
                      {r.ends_at ? new Date(r.ends_at).toLocaleDateString("ro-RO") : "∞"}
                    </TableCell>
                    <TableCell>
                      <Badge className={active ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}>
                        {active ? "Activ" : "Inactiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
