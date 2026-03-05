import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Eye, X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  type: string | null;
  rules: any[] | null;
  benefits: any | null;
  discount_percentage: number | null;
  is_default: boolean | null;
  member_count: number | null;
  last_sync_at: string | null;
  created_at: string | null;
}

interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

const RULE_FIELDS = [
  { value: "total_spent_gt", label: "Total cheltuit >" },
  { value: "total_spent_lt", label: "Total cheltuit <" },
  { value: "order_count_gt", label: "Nr. comenzi >" },
  { value: "order_count_lt", label: "Nr. comenzi <" },
  { value: "last_order_days_lt", label: "Ultima comandă în ultimele X zile" },
  { value: "last_order_days_gt", label: "Ultima comandă mai veche de X zile" },
  { value: "category_purchased", label: "A cumpărat din categoria" },
  { value: "product_purchased", label: "A cumpărat produsul" },
  { value: "county", label: "Județ" },
  { value: "registered_days_lt", label: "Înregistrat în ultimele X zile" },
  { value: "has_active_subscription", label: "Are abonament activ" },
  { value: "abc_class", label: "Clasificare ABC" },
];

const COLOR_OPTIONS = [
  { value: "bg-blue-500/20 text-blue-600 border-blue-500/30", label: "Albastru" },
  { value: "bg-green-500/20 text-green-600 border-green-500/30", label: "Verde" },
  { value: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30", label: "Galben" },
  { value: "bg-red-500/20 text-red-600 border-red-500/30", label: "Roșu" },
  { value: "bg-purple-500/20 text-purple-600 border-purple-500/30", label: "Violet" },
  { value: "bg-orange-500/20 text-orange-600 border-orange-500/30", label: "Portocaliu" },
  { value: "bg-pink-500/20 text-pink-600 border-pink-500/30", label: "Roz" },
  { value: "bg-muted text-muted-foreground border-border", label: "Gri" },
];

const emptyGroup = (): Partial<CustomerGroup> => ({
  name: "", slug: "", description: "", color: COLOR_OPTIONS[0].value,
  type: "manual", rules: [], benefits: { discount: 0, free_shipping: false, early_access_hours: 0, welcome_message: "" },
  discount_percentage: 0, is_default: false,
});

export default function AdminCustomerGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CustomerGroup> | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchGroups = async () => {
    const { data } = await supabase.from("customer_groups").select("*").order("created_at", { ascending: true });
    // Get member counts
    const { data: members } = await supabase.from("customer_group_members").select("group_id");
    const counts = new Map<string, number>();
    members?.forEach(m => counts.set(m.group_id, (counts.get(m.group_id) || 0) + 1));
    setGroups((data || []).map(g => ({ ...g, member_count: counts.get(g.id) || 0 } as CustomerGroup)));
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const openCreate = () => { setEditing(emptyGroup()); setPreviewCount(null); setDialogOpen(true); };
  const openEdit = (g: CustomerGroup) => {
    setEditing({
      ...g,
      rules: Array.isArray(g.rules) ? g.rules : [],
      benefits: g.benefits && typeof g.benefits === "object" ? g.benefits : { discount: 0, free_shipping: false, early_access_hours: 0, welcome_message: "" },
    });
    setPreviewCount(null);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing?.name?.trim()) { toast.error("Numele este obligatoriu"); return; }
    setSaving(true);
    const slug = editing.slug?.trim() || editing.name!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload: any = {
      name: editing.name!.trim(),
      slug,
      description: editing.description || null,
      color: editing.color || COLOR_OPTIONS[0].value,
      type: editing.type || "manual",
      rules: editing.type === "dynamic" ? (editing.rules || []) : [],
      benefits: editing.benefits || {},
      discount_percentage: editing.discount_percentage || 0,
      is_default: editing.is_default || false,
    };

    if (editing.id) {
      const { error } = await supabase.from("customer_groups").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message); else toast.success("Grup actualizat");
    } else {
      const { error } = await supabase.from("customer_groups").insert(payload);
      if (error) toast.error(error.message); else toast.success("Grup creat");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchGroups();
  };

  const deleteGroup = async (id: string) => {
    if (!confirm("Sigur vrei să ștergi acest grup?")) return;
    await supabase.from("customer_group_members").delete().eq("group_id", id);
    const { error } = await supabase.from("customer_groups").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Grup șters"); fetchGroups(); }
  };

  const addRule = () => {
    if (!editing) return;
    setEditing({ ...editing, rules: [...(editing.rules || []), { field: "total_spent_gt", value: "0" }] });
  };
  const removeRule = (idx: number) => {
    if (!editing) return;
    const rules = [...(editing.rules || [])];
    rules.splice(idx, 1);
    setEditing({ ...editing, rules });
  };
  const updateRule = (idx: number, key: string, val: string) => {
    if (!editing) return;
    const rules = [...(editing.rules || [])];
    rules[idx] = { ...rules[idx], [key]: val };
    setEditing({ ...editing, rules });
  };

  const updateBenefit = (key: string, val: any) => {
    if (!editing) return;
    setEditing({ ...editing, benefits: { ...(editing.benefits || {}), [key]: val } });
  };

  const previewRules = async () => {
    if (!editing?.rules?.length) { setPreviewCount(0); return; }
    setPreviewLoading(true);
    // Simple preview: count profiles (we can't run complex queries client-side easily, just show count from orders)
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    setPreviewCount(count || 0);
    setPreviewLoading(false);
    toast.info(`Aproximativ ${count || 0} clienți se potrivesc regulilor (estimare)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grupuri Clienți</h1>
          <p className="text-sm text-muted-foreground">Gestionează grupurile de clienți manuale și dinamice</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Grup Nou</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total grupuri</p>
            <p className="text-2xl font-bold text-foreground">{groups.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Grupuri dinamice</p>
            <p className="text-2xl font-bold text-foreground">{groups.filter(g => g.type === "dynamic").length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total membri</p>
            <p className="text-2xl font-bold text-foreground">{groups.reduce((s, g) => s + (g.member_count || 0), 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cu discount</p>
            <p className="text-2xl font-bold text-foreground">{groups.filter(g => (g.discount_percentage || 0) > 0 || (g.benefits as any)?.discount > 0).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups table */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nu există grupuri. Creează primul grup.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Grup</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Membri</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead>Beneficii</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(g => (
                  <TableRow key={g.id} className="border-border cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/customers/groups/${g.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={g.color || ""}>{g.name}</Badge>
                        {g.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                      </div>
                      {g.description && <p className="text-xs text-muted-foreground mt-1">{g.description}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={g.type === "dynamic" ? "default" : "secondary"}>
                        {g.type === "dynamic" ? "Dinamic" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{g.member_count || 0}</TableCell>
                    <TableCell className="text-right font-mono">
                      {(g.discount_percentage || 0) > 0 ? `${g.discount_percentage}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(g.benefits as any)?.free_shipping && <Badge variant="outline" className="text-xs">🚚 Gratuit</Badge>}
                        {(g.benefits as any)?.early_access_hours > 0 && <Badge variant="outline" className="text-xs">⏰ Early</Badge>}
                        {(g.benefits as any)?.welcome_message && <Badge variant="outline" className="text-xs">💬 Mesaj</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteGroup(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editează Grupul" : "Grup Nou"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="rules">Reguli</TabsTrigger>
                <TabsTrigger value="benefits">Beneficii</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nume grup *</Label>
                    <Input value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="ex: VIP, Angrosisti" />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={editing.slug || ""} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="auto-generat" />
                  </div>
                </div>
                <div>
                  <Label>Descriere</Label>
                  <Input value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Culoare badge</Label>
                    <Select value={editing.color || COLOR_OPTIONS[0].value} onValueChange={v => setEditing({ ...editing, color: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            <span className="flex items-center gap-2"><Badge className={c.value}>{c.label}</Badge></span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tip</Label>
                    <Select value={editing.type || "manual"} onValueChange={v => setEditing({ ...editing, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="dynamic">Dinamic (auto-reguli)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_default || false} onCheckedChange={v => setEditing({ ...editing, is_default: v })} />
                  <Label>Grup implicit (toți clienții noi)</Label>
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4">
                {editing.type !== "dynamic" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Regulile sunt disponibile doar pentru grupuri dinamice.</p>
                    <p className="text-xs">Schimbă tipul la „Dinamic" în tab-ul General.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Toate condițiile trebuie îndeplinite (AND):</p>
                    {(editing.rules || []).map((rule: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                        <Select value={rule.field} onValueChange={v => updateRule(idx, "field", v)}>
                          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {RULE_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input className="w-32" value={rule.value} onChange={e => updateRule(idx, "value", e.target.value)} placeholder="Valoare" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeRule(idx)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={addRule}><Plus className="h-3.5 w-3.5 mr-1" /> Adaugă condiție</Button>
                      <Button variant="secondary" size="sm" onClick={previewRules} disabled={previewLoading}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> {previewLoading ? "Se calculează..." : "Preview"}
                      </Button>
                    </div>
                    {previewCount !== null && (
                      <p className="text-sm text-primary font-medium">~{previewCount} clienți se potrivesc regulilor</p>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="benefits" className="space-y-4">
                <div>
                  <Label>Discount automat (%)</Label>
                  <Input type="number" min={0} max={100} value={editing.discount_percentage || 0} onChange={e => setEditing({ ...editing, discount_percentage: Number(e.target.value) })} />
                  <p className="text-xs text-muted-foreground mt-1">Reducere aplicată automat la toate produsele</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={(editing.benefits as any)?.free_shipping || false} onCheckedChange={v => updateBenefit("free_shipping", v)} />
                  <Label>Transport gratuit automat</Label>
                </div>
                <div>
                  <Label>Acces anticipat promoții (ore înainte)</Label>
                  <Input type="number" min={0} value={(editing.benefits as any)?.early_access_hours || 0} onChange={e => updateBenefit("early_access_hours", Number(e.target.value))} />
                </div>
                <div>
                  <Label>Mesaj personalizat homepage</Label>
                  <Input value={(editing.benefits as any)?.welcome_message || ""} onChange={e => updateBenefit("welcome_message", e.target.value)} placeholder="ex: Bine ai revenit, client VIP!" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={(editing.benefits as any)?.override_pricing_rules || false} onCheckedChange={v => updateBenefit("override_pricing_rules", v)} />
                  <Label>Discountul de grup suprascrie regulile de preț</Label>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Se salvează..." : "Salvează"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
