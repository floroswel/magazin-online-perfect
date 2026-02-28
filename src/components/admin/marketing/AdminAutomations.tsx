import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Zap, Plus, Pencil, Trash2, Play, Pause, ChevronRight,
  Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// ─── Constants ───
const TRIGGER_EVENTS = [
  { value: "order.created", label: "Comandă creată", group: "Comenzi" },
  { value: "order.paid", label: "Plată confirmată", group: "Comenzi" },
  { value: "order.shipped", label: "Comandă expediată", group: "Comenzi" },
  { value: "order.delivered", label: "Comandă livrată", group: "Comenzi" },
  { value: "order.cancelled", label: "Comandă anulată", group: "Comenzi" },
  { value: "stock.low", label: "Stoc scăzut (< prag)", group: "Stoc" },
  { value: "stock.zero", label: "Stoc epuizat", group: "Stoc" },
  { value: "cart.abandoned", label: "Coș abandonat", group: "Marketing" },
  { value: "user.registered", label: "Client nou înregistrat", group: "Clienți" },
  { value: "review.created", label: "Review nou", group: "Clienți" },
  { value: "return.requested", label: "Retur solicitat", group: "Comenzi" },
  { value: "payment.failed", label: "Plată eșuată", group: "Plăți" },
];

const CONDITION_OPERATORS = [
  { value: "equals", label: "=" },
  { value: "not_equals", label: "≠" },
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "contains", label: "conține" },
  { value: "in", label: "în lista" },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Trimite email", icon: "📧" },
  { value: "send_sms", label: "Trimite SMS", icon: "📱" },
  { value: "change_status", label: "Schimbă status comandă", icon: "🔄" },
  { value: "generate_invoice", label: "Generează factură", icon: "📄" },
  { value: "generate_awb", label: "Generează AWB", icon: "📦" },
  { value: "apply_coupon", label: "Aplică cupon", icon: "🎟️" },
  { value: "add_tag", label: "Adaugă tag client", icon: "🏷️" },
  { value: "notify_admin", label: "Notifică admin", icon: "🔔" },
  { value: "webhook", label: "Webhook extern", icon: "🌐" },
  { value: "update_field", label: "Actualizează câmp", icon: "✏️" },
];

const PRESET_AUTOMATIONS = [
  {
    name: "Factură + AWB la plată confirmată",
    trigger_event: "order.paid",
    conditions: [],
    actions: [
      { type: "generate_invoice", params: {} },
      { type: "generate_awb", params: {} },
      { type: "send_email", params: { template: "order_confirmed" } },
    ],
  },
  {
    name: "Notifică admin la stoc < 5",
    trigger_event: "stock.low",
    conditions: [{ field: "stock", operator: "less_than", value: "5" }],
    actions: [{ type: "notify_admin", params: { message: "Stoc critic!" } }],
  },
  {
    name: "Cere review la 7 zile după livrare",
    trigger_event: "order.delivered",
    conditions: [{ field: "days_since", operator: "equals", value: "7" }],
    actions: [{ type: "send_email", params: { template: "request_review", delay_hours: 168 } }],
  },
  {
    name: "Tag VIP pentru comenzi > 1000 RON",
    trigger_event: "order.created",
    conditions: [{ field: "total", operator: "greater_than", value: "1000" }],
    actions: [{ type: "add_tag", params: { tag: "VIP" } }],
  },
];

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  params: Record<string, string>;
}

interface AutomationForm {
  name: string;
  description: string;
  trigger_event: string;
  conditions: Condition[];
  actions: Action[];
  is_active: boolean;
}

const emptyForm: AutomationForm = {
  name: "",
  description: "",
  trigger_event: "",
  conditions: [],
  actions: [],
  is_active: true,
};

