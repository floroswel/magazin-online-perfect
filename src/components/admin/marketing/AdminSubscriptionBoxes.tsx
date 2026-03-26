import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Repeat, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export default function AdminSubscriptionBoxes() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: 0, frequency: "monthly", max_subscribers: 0, is_active: true });

  const { data: boxes = [], isLoading } = useQuery({
    queryKey: ["admin-subscription-boxes"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", "subscription_boxes").maybeSingle();
      return ((data?.value_json as any) || []) as any[];
    },
  });

  const saveBoxes = async (updated: any[]) => {
    await supabase.from("app_settings").upsert({ key: "subscription_boxes", value_json: updated as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    queryClient.invalidateQueries({ queryKey: ["admin-subscription-boxes"] });
  };

  const addBox = async () => {
    if (!form.name.trim()) return;
    const newBox = { ...form, id: crypto.randomUUID(), created_at: new Date().toISOString(), subscribers: 0 };
    await saveBoxes([...boxes, newBox]);
    setForm({ name: "", description: "", price: 0, frequency: "monthly", max_subscribers: 0, is_active: true });
    setDialogOpen(false);
    toast.success("Cutie abonament creată!");
  };

  const toggleActive = async (id: string) => {
    const updated = boxes.map((b: any) => b.id === id ? { ...b, is_active: !b.is_active } : b);
    await saveBoxes(updated);
    toast.success("Status actualizat");
  };

  const deleteBox = async (id: string) => {
    await saveBoxes(boxes.filter((b: any) => b.id !== id));
    toast.success("Cutie ștearsă");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Repeat className="w-5 h-5" /> Subscription Boxes (Cutii Lunare)</h1>
          <p className="text-sm text-muted-foreground">Creează și gestionează abonamente lunare/periodice cu cutii de produse.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Cutie nouă</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Creare Subscription Box</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nume</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Cutia Lunară de Lumânări" /></div>
              <div><Label>Descriere</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Preț (RON/lună)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} /></div>
                <div>
                  <Label>Frecvență</Label>
                  <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Săptămânal</SelectItem>
                      <SelectItem value="biweekly">Bi-săptămânal</SelectItem>
                      <SelectItem value="monthly">Lunar</SelectItem>
                      <SelectItem value="quarterly">Trimestrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Limită abonați (0 = nelimitat)</Label><Input type="number" value={form.max_subscribers} onChange={e => setForm(f => ({ ...f, max_subscribers: +e.target.value }))} /></div>
              <div className="flex items-center justify-between"><Label>Activ</Label><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /></div>
            </div>
            <DialogFooter><Button onClick={addBox} disabled={!form.name.trim()}>Creează</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Package className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{boxes.length}</p><p className="text-xs text-muted-foreground">Total cutii</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Repeat className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{boxes.filter((b: any) => b.is_active).length}</p><p className="text-xs text-muted-foreground">Active</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Package className="w-8 h-8 text-amber-500" /><div><p className="text-2xl font-bold">{boxes.reduce((s: number, b: any) => s + (b.subscribers || 0), 0)}</p><p className="text-xs text-muted-foreground">Total abonați</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toate cutiile de abonament</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nume</TableHead><TableHead>Preț</TableHead><TableHead>Frecvență</TableHead><TableHead>Abonați</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Acțiuni</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : boxes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nicio cutie de abonament.</TableCell></TableRow>
              ) : boxes.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.price} RON</TableCell>
                  <TableCell className="text-sm">{b.frequency === "monthly" ? "Lunar" : b.frequency === "weekly" ? "Săptămânal" : b.frequency === "quarterly" ? "Trimestrial" : b.frequency}</TableCell>
                  <TableCell><Badge variant="secondary">{b.subscribers || 0}</Badge></TableCell>
                  <TableCell><Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id)} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBox(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
