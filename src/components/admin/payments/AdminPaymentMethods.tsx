import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  CreditCard, Banknote, Building2, Wallet, GripVertical,
  Settings2, Plus, Trash2, CheckCircle2, XCircle,
} from "lucide-react";

const typeIcons: Record<string, any> = {
  cash: Banknote,
  card: CreditCard,
  bank_transfer: Building2,
  wallet: Wallet,
  installments: CreditCard,
};

const typeLabels: Record<string, string> = {
  cash: "Numerar",
  card: "Card",
  bank_transfer: "Transfer bancar",
  wallet: "Portofel digital",
  installments: "Rate",
};

export default function AdminPaymentMethods() {
  const queryClient = useQueryClient();
  const [editMethod, setEditMethod] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Status actualizat");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (method: any) => {
      if (method.id) {
        const { error } = await supabase
          .from("payment_methods")
          .update({
            name: method.name,
            description: method.description,
            type: method.type,
            provider: method.provider,
            config_json: method.config_json,
            min_amount: method.min_amount,
            max_amount: method.max_amount,
          })
          .eq("id", method.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_methods")
          .insert({
            key: method.key,
            name: method.name,
            description: method.description,
            type: method.type,
            provider: method.provider || "internal",
            config_json: method.config_json || {},
            display_order: methods.length + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setEditMethod(null);
      setShowAdd(false);
      toast({ title: "Metodă salvată cu succes" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setEditMethod(null);
      toast({ title: "Metodă ștearsă" });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Se încarcă...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Metode de Plată</h1>
          <p className="text-sm text-muted-foreground">Configurează metodele de plată disponibile la checkout.</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adaugă metodă
        </Button>
      </div>

      <div className="grid gap-3">
        {methods.map((m: any) => {
          const Icon = typeIcons[m.type] || CreditCard;
          return (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <div className="flex items-center gap-1 text-muted-foreground cursor-grab">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{m.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {typeLabels[m.type] || m.type}
                    </Badge>
                    {m.provider && m.provider !== "internal" && (
                      <Badge variant="secondary" className="text-[10px]">
                        {m.provider}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {m.is_active ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Activ
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <XCircle className="w-3.5 h-3.5" /> Inactiv
                    </span>
                  )}
                  <Switch
                    checked={m.is_active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: m.id, is_active: checked })}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditMethod({ ...m })}>
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit / Add Dialog */}
      <PaymentMethodDialog
        method={editMethod || (showAdd ? { name: "", key: "", type: "card", provider: "", description: "", config_json: {} } : null)}
        open={!!editMethod || showAdd}
        onClose={() => { setEditMethod(null); setShowAdd(false); }}
        onSave={(m: any) => saveMutation.mutate(m)}
        onDelete={editMethod?.id ? () => deleteMutation.mutate(editMethod.id) : undefined}
        saving={saveMutation.isPending}
      />
    </div>
  );
}

function PaymentMethodDialog({ method, open, onClose, onSave, onDelete, saving }: any) {
  const [form, setForm] = useState<any>(method);

  // sync when method changes
  if (method && form && method.id !== form.id) {
    setForm(method);
  }
  if (!method && form) {
    // reset handled by open
  }

  if (!open || !method) return null;

  const configEntries = Object.entries((form || method).config_json || {});

  const handleConfigChange = (key: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      config_json: { ...(prev.config_json || {}), [key]: value },
    }));
  };

  const currentForm = form || method;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{currentForm.id ? "Editare" : "Adaugă"} metodă de plată</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!currentForm.id && (
            <div>
              <Label>Cheie unică (slug)</Label>
              <Input value={currentForm.key || ""} onChange={(e) => setForm({ ...currentForm, key: e.target.value })} placeholder="ex: card_online" />
            </div>
          )}
          <div>
            <Label>Nume</Label>
            <Input value={currentForm.name} onChange={(e) => setForm({ ...currentForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tip</Label>
              <Select value={currentForm.type} onValueChange={(v) => setForm({ ...currentForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Numerar</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Transfer bancar</SelectItem>
                  <SelectItem value="wallet">Portofel digital</SelectItem>
                  <SelectItem value="installments">Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider</Label>
              <Input value={currentForm.provider || ""} onChange={(e) => setForm({ ...currentForm, provider: e.target.value })} placeholder="netopia, stripe..." />
            </div>
          </div>
          <div>
            <Label>Descriere</Label>
            <Textarea value={currentForm.description || ""} onChange={(e) => setForm({ ...currentForm, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sumă minimă (RON)</Label>
              <Input type="number" value={currentForm.min_amount ?? ""} onChange={(e) => setForm({ ...currentForm, min_amount: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <Label>Sumă maximă (RON)</Label>
              <Input type="number" value={currentForm.max_amount ?? ""} onChange={(e) => setForm({ ...currentForm, max_amount: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          {configEntries.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Configurare Provider</Label>
              {configEntries.map(([key, val]) => (
                <div key={key}>
                  <Label className="text-xs">{key}</Label>
                  <Input
                    value={String(val || "")}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    type={key.toLowerCase().includes("key") || key.toLowerCase().includes("secret") ? "password" : "text"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Șterge
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Anulează</Button>
            <Button onClick={() => onSave(currentForm)} disabled={saving}>
              {saving ? "Se salvează..." : "Salvează"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
