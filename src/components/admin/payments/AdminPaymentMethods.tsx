import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CreditCard, Banknote, Building2, Wallet, GripVertical,
  Settings2, Plus, Trash2, CheckCircle2, XCircle, Store,
} from "lucide-react";

const typeIcons: Record<string, any> = {
  cash: Banknote, card: CreditCard, bank_transfer: Building2, wallet: Wallet, installments: CreditCard, pickup: Store,
};
const typeLabels: Record<string, string> = {
  cash: "Numerar", card: "Card", bank_transfer: "Transfer bancar", wallet: "Portofel digital", installments: "Rate", pickup: "Ridicare",
};

export default function AdminPaymentMethods() {
  const queryClient = useQueryClient();
  const [editMethod, setEditMethod] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: customerGroups = [] } = useQuery({
    queryKey: ["customer-groups-list"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_groups").select("id, name").order("name");
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("payment_methods").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payment-methods"] }); toast.success("Status actualizat"); },
  });

  const saveMutation = useMutation({
    mutationFn: async (method: any) => {
      const payload: any = {
        name: method.name, description: method.description, type: method.type,
        provider: method.provider, config_json: method.config_json,
        min_amount: method.min_amount, max_amount: method.max_amount,
        extra_fee_type: method.extra_fee_type || "none",
        extra_fee_value: method.extra_fee_value || 0,
        allowed_counties: method.allowed_counties?.length ? method.allowed_counties : null,
        allowed_customer_groups: method.allowed_customer_groups?.length ? method.allowed_customer_groups : null,
        bank_details: method.bank_details || null,
        payment_deadline_days: method.payment_deadline_days || null,
        sandbox_mode: method.sandbox_mode || false,
        bnpl_config: method.bnpl_config || null,
      };
      if (method.id) {
        const { error } = await supabase.from("payment_methods").update(payload).eq("id", method.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_methods").insert({ ...payload, key: method.key, display_order: methods.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payment-methods"] }); setEditMethod(null); setShowAdd(false); toast.success("Metodă salvată"); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payment-methods"] }); setEditMethod(null); toast.success("Metodă ștearsă"); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Metode de Plată</h1>
          <p className="text-sm text-muted-foreground">Configurează metodele de plată disponibile la checkout.</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Adaugă metodă</Button>
      </div>

      <div className="grid gap-3">
        {methods.map((m: any) => {
          const Icon = typeIcons[m.type] || CreditCard;
          const feeLabel = m.extra_fee_type === "fixed" ? `+${m.extra_fee_value} lei` : m.extra_fee_type === "percent" ? `+${m.extra_fee_value}%` : null;
          return (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{m.name}</span>
                    <Badge variant="outline" className="text-[10px]">{typeLabels[m.type] || m.type}</Badge>
                    {m.provider && m.provider !== "internal" && <Badge variant="secondary" className="text-[10px]">{m.provider}</Badge>}
                    {feeLabel && <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">{feeLabel}</Badge>}
                    {m.sandbox_mode && <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">Sandbox</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {m.is_active ? (
                    <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Activ</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="w-3.5 h-3.5" /> Inactiv</span>
                  )}
                  <Switch checked={m.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: m.id, is_active: checked })} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditMethod({ ...m })}>
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PaymentMethodDialog
        method={editMethod || (showAdd ? { name: "", key: "", type: "card", provider: "", description: "", config_json: {}, extra_fee_type: "none", extra_fee_value: 0, bank_details: null, allowed_counties: [], allowed_customer_groups: [], sandbox_mode: false, bnpl_config: null } : null)}
        open={!!editMethod || showAdd}
        onClose={() => { setEditMethod(null); setShowAdd(false); }}
        onSave={(m: any) => saveMutation.mutate(m)}
        onDelete={editMethod?.id ? () => deleteMutation.mutate(editMethod.id) : undefined}
        saving={saveMutation.isPending}
        customerGroups={customerGroups}
      />
    </div>
  );
}

function PaymentMethodDialog({ method, open, onClose, onSave, onDelete, saving, customerGroups }: any) {
  const [form, setForm] = useState<any>(method);
  const [countiesInput, setCountiesInput] = useState("");

  if (method && form && method.id !== form.id) setForm(method);
  if (!open || !method) return null;

  const currentForm = form || method;
  const update = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));
  const bankDetails = currentForm.bank_details || {};
  const updateBank = (k: string, v: string) => update("bank_details", { ...bankDetails, [k]: v });
  const bnpl = currentForm.bnpl_config || {};
  const updateBnpl = (k: string, v: any) => update("bnpl_config", { ...bnpl, [k]: v });

  const configEntries = Object.entries(currentForm.config_json || {});
  const handleConfigChange = (key: string, value: string) => update("config_json", { ...(currentForm.config_json || {}), [key]: value });

  const addCounty = () => {
    if (!countiesInput.trim()) return;
    const counties = currentForm.allowed_counties || [];
    if (!counties.includes(countiesInput.trim())) update("allowed_counties", [...counties, countiesInput.trim()]);
    setCountiesInput("");
  };

  const toggleGroup = (gid: string) => {
    const groups = currentForm.allowed_customer_groups || [];
    update("allowed_customer_groups", groups.includes(gid) ? groups.filter((g: string) => g !== gid) : [...groups, gid]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentForm.id ? "Editare" : "Adaugă"} metodă de plată</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="fees">Taxe & Limite</TabsTrigger>
            <TabsTrigger value="restrictions">Restricții</TabsTrigger>
            <TabsTrigger value="provider">Provider</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            {!currentForm.id && (
              <div><Label>Cheie unică (slug)</Label><Input value={currentForm.key || ""} onChange={e => update("key", e.target.value)} placeholder="ex: card_online" /></div>
            )}
            <div><Label>Nume</Label><Input value={currentForm.name} onChange={e => update("name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tip</Label>
                <Select value={currentForm.type} onValueChange={v => update("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Numerar (Ramburs)</SelectItem>
                    <SelectItem value="card">Card online</SelectItem>
                    <SelectItem value="bank_transfer">Transfer bancar</SelectItem>
                    <SelectItem value="wallet">Portofel digital</SelectItem>
                    <SelectItem value="installments">Rate (BNPL)</SelectItem>
                    <SelectItem value="pickup">Plată la sediu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Provider</Label><Input value={currentForm.provider || ""} onChange={e => update("provider", e.target.value)} placeholder="stripe, netopia, payu..." /></div>
            </div>
            <div><Label>Descriere</Label><Textarea value={currentForm.description || ""} onChange={e => update("description", e.target.value)} rows={2} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={currentForm.sandbox_mode || false} onCheckedChange={v => update("sandbox_mode", v)} />
              <Label>Mod Sandbox / Test</Label>
            </div>

            {/* Bank transfer details */}
            {currentForm.type === "bank_transfer" && (
              <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Detalii bancare (afișate clientului)</Label>
                <div><Label className="text-xs">Numele băncii</Label><Input value={bankDetails.bank_name || ""} onChange={e => updateBank("bank_name", e.target.value)} /></div>
                <div><Label className="text-xs">IBAN</Label><Input value={bankDetails.iban || ""} onChange={e => updateBank("iban", e.target.value)} /></div>
                <div><Label className="text-xs">Titular cont</Label><Input value={bankDetails.account_holder || ""} onChange={e => updateBank("account_holder", e.target.value)} /></div>
                <div><Label className="text-xs">Termen plată (zile)</Label><Input type="number" value={currentForm.payment_deadline_days ?? ""} onChange={e => update("payment_deadline_days", e.target.value ? Number(e.target.value) : null)} placeholder="ex: 3" /></div>
              </div>
            )}

            {/* BNPL config */}
            {currentForm.type === "installments" && (
              <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Configurare Rate</Label>
                <div><Label className="text-xs">URL redirect</Label><Input value={bnpl.redirect_url || ""} onChange={e => updateBnpl("redirect_url", e.target.value)} /></div>
                <div><Label className="text-xs">Sumă minimă eligibilă (lei)</Label><Input type="number" value={bnpl.min_eligible_amount ?? ""} onChange={e => updateBnpl("min_eligible_amount", e.target.value ? Number(e.target.value) : null)} /></div>
                <div><Label className="text-xs">Luni disponibile (ex: 3,6,12)</Label><Input value={bnpl.available_months || ""} onChange={e => updateBnpl("available_months", e.target.value)} placeholder="3,6,12" /></div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fees" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tip taxă suplimentară</Label>
                <Select value={currentForm.extra_fee_type || "none"} onValueChange={v => update("extra_fee_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Fără taxă</SelectItem>
                    <SelectItem value="fixed">Sumă fixă (lei)</SelectItem>
                    <SelectItem value="percent">Procent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {currentForm.extra_fee_type !== "none" && (
                <div>
                  <Label>{currentForm.extra_fee_type === "fixed" ? "Sumă (lei)" : "Procent (%)"}</Label>
                  <Input type="number" step="0.01" value={currentForm.extra_fee_value ?? 0} onChange={e => update("extra_fee_value", Number(e.target.value))} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sumă minimă (lei)</Label><Input type="number" value={currentForm.min_amount ?? ""} onChange={e => update("min_amount", e.target.value ? Number(e.target.value) : null)} /></div>
              <div><Label>Sumă maximă (lei)</Label><Input type="number" value={currentForm.max_amount ?? ""} onChange={e => update("max_amount", e.target.value ? Number(e.target.value) : null)} /></div>
            </div>
          </TabsContent>

          <TabsContent value="restrictions" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-semibold">Grupuri de clienți permise</Label>
              <p className="text-xs text-muted-foreground mb-2">Lasă nesetat pentru toți clienții</p>
              <div className="flex flex-wrap gap-2">
                {customerGroups.map((g: any) => {
                  const selected = (currentForm.allowed_customer_groups || []).includes(g.id);
                  return (
                    <Badge key={g.id} variant={selected ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleGroup(g.id)}>
                      {g.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Județe permise (doar pentru ramburs)</Label>
              <p className="text-xs text-muted-foreground mb-2">Lasă gol pentru toate județele</p>
              <div className="flex gap-2 mb-2">
                <Input value={countiesInput} onChange={e => setCountiesInput(e.target.value)} placeholder="ex: București" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCounty())} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addCounty}>Adaugă</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(currentForm.allowed_counties || []).map((c: string) => (
                  <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => update("allowed_counties", (currentForm.allowed_counties || []).filter((x: string) => x !== c))}>
                    {c} ×
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="provider" className="space-y-4 mt-4">
            {configEntries.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Configurare Provider</Label>
                {configEntries.map(([key, val]) => (
                  <div key={key}>
                    <Label className="text-xs">{key}</Label>
                    <Input value={String(val || "")} onChange={e => handleConfigChange(key, e.target.value)}
                      type={key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") ? "password" : "text"} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>Adaugă chei de configurare în câmpul config_json pentru a vedea setările aici.</p>
                <p className="text-xs mt-1">Ex: merchant_id, api_key, secret_key</p>
              </div>
            )}
            <div>
              <Label className="text-xs">Adaugă cheie nouă</Label>
              <div className="flex gap-2">
                <Input id="new-config-key" placeholder="ex: merchant_id" className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const input = document.getElementById("new-config-key") as HTMLInputElement;
                  if (input?.value) { handleConfigChange(input.value, ""); input.value = ""; }
                }}>Adaugă</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div>{onDelete && <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 mr-1" /> Șterge</Button>}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Anulează</Button>
            <Button onClick={() => onSave(currentForm)} disabled={saving}>{saving ? "Se salvează..." : "Salvează"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