export default function AdminAutomations() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AutomationForm>(emptyForm);
  const [showRuns, setShowRuns] = useState<string | null>(null);

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["admin-automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: runs = [] } = useQuery({
    queryKey: ["automation-runs", showRuns],
    queryFn: async () => {
      if (!showRuns) return [];
      const { data, error } = await supabase
        .from("automation_runs")
        .select("*")
        .eq("automation_id", showRuns)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!showRuns,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: AutomationForm & { id?: string }) => {
      const payload = {
        name: data.name,
        description: data.description,
        trigger_event: data.trigger_event,
        conditions: data.conditions,
        actions: data.actions,
        is_active: data.is_active,
      };
      if (data.id) {
        const { error } = await supabase.from("automations").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("automations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-automations"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success(editingId ? "Automatizare actualizată!" : "Automatizare creată!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-automations"] });
      toast.success("Automatizare ștearsă!");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("automations").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-automations"] }),
  });

  const openEdit = (automation: any) => {
    setEditingId(automation.id);
    setForm({
      name: automation.name,
      description: automation.description || "",
      trigger_event: automation.trigger_event,
      conditions: automation.conditions || [],
      actions: automation.actions || [],
      is_active: automation.is_active,
    });
    setDialogOpen(true);
  };

  const loadPreset = (preset: typeof PRESET_AUTOMATIONS[0]) => {
    setEditingId(null);
    setForm({
      name: preset.name,
      description: "",
      trigger_event: preset.trigger_event,
      conditions: preset.conditions,
      actions: preset.actions as Action[],
      is_active: true,
    });
    setDialogOpen(true);
  };

  const addCondition = () => setForm(f => ({ ...f, conditions: [...f.conditions, { field: "", operator: "equals", value: "" }] }));
  const removeCondition = (i: number) => setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }));
  const updateCondition = (i: number, patch: Partial<Condition>) => setForm(f => ({
    ...f, conditions: f.conditions.map((c, idx) => idx === i ? { ...c, ...patch } : c),
  }));

  const addAction = () => setForm(f => ({ ...f, actions: [...f.actions, { type: "", params: {} }] }));
  const removeAction = (i: number) => setForm(f => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }));
  const updateAction = (i: number, patch: Partial<Action>) => setForm(f => ({
    ...f, actions: f.actions.map((a, idx) => idx === i ? { ...a, ...patch } : a),
  }));

  const triggerLabel = (event: string) => TRIGGER_EVENTS.find(t => t.value === event)?.label || event;
  const actionLabel = (type: string) => ACTION_TYPES.find(a => a.value === type)?.label || type;
  const actionIcon = (type: string) => ACTION_TYPES.find(a => a.value === type)?.icon || "⚡";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Automatizări (Rule Builder)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {automations.length} reguli · {automations.filter((a: any) => a.is_active).length} active
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="w-3.5 h-3.5" /> Regulă nouă
        </Button>
      </div>

      {/* Presets */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs text-muted-foreground">Șabloane predefinite</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESET_AUTOMATIONS.map((preset, i) => (
              <button
                key={i}
                onClick={() => loadPreset(preset)}
                className="text-left p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <p className="text-xs font-medium text-foreground line-clamp-2">{preset.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {triggerLabel(preset.trigger_event)} → {preset.actions.length} acțiuni
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Zap className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nicio automatizare configurată.</p>
            <p className="text-xs text-muted-foreground mt-1">Folosește un șablon de mai sus sau creează o regulă nouă.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {automations.map((auto: any) => (
            <Card key={auto.id} className={!auto.is_active ? "opacity-60" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={auto.is_active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: auto.id, is_active: checked })}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{auto.name}</h3>
                      <Badge variant="outline" className="text-[9px] px-1.5">{triggerLabel(auto.trigger_event)}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{(auto.conditions as any[])?.length || 0} condiții</span>
                      <span>→ {(auto.actions as any[])?.length || 0} acțiuni</span>
                      <span>Rulat: {auto.run_count}×</span>
                      {auto.last_run_at && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {format(new Date(auto.last_run_at), "dd MMM HH:mm", { locale: ro })}
                        </span>
                      )}
                    </div>
                    {/* Actions preview */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(auto.actions as any[])?.map((a: any, i: number) => (
                        <span key={i} className="text-[9px] bg-muted px-1.5 py-0.5 rounded">
                          {actionIcon(a.type)} {actionLabel(a.type)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRuns(showRuns === auto.id ? null : auto.id)} title="Istoric rulări">
                      <Clock className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(auto)} title="Editează">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Ștergi automatizarea?")) deleteMutation.mutate(auto.id); }}
                      title="Șterge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Runs inline */}
                {showRuns === auto.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium mb-2">Ultimele rulări</p>
                    {runs.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">Nicio rulare încă.</p>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {runs.map((run: any) => (
                          <div key={run.id} className="flex items-center gap-2 text-[10px]">
                            {run.status === "success" ? <CheckCircle2 className="w-3 h-3 text-green-600" /> :
                             run.status === "error" ? <XCircle className="w-3 h-3 text-red-600" /> :
                             <AlertTriangle className="w-3 h-3 text-yellow-600" />}
                            <span className="text-muted-foreground">
                              {format(new Date(run.created_at), "dd MMM HH:mm:ss", { locale: ro })}
                            </span>
                            {run.duration_ms && <span>{run.duration_ms}ms</span>}
                            {run.error_message && <span className="text-red-600 truncate">{run.error_message}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {editingId ? "Editare automatizare" : "Automatizare nouă"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Definește trigger → condiții → acțiuni
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <Label className="text-xs">Nume regulă *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-xs" placeholder="ex: Factură automată la plată" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descriere</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-xs h-16" placeholder="Opțional..." />
            </div>

            {/* Trigger */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-primary">⚡ Trigger (Când?)</Label>
              <Select value={form.trigger_event} onValueChange={v => setForm({ ...form, trigger_event: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selectează evenimentul" /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      <span className="text-muted-foreground mr-1">[{t.group}]</span> {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-primary">🔍 Condiții (Dacă?)</Label>
                <Button type="button" variant="outline" size="sm" className="h-6 text-[10px]" onClick={addCondition}>
                  <Plus className="w-3 h-3 mr-0.5" /> Condiție
                </Button>
              </div>
              {form.conditions.length === 0 && (
                <p className="text-[10px] text-muted-foreground">Fără condiții — se execută la fiecare trigger.</p>
              )}
              {form.conditions.map((cond, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input value={cond.field} onChange={e => updateCondition(i, { field: e.target.value })} className="h-7 text-[10px] flex-1" placeholder="câmp (ex: total)" />
                  <Select value={cond.operator} onValueChange={v => updateCondition(i, { operator: v })}>
                    <SelectTrigger className="h-7 text-[10px] w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPERATORS.map(op => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })} className="h-7 text-[10px] flex-1" placeholder="valoare" />
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCondition(i)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-primary">🎯 Acțiuni (Ce face?)</Label>
                <Button type="button" variant="outline" size="sm" className="h-6 text-[10px]" onClick={addAction}>
                  <Plus className="w-3 h-3 mr-0.5" /> Acțiune
                </Button>
              </div>
              {form.actions.length === 0 && (
                <p className="text-[10px] text-muted-foreground">Adaugă cel puțin o acțiune.</p>
              )}
              {form.actions.map((action, i) => (
                <div key={i} className="flex items-center gap-1.5 p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm">{actionIcon(action.type)}</span>
                  <Select value={action.type} onValueChange={v => updateAction(i, { type: v })}>
                    <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue placeholder="Tip acțiune" /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value} className="text-xs">{a.icon} {a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeAction(i)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label className="text-xs">Activă</Label>
              <Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button
              size="sm"
              className="text-xs"
              onClick={() => {
                if (!form.name.trim() || !form.trigger_event) {
                  toast.error("Completează numele și trigger-ul!");
                  return;
                }
                if (form.actions.length === 0) {
                  toast.error("Adaugă cel puțin o acțiune!");
                  return;
                }
                saveMutation.mutate({ ...form, id: editingId || undefined });
              }}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {editingId ? "Salvează" : "Creează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
