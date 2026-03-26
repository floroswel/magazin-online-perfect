import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Plus, Trash2, Edit, Zap, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface CartbotRule {
  id: string;
  name: string;
  type: "cross_sell" | "upsell" | "bundle_suggest" | "free_gift" | "discount_threshold";
  trigger_condition: string;
  trigger_value: string;
  action: string;
  action_value: string;
  message: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

const RULE_TYPES = [
  { value: "cross_sell", label: "Cross-sell automat", icon: "🔄" },
  { value: "upsell", label: "Upsell (produs mai bun)", icon: "⬆️" },
  { value: "bundle_suggest", label: "Sugestie pachet", icon: "📦" },
  { value: "free_gift", label: "Cadou gratuit", icon: "🎁" },
  { value: "discount_threshold", label: "Discount la prag", icon: "💰" },
];

const TRIGGER_CONDITIONS = [
  { value: "cart_total_above", label: "Total coș > sumă" },
  { value: "cart_total_below", label: "Total coș < sumă" },
  { value: "item_count_above", label: "Nr. produse > valoare" },
  { value: "contains_category", label: "Conține categorie" },
  { value: "contains_brand", label: "Conține brand" },
  { value: "contains_product", label: "Conține produs specific" },
  { value: "always", label: "Întotdeauna" },
];

const ACTIONS = [
  { value: "suggest_products", label: "Sugerează produse" },
  { value: "suggest_category", label: "Sugerează din categorie" },
  { value: "add_free_product", label: "Adaugă produs gratuit" },
  { value: "apply_discount_percent", label: "Aplică discount %" },
  { value: "apply_discount_fixed", label: "Aplică discount fix" },
  { value: "show_message", label: "Afișează mesaj" },
  { value: "free_shipping", label: "Transport gratuit" },
];

export default function AdminCartbot() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CartbotRule | null>(null);
  const [form, setForm] = useState({
    name: "", type: "cross_sell" as string, trigger_condition: "always",
    trigger_value: "", action: "suggest_products", action_value: "",
    message: "", priority: 10, is_active: true,
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["admin-cartbot-rules"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", "cartbot_rules").maybeSingle();
      return ((data?.value_json as any) || []) as CartbotRule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: CartbotRule[]) => {
      const { error } = await supabase.from("app_settings").upsert({
        key: "cartbot_rules",
        value_json: updated as any,
        description: "Cartbot AI cross-sell rules",
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cartbot-rules"] });
      toast.success("Regulă salvată!");
    },
  });

  const openNew = () => {
    setEditingRule(null);
    setForm({ name: "", type: "cross_sell", trigger_condition: "always", trigger_value: "", action: "suggest_products", action_value: "", message: "", priority: 10, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (rule: CartbotRule) => {
    setEditingRule(rule);
    setForm({ name: rule.name, type: rule.type, trigger_condition: rule.trigger_condition, trigger_value: rule.trigger_value, action: rule.action, action_value: rule.action_value, message: rule.message, priority: rule.priority, is_active: rule.is_active });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Numele regulii este obligatoriu"); return; }
    const newRule: CartbotRule = {
      id: editingRule?.id || crypto.randomUUID(),
      ...form,
      type: form.type as CartbotRule["type"],
      created_at: editingRule?.created_at || new Date().toISOString(),
    };
    const updated = editingRule
      ? rules.map(r => r.id === editingRule.id ? newRule : r)
      : [...rules, newRule];
    saveMutation.mutate(updated);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    saveMutation.mutate(rules.filter(r => r.id !== id));
  };

  const handleToggle = (id: string) => {
    saveMutation.mutate(rules.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
  };

  const activeRules = rules.filter(r => r.is_active).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Bot className="w-5 h-5" /> Cartbot — Reguli AI pentru Coș</h2>
          <p className="text-sm text-muted-foreground">Reguli automate de cross-sell, upsell și recomandări în coșul de cumpărături</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Regulă nouă</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Zap className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total reguli</p><p className="text-xl font-bold text-foreground">{rules.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><ShoppingCart className="w-5 h-5 text-green-500" /></div>
          <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-foreground">{activeRules}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><Package className="w-5 h-5 text-blue-500" /></div>
          <div><p className="text-xs text-muted-foreground">Cross-sell</p><p className="text-xl font-bold text-foreground">{rules.filter(r => r.type === "cross_sell").length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10"><TrendingUp className="w-5 h-5 text-purple-500" /></div>
          <div><p className="text-xs text-muted-foreground">Upsell</p><p className="text-xl font-bold text-foreground">{rules.filter(r => r.type === "upsell").length}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Reguli Cartbot</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Se încarcă...</p>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nu există reguli Cartbot.</p>
              <Button variant="outline" className="mt-3" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Creează prima regulă</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activ</TableHead>
                  <TableHead>Nume</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Condiție</TableHead>
                  <TableHead>Acțiune</TableHead>
                  <TableHead>Prioritate</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.sort((a, b) => b.priority - a.priority).map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell><Switch checked={rule.is_active} onCheckedChange={() => handleToggle(rule.id)} /></TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {RULE_TYPES.find(t => t.value === rule.type)?.icon} {RULE_TYPES.find(t => t.value === rule.type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {TRIGGER_CONDITIONS.find(t => t.value === rule.trigger_condition)?.label}
                      {rule.trigger_value ? `: ${rule.trigger_value}` : ""}
                    </TableCell>
                    <TableCell className="text-sm">{ACTIONS.find(a => a.value === rule.action)?.label}</TableCell>
                    <TableCell><Badge variant="outline">{rule.priority}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editează regulă" : "Regulă nouă Cartbot"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nume regulă</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Cross-sell accesorii telefon" /></div>
            <div><Label>Tip</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RULE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Condiție declanșare</Label>
                <Select value={form.trigger_condition} onValueChange={v => setForm(f => ({ ...f, trigger_condition: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRIGGER_CONDITIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valoare condiție</Label><Input value={form.trigger_value} onChange={e => setForm(f => ({ ...f, trigger_value: e.target.value }))} placeholder="ex: 200, electronics" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Acțiune</Label>
                <Select value={form.action} onValueChange={v => setForm(f => ({ ...f, action: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valoare acțiune</Label><Input value={form.action_value} onChange={e => setForm(f => ({ ...f, action_value: e.target.value }))} placeholder="ex: product-id, 15%" /></div>
            </div>
            <div><Label>Mesaj afișat în coș</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="ex: Adaugă o husă și primești 10% discount!" rows={2} /></div>
            <div className="flex items-center gap-4">
              <div className="flex-1"><Label>Prioritate</Label><Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} /></div>
              <div className="flex items-center gap-2 pt-5"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Activ</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Se salvează..." : "Salvează"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
