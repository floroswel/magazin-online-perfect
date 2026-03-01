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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag, Percent, Gift, Truck } from "lucide-react";
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
  name: "",
  type: "percentage",
  discount_type: "percentage",
  discount_value: 10,
  max_discount: null as number | null,
  badge_text: "",
  starts_at: "",
  ends_at: "",
  max_uses: null as number | null,
  max_uses_per_user: 1,
  is_combinable: false,
  priority: 0,
  status: "draft",
  conditions: {} as any,
};

export default function AdminPromotions() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        type: form.type,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        max_discount: form.max_discount,
        badge_text: form.badge_text || null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        max_uses: form.max_uses,
        max_uses_per_user: form.max_uses_per_user,
        is_combinable: form.is_combinable,
        priority: form.priority,
        status: form.status,
        conditions: form.conditions,
      };
      if (editId) {
        const { error } = await supabase.from("promotions").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promotions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success(editId ? "Promoție actualizată!" : "Promoție creată!");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Eroare la salvare."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Promoție ștearsă!");
    },
  });

  const resetForm = () => { setForm(defaultForm); setEditId(null); };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      type: p.type,
      discount_type: p.discount_type || "percentage",
      discount_value: p.discount_value || 0,
      max_discount: p.max_discount,
      badge_text: p.badge_text || "",
      starts_at: p.starts_at ? p.starts_at.slice(0, 16) : "",
      ends_at: p.ends_at ? p.ends_at.slice(0, 16) : "",
      max_uses: p.max_uses,
      max_uses_per_user: p.max_uses_per_user || 1,
      is_combinable: p.is_combinable || false,
      priority: p.priority || 0,
      status: p.status || "draft",
      conditions: p.conditions || {},
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Promoții</h2>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Promoție nouă</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editează promoția" : "Promoție nouă"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nume promoție</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Black Friday -30%" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tip promoție</Label>
                  <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROMO_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Activ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.type !== "free_shipping" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tip discount</Label>
                    <Select value={form.discount_type} onValueChange={(v) => setForm(f => ({ ...f, discount_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Procentual (%)</SelectItem>
                        <SelectItem value="fixed">Fix (RON)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valoare</Label>
                    <Input type="number" value={form.discount_value} onChange={(e) => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} />
                  </div>
                </div>
              )}

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Utilizări maxime</Label>
                  <Input type="number" value={form.max_uses ?? ""} onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))} placeholder="Nelimitat" />
                </div>
                <div>
                  <Label>Prioritate</Label>
                  <Input type="number" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: Number(e.target.value) }))} />
                </div>
              </div>

              <div>
                <Label>Text badge produs</Label>
                <Input value={form.badge_text} onChange={(e) => setForm(f => ({ ...f, badge_text: e.target.value }))} placeholder="Ex: -30% BLACK FRIDAY" />
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.is_combinable} onCheckedChange={(v) => setForm(f => ({ ...f, is_combinable: v }))} />
                <Label>Combinabilă cu alte promoții</Label>
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
                <TableHead>Nume</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Perioadă</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Utilizări</TableHead>
                <TableHead className="w-20"></TableHead>
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
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm">{typeInfo?.label || p.type}</TableCell>
                    <TableCell className="text-sm">
                      {p.type === "free_shipping" ? "—" : `${p.discount_value}${p.discount_type === "percentage" ? "%" : " RON"}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.starts_at ? new Date(p.starts_at).toLocaleDateString("ro-RO") : "—"} →{" "}
                      {p.ends_at ? new Date(p.ends_at).toLocaleDateString("ro-RO") : "∞"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[status] || ""}`}>{status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.used_count || 0}{p.max_uses ? `/${p.max_uses}` : ""}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
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
