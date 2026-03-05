import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, GripVertical, Mail, Flag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface OrderStatus {
  id: string;
  key: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  email_enabled: boolean;
  email_subject: string | null;
  email_body: string | null;
  is_final: boolean;
  is_default: boolean;
  sort_order: number;
  allowed_transitions: string[];
}

const EMOJI_OPTIONS = ["🆕", "✅", "⚙️", "📦", "🚚", "✅", "❌", "↩️", "⏳", "🏪", "💳", "🧾", "🔔", "⭐", "🎁", "🔧"];

export default function AdminOrderStatuses() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<OrderStatus | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ key: "", name: "", color: "#6366f1", icon: "📦", description: "", email_enabled: false, email_subject: "", email_body: "", is_final: false });

  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ["order-statuses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_statuses").select("*").order("sort_order");
      if (error) throw error;
      return data as OrderStatus[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (s: Partial<OrderStatus> & { id: string }) => {
      const { id, ...rest } = s;
      const { error } = await supabase.from("order_statuses").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["order-statuses"] }); setEditing(null); toast.success("Status salvat!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: async (s: typeof newForm) => {
      const maxSort = statuses.length > 0 ? Math.max(...statuses.map(x => x.sort_order)) : 0;
      const { error } = await supabase.from("order_statuses").insert({
        ...s, is_default: false, sort_order: maxSort + 1, allowed_transitions: [],
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["order-statuses"] }); setShowNew(false); setNewForm({ key: "", name: "", color: "#6366f1", icon: "📦", description: "", email_enabled: false, email_subject: "", email_body: "", is_final: false }); toast.success("Status creat!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("order_statuses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["order-statuses"] }); toast.success("Status șters!"); },
  });

  const moveStatus = async (id: string, direction: "up" | "down") => {
    const idx = statuses.findIndex(s => s.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= statuses.length) return;
    const a = statuses[idx], b = statuses[swapIdx];
    await supabase.from("order_statuses").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("order_statuses").update({ sort_order: a.sort_order }).eq("id", b.id);
    queryClient.invalidateQueries({ queryKey: ["order-statuses"] });
  };

  const toggleTransition = (fromKey: string, toKey: string) => {
    if (!editing) return;
    const current = editing.allowed_transitions || [];
    const updated = current.includes(toKey) ? current.filter(k => k !== toKey) : [...current, toKey];
    setEditing({ ...editing, allowed_transitions: updated });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Flag className="w-5 h-5" /> Statusuri Comenzi</h1>
          <p className="text-sm text-muted-foreground">Configurează statusurile comenzilor, culorile, notificările email și tranzițiile permise.</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" /> Status nou</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Se încarcă...</div>
            ) : statuses.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveStatus(s.id, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs">▲</button>
                  <button onClick={() => moveStatus(s.id, "down")} disabled={idx === statuses.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs">▼</button>
                </div>
                <span className="text-xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-semibold border" style={{ borderColor: s.color, color: s.color, backgroundColor: `${s.color}15` }}>
                      {s.name}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{s.key}</span>
                    {s.is_default && <Badge variant="secondary" className="text-[9px]">Implicit</Badge>}
                    {s.is_final && <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">Final</Badge>}
                    {s.email_enabled && <Mail className="w-3 h-3 text-blue-500" />}
                  </div>
                  {s.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>}
                  {s.allowed_transitions.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      {s.allowed_transitions.map(t => {
                        const target = statuses.find(x => x.key === t);
                        return target ? (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${target.color}15`, color: target.color }}>{target.name}</span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing({ ...s })}><Pencil className="w-3.5 h-3.5" /></Button>
                  {!s.is_default && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editare: {editing.icon} {editing.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nume</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Cheie (key)</Label><Input value={editing.key} onChange={e => setEditing({ ...editing, key: e.target.value })} disabled={editing.is_default} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Culoare</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={editing.color} onChange={e => setEditing({ ...editing, color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {EMOJI_OPTIONS.map(em => (
                      <button key={em} onClick={() => setEditing({ ...editing, icon: em })} className={`text-lg p-1 rounded hover:bg-muted ${editing.icon === em ? "bg-primary/20 ring-1 ring-primary" : ""}`}>{em}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div><Label>Descriere (internă)</Label><Textarea value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} /></div>

              <div className="flex items-center gap-3">
                <Switch checked={editing.is_final} onCheckedChange={v => setEditing({ ...editing, is_final: v })} />
                <Label>Status final (comanda se consideră închisă)</Label>
              </div>

              {/* Email notification */}
              <div className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <Switch checked={editing.email_enabled} onCheckedChange={v => setEditing({ ...editing, email_enabled: v })} />
                  <Label className="font-semibold">Trimite email la acest status</Label>
                </div>
                {editing.email_enabled && (
                  <>
                    <div><Label>Subiect email</Label><Input value={editing.email_subject || ""} onChange={e => setEditing({ ...editing, email_subject: e.target.value })} placeholder="Comanda {{id_comanda}} - {{status}}" /></div>
                    <div><Label>Corp email</Label><Textarea value={editing.email_body || ""} onChange={e => setEditing({ ...editing, email_body: e.target.value })} rows={4} placeholder="Dragă {{nume_client}}, comanda ta #{{id_comanda}} a fost actualizată..." className="font-mono text-xs" /></div>
                    <p className="text-[10px] text-muted-foreground">Variabile: {"{{nume_client}}, {{id_comanda}}, {{status}}, {{total}}"}</p>
                  </>
                )}
              </div>

              {/* Allowed transitions */}
              <div className="border rounded-lg p-3 space-y-2">
                <Label className="font-semibold">Tranziții permise (în ce status poate trece)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {statuses.filter(s => s.key !== editing.key).map(s => (
                    <label key={s.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={editing.allowed_transitions.includes(s.key)} onCheckedChange={() => toggleTransition(editing.key, s.key)} />
                      <span style={{ color: s.color }}>{s.icon} {s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* New Status Dialog */}
      {showNew && (
        <Dialog open onOpenChange={() => setShowNew(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Status nou</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Cheie (key, unică)</Label><Input value={newForm.key} onChange={e => setNewForm({ ...newForm, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="ex: awaiting_supplier" /></div>
              <div><Label>Nume afișat</Label><Input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="ex: Așteptare furnizor" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Culoare</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={newForm.color} onChange={e => setNewForm({ ...newForm, color: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={newForm.color} onChange={e => setNewForm({ ...newForm, color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {EMOJI_OPTIONS.slice(0, 8).map(em => (
                      <button key={em} onClick={() => setNewForm({ ...newForm, icon: em })} className={`text-lg p-1 rounded hover:bg-muted ${newForm.icon === em ? "bg-primary/20 ring-1 ring-primary" : ""}`}>{em}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div><Label>Descriere</Label><Input value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} /></div>
              <div className="flex items-center gap-3">
                <Switch checked={newForm.is_final} onCheckedChange={v => setNewForm({ ...newForm, is_final: v })} />
                <Label>Status final</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)}>Anulează</Button>
              <Button onClick={() => createMutation.mutate(newForm)} disabled={createMutation.isPending || !newForm.key || !newForm.name}>
                {createMutation.isPending ? "Se creează..." : "Creează"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
