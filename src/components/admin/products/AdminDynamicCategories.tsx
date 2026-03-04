import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Zap, X, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Rule {
  type: string;
  value?: string;
  min?: number;
  max?: number;
}

interface DynamicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  display_order: number;
  visible: boolean;
  rules: Rule[];
  created_at: string;
  updated_at: string;
}

const RULE_TYPES = [
  { value: "price_range", label: "Interval de preț" },
  { value: "brand", label: "Brand" },
  { value: "tag", label: "Tag" },
  { value: "in_stock", label: "Status stoc" },
  { value: "has_discount", label: "Are reducere" },
  { value: "category", label: "Categorie statică" },
  { value: "min_rating", label: "Rating minim" },
];

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  icon: "",
  display_order: 0,
  visible: true,
  rules: [] as Rule[],
};

export default function AdminDynamicCategories() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-dynamic-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dynamic_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return (data || []) as unknown as DynamicCategory[];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-list"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("name").order("name");
      return (data || []).map((b) => b.name);
    },
  });

  const { data: staticCategories = [] } = useQuery({
    queryKey: ["static-categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        image_url: values.image_url || null,
        icon: values.icon || null,
        display_order: values.display_order,
        visible: values.visible,
        rules: values.rules as any,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase.from("dynamic_categories").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dynamic_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dynamic-categories"] });
      toast.success(editingId ? "Categorie smart actualizată!" : "Categorie smart creată!");
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dynamic_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dynamic-categories"] });
      toast.success("Categorie smart ștearsă!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: DynamicCategory) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image_url: cat.image_url || "",
      icon: cat.icon || "",
      display_order: cat.display_order,
      visible: cat.visible,
      rules: Array.isArray(cat.rules) ? cat.rules : [],
    });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = editingId
      ? form.slug
      : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setForm((p) => ({ ...p, name, slug }));
  };

  const addRule = () => {
    setForm((p) => ({ ...p, rules: [...p.rules, { type: "brand", value: "" }] }));
  };

  const updateRule = (index: number, updates: Partial<Rule>) => {
    setForm((p) => ({
      ...p,
      rules: p.rules.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    }));
  };

  const removeRule = (index: number) => {
    setForm((p) => ({ ...p, rules: p.rules.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Numele și slug-ul sunt obligatorii.");
      return;
    }
    if (form.rules.length === 0) {
      toast.error("Adaugă cel puțin o regulă.");
      return;
    }
    upsertMutation.mutate(form);
  };

  const ruleLabel = (rule: Rule) => {
    const type = RULE_TYPES.find((t) => t.value === rule.type);
    switch (rule.type) {
      case "price_range":
        return `${type?.label}: ${rule.min} – ${rule.max} RON`;
      case "brand":
      case "tag":
        return `${type?.label}: ${rule.value}`;
      case "in_stock":
        return rule.value === "true" ? "În stoc" : "Fără stoc";
      case "has_discount":
        return rule.value === "true" ? "Cu reducere" : "Fără reducere";
      case "category":
        const cat = staticCategories.find((c) => c.id === rule.value);
        return `Categorie: ${cat?.name || rule.value}`;
      case "min_rating":
        return `Rating ≥ ${rule.value}`;
      default:
        return type?.label || rule.type;
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Categorii Smart ({categories.length})
          </h2>
          <p className="text-sm text-muted-foreground">Categorii dinamice populate automat pe baza regulilor definite.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Caută..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Adaugă</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nume</TableHead>
                <TableHead>Reguli</TableHead>
                <TableHead>Vizibilă</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nicio categorie smart. Creează una!
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="text-muted-foreground">{cat.display_order}</TableCell>
                    <TableCell>
                      <div className="font-medium">{cat.icon} {cat.name}</div>
                      <div className="text-xs text-muted-foreground">/{cat.slug}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(cat.rules) ? cat.rules : []).map((rule, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{ruleLabel(rule)}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cat.visible ? "default" : "outline"}>
                        {cat.visible ? "Da" : "Nu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm(`Ștergi "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editează Categorie Smart" : "Categorie Smart Nouă"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nume</Label>
                <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} required />
              </div>
            </div>
            <div>
              <Label>Descriere</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Icon (emoji)</Label>
                <Input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="🔥" />
              </div>
              <div>
                <Label>URL Imagine</Label>
                <Input value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <Label>Ordine afișare</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.visible} onCheckedChange={(v) => setForm((p) => ({ ...p, visible: v }))} />
              <Label>Vizibilă în storefront</Label>
            </div>

            {/* Rules builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Reguli (AND)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRule}><Plus className="w-3 h-3 mr-1" /> Regulă</Button>
              </div>
              <p className="text-xs text-muted-foreground">Produsele care respectă TOATE regulile vor fi incluse automat.</p>
              {form.rules.map((rule, idx) => (
                <Card key={idx}>
                  <CardContent className="p-3 flex items-start gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-2 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Select value={rule.type} onValueChange={(v) => updateRule(idx, { type: v, value: "", min: undefined, max: undefined })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {RULE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {rule.type === "price_range" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" placeholder="Min (RON)" value={rule.min || ""} onChange={(e) => updateRule(idx, { min: Number(e.target.value) })} />
                          <Input type="number" placeholder="Max (RON)" value={rule.max || ""} onChange={(e) => updateRule(idx, { max: Number(e.target.value) })} />
                        </div>
                      )}
                      {rule.type === "brand" && (
                        <Select value={rule.value || ""} onValueChange={(v) => updateRule(idx, { value: v })}>
                          <SelectTrigger><SelectValue placeholder="Alege brand" /></SelectTrigger>
                          <SelectContent>
                            {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      {rule.type === "tag" && (
                        <Input placeholder="Tag (ex: nou, popular)" value={rule.value || ""} onChange={(e) => updateRule(idx, { value: e.target.value })} />
                      )}
                      {(rule.type === "in_stock" || rule.type === "has_discount") && (
                        <Select value={rule.value || "true"} onValueChange={(v) => updateRule(idx, { value: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Da</SelectItem>
                            <SelectItem value="false">Nu</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {rule.type === "category" && (
                        <Select value={rule.value || ""} onValueChange={(v) => updateRule(idx, { value: v })}>
                          <SelectTrigger><SelectValue placeholder="Alege categorie" /></SelectTrigger>
                          <SelectContent>
                            {staticCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      {rule.type === "min_rating" && (
                        <Input type="number" min={1} max={5} step={0.5} placeholder="Rating minim (1-5)" value={rule.value || ""} onChange={(e) => updateRule(idx, { value: e.target.value })} />
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => removeRule(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {form.rules.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  Nicio regulă adăugată. Click pe "Regulă" pentru a adăuga.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Se salvează..." : editingId ? "Actualizează" : "Salvează"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
