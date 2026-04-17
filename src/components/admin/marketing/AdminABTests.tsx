import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { FlaskConical, Plus, Pencil, Trash2, Trophy, Play, Square } from "lucide-react";
import { toast } from "sonner";

const TEST_TYPES = [
  { value: "page", label: "Pagină" },
  { value: "price", label: "Preț" },
  { value: "promotion", label: "Promoție" },
  { value: "layout", label: "Layout" },
  { value: "cta", label: "CTA / Buton" },
];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-muted text-muted-foreground" },
  running: { label: "Activ", class: "bg-green-100 text-green-800" },
  paused: { label: "Pauză", class: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Finalizat", class: "bg-blue-100 text-blue-800" },
};

const defaultForm = {
  name: "", test_type: "page", traffic_percent: 50,
  variant_a: { name: "Control", description: "" },
  variant_b: { name: "Variantă", description: "" },
  starts_at: "", ends_at: "",
};

export default function AdminABTests() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["admin-ab-tests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ab_tests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, test_type: form.test_type, traffic_percent: form.traffic_percent,
        variant_a: form.variant_a as any, variant_b: form.variant_b as any,
        starts_at: form.starts_at || null, ends_at: form.ends_at || null,
      };
      if (editId) {
        const { error } = await (supabase as any).from("ab_tests").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("ab_tests").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ab-tests"] }); toast.success("Test salvat!"); setDialogOpen(false); resetForm(); },
    onError: () => toast.error("Eroare la salvare."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("ab_tests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ab-tests"] }); toast.success("Test șters!"); },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("ab_tests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ab-tests"] }); toast.success("Status actualizat!"); },
  });

  const declareWinner = useMutation({
    mutationFn: async ({ id, winner }: { id: string; winner: string }) => {
      const { error } = await (supabase as any).from("ab_tests").update({ winner, status: "completed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ab-tests"] }); toast.success("Câștigător declarat!"); },
  });

  const resetForm = () => { setForm(defaultForm); setEditId(null); };

  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({
      name: t.name, test_type: t.test_type, traffic_percent: t.traffic_percent,
      variant_a: t.variant_a || { name: "Control", description: "" },
      variant_b: t.variant_b || { name: "Variantă", description: "" },
      starts_at: t.starts_at ? t.starts_at.slice(0, 16) : "", ends_at: t.ends_at ? t.ends_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const convRate = (conv: number, imp: number) => imp > 0 ? ((conv / imp) * 100).toFixed(1) + "%" : "—";

  const activeCount = tests.filter((t: any) => t.status === "running").length;
  const completedCount = tests.filter((t: any) => t.status === "completed").length;
  const bestImprovement = tests.filter((t: any) => t.status === "completed" && t.impressions_a > 0 && t.impressions_b > 0)
    .map((t: any) => { const rA = t.conversions_a / t.impressions_a; const rB = t.conversions_b / t.impressions_b; return rA > 0 ? ((rB - rA) / rA * 100) : 0; })
    .sort((a: number, b: number) => b - a)[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><FlaskConical className="w-5 h-5" /> Teste A/B</h1>
          <p className="text-sm text-muted-foreground">Teste A/B pentru pagini, prețuri și promoții.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Test nou</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editează testul" : "Test A/B nou"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nume test</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Buton roșu vs albastru" /></div>
              <div><Label>Tip test</Label>
                <Select value={form.test_type} onValueChange={v => setForm(f => ({ ...f, test_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trafic variantă B: {form.traffic_percent}%</Label>
                <Slider value={[form.traffic_percent]} onValueChange={([v]) => setForm(f => ({ ...f, traffic_percent: v }))} min={10} max={90} step={5} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Varianta A (Control)</Label>
                  <Input value={form.variant_a.name} onChange={e => setForm(f => ({ ...f, variant_a: { ...f.variant_a, name: e.target.value } }))} placeholder="Nume" />
                  <Input value={form.variant_a.description} onChange={e => setForm(f => ({ ...f, variant_a: { ...f.variant_a, description: e.target.value } }))} placeholder="Descriere" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Varianta B</Label>
                  <Input value={form.variant_b.name} onChange={e => setForm(f => ({ ...f, variant_b: { ...f.variant_b, name: e.target.value } }))} placeholder="Nume" />
                  <Input value={form.variant_b.description} onChange={e => setForm(f => ({ ...f, variant_b: { ...f.variant_b, description: e.target.value } }))} placeholder="Descriere" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Începe la</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} /></div>
                <div><Label>Se termină la</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>{saveMutation.isPending ? "..." : editId ? "Actualizează" : "Creează"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{activeCount}</p><p className="text-xs text-muted-foreground">Teste active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{completedCount}</p><p className="text-xs text-muted-foreground">Finalizate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{bestImprovement ? `+${bestImprovement.toFixed(1)}%` : "—"}</p><p className="text-xs text-muted-foreground">Cea mai bună îmbunătățire</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume test</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Trafic B</TableHead>
                <TableHead>Varianta A</TableHead>
                <TableHead>Varianta B</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : tests.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nu există teste A/B configurate.</TableCell></TableRow>
              ) : tests.map((t: any) => {
                const st = STATUS_MAP[t.status] || STATUS_MAP.draft;
                const va = t.variant_a as any || {};
                const vb = t.variant_b as any || {};
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}{t.winner && <Badge className="ml-2 bg-amber-100 text-amber-800 text-[10px]"><Trophy className="w-3 h-3 mr-0.5" />{t.winner}</Badge>}</TableCell>
                    <TableCell className="text-sm">{TEST_TYPES.find(x => x.value === t.test_type)?.label || t.test_type}</TableCell>
                    <TableCell className="text-sm">{t.traffic_percent}%</TableCell>
                    <TableCell className="text-xs"><div>{va.name || "A"}</div><div className="text-muted-foreground">{t.impressions_a} imp · {convRate(t.conversions_a, t.impressions_a)}</div></TableCell>
                    <TableCell className="text-xs"><div>{vb.name || "B"}</div><div className="text-muted-foreground">{t.impressions_b} imp · {convRate(t.conversions_b, t.impressions_b)}</div></TableCell>
                    <TableCell><Badge className={`text-xs ${st.class}`}>{st.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {t.status === "draft" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus.mutate({ id: t.id, status: "running" })} title="Pornește"><Play className="h-3.5 w-3.5 text-green-600" /></Button>}
                        {t.status === "running" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus.mutate({ id: t.id, status: "paused" })} title="Pauză"><Square className="h-3.5 w-3.5 text-amber-600" /></Button>}
                        {t.status === "running" && (
                          <Select onValueChange={w => declareWinner.mutate({ id: t.id, winner: w })}>
                            <SelectTrigger className="h-7 w-7 p-0 border-0"><Trophy className="h-3.5 w-3.5 text-primary mx-auto" /></SelectTrigger>
                            <SelectContent><SelectItem value="A">A câștigă</SelectItem><SelectItem value="B">B câștigă</SelectItem></SelectContent>
                          </Select>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
