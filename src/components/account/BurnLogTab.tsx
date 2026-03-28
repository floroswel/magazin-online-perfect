import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Flame, Plus, Clock, Calendar, Star } from "lucide-react";
import { toast } from "sonner";

const MOODS = [
  { value: "relaxat", label: "😌 Relaxat" },
  { value: "energic", label: "⚡ Energic" },
  { value: "romantic", label: "🥰 Romantic" },
  { value: "concentrat", label: "🎯 Concentrat" },
  { value: "festiv", label: "🎉 Festiv" },
  { value: "melancolic", label: "🌙 Melancolic" },
];

export default function BurnLogTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    product_name: "",
    burn_date: new Date().toISOString().split("T")[0],
    duration_minutes: "60",
    mood: "",
    notes: "",
    rating: "5",
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["burn-logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from("burn_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("burn_date", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["user-products-for-burnlog"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").eq("visible", true);
      return data || [];
    },
  });

  const totalBurns = logs.length;
  const totalMinutes = logs.reduce((s: number, l: any) => s + (l.duration_minutes || 0), 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  const save = async () => {
    if (!user || !form.product_name) { toast.error("Selectează o lumânare"); return; }
    const product = products.find((p: any) => p.name === form.product_name);
    const { error } = await supabase.from("burn_logs").insert({
      user_id: user.id,
      product_id: product?.id || null,
      product_name: form.product_name,
      burn_date: form.burn_date,
      duration_minutes: parseInt(form.duration_minutes) || 60,
      mood: form.mood || null,
      notes: form.notes || null,
      rating: parseInt(form.rating) || null,
    } as any);
    if (error) { toast.error("Eroare la salvare"); return; }
    toast.success("Sesiune de ardere înregistrată! 🕯️");
    setDialogOpen(false);
    setForm({ product_name: "", burn_date: new Date().toISOString().split("T")[0], duration_minutes: "60", mood: "", notes: "", rating: "5" });
    queryClient.invalidateQueries({ queryKey: ["burn-logs"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-normal flex items-center gap-2">
          <Flame className="h-5 w-5 text-ventuza-amber" /> Jurnalul Lumânărilor
        </h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Adaugă sesiune
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <Flame className="h-4 w-4 mx-auto text-ventuza-amber mb-1" />
          <p className="text-lg font-bold">{totalBurns}</p>
          <p className="text-[10px] text-muted-foreground">Sesiuni</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Clock className="h-4 w-4 mx-auto text-ventuza-amber mb-1" />
          <p className="text-lg font-bold">{totalHours}h</p>
          <p className="text-[10px] text-muted-foreground">Total ars</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Star className="h-4 w-4 mx-auto text-ventuza-amber mb-1" />
          <p className="text-lg font-bold">{logs.length > 0 ? (logs.reduce((s: number, l: any) => s + (l.rating || 0), 0) / logs.filter((l: any) => l.rating).length || 0).toFixed(1) : "—"}</p>
          <p className="text-[10px] text-muted-foreground">Rating mediu</p>
        </CardContent></Card>
      </div>

      {/* Log entries */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Se încarcă...</p>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Flame className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Nicio sesiune înregistrată</p>
            <p className="text-sm text-muted-foreground mt-1">Ține evidența lumânărilor tale și descoperă parfumurile preferate.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{log.product_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(log.burn_date).toLocaleDateString("ro-RO")}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{log.duration_minutes} min</span>
                      {log.mood && <Badge variant="secondary" className="text-[10px]">{MOODS.find(m => m.value === log.mood)?.label || log.mood}</Badge>}
                    </div>
                    {log.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{log.notes}"</p>}
                  </div>
                  {log.rating && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: log.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-ventuza-amber text-ventuza-amber" />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>🕯️ Înregistrează o sesiune de ardere</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lumânare</Label>
              <Select value={form.product_name} onValueChange={v => setForm(f => ({ ...f, product_name: v }))}>
                <SelectTrigger><SelectValue placeholder="Alege lumânarea" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={form.burn_date} onChange={e => setForm(f => ({ ...f, burn_date: e.target.value }))} /></div>
              <div><Label>Durată (minute)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} min="5" max="480" /></div>
            </div>
            <div>
              <Label>Stare de spirit</Label>
              <Select value={form.mood} onValueChange={v => setForm(f => ({ ...f, mood: v }))}>
                <SelectTrigger><SelectValue placeholder="Opțional" /></SelectTrigger>
                <SelectContent>
                  {MOODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, rating: String(n) }))} className="p-1">
                    <Star className={`h-5 w-5 ${n <= parseInt(form.rating) ? "fill-ventuza-amber text-ventuza-amber" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Note (opțional)</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Cum a fost experiența?" rows={3} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvează</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
