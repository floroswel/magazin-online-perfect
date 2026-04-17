import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Building2, Plus, Trash2, GripVertical, AlertCircle, Landmark, Save } from "lucide-react";

interface BankAccount {
  id: string;
  bank_name: string;
  iban: string;
  account_holder: string;
  currency: string;
  branch: string;
  swift_bic: string;
  is_default: boolean;
  show_on_documents: boolean;
  display_order: number;
}

const CURRENCIES = ["RON", "EUR", "USD", "GBP"];

function formatIban(raw: string): string {
  return raw.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
}

function validateIban(iban: string): boolean {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  return /^RO[0-9A-Z]{22}$/.test(clean);
}

export default function AdminBankTransferSettings() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["bank-transfer-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_transfer_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      if (!settings?.id) return [];
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("settings_id", settings.id)
        .order("display_order");
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!settings?.id,
  });

  // Local state
  const [form, setForm] = useState<any>({});
  const [localAccounts, setLocalAccounts] = useState<BankAccount[]>([]);
  const [ibanErrors, setIbanErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  const updateSettings = useMutation({
    mutationFn: async (vals: any) => {
      const { id, ...rest } = vals;
      const { error } = await supabase
        .from("bank_transfer_settings")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank-transfer-settings"] }),
  });

  const saveAccounts = useMutation({
    mutationFn: async (accs: BankAccount[]) => {
      if (!settings?.id) return;
      // Delete removed
      const existingIds = accounts.map((a) => a.id);
      const currentIds = accs.filter((a) => !a.id.startsWith("new-")).map((a) => a.id);
      const toDelete = existingIds.filter((id) => !currentIds.includes(id));
      for (const id of toDelete) {
        await supabase.from("bank_accounts").delete().eq("id", id);
      }
      // Upsert remaining
      for (const acc of accs) {
        const payload = {
          settings_id: settings.id,
          bank_name: acc.bank_name,
          iban: acc.iban.replace(/\s/g, ""),
          account_holder: acc.account_holder,
          currency: acc.currency,
          branch: acc.branch || null,
          swift_bic: acc.swift_bic || null,
          is_default: acc.is_default,
          show_on_documents: acc.show_on_documents,
          display_order: acc.display_order,
          updated_at: new Date().toISOString(),
        };
        if (acc.id.startsWith("new-")) {
          await supabase.from("bank_accounts").insert(payload);
        } else {
          await supabase.from("bank_accounts").update(payload).eq("id", acc.id);
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });

  const handleSave = async () => {
    // Validate IBANs
    const errors: Record<string, string> = {};
    localAccounts.forEach((acc) => {
      if (acc.iban && !validateIban(acc.iban)) {
        errors[acc.id] = "IBAN invalid — trebuie să înceapă cu RO și să aibă 24 caractere";
      }
    });
    if (Object.keys(errors).length > 0) {
      setIbanErrors(errors);
      toast.error("Corectează erorile IBAN înainte de salvare");
      return;
    }
    setIbanErrors({});

    // Check if enabled but no accounts
    if (form.enabled && localAccounts.length === 0) {
      toast.error("Adaugă cel puțin un cont bancar pentru a activa modulul");
      return;
    }

    try {
      await updateSettings.mutateAsync(form);
      await saveAccounts.mutateAsync(localAccounts);
      toast.success("Setările au fost salvate");
    } catch {
      toast.error("Eroare la salvare");
    }
  };

  const addAccount = () => {
    setLocalAccounts((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        bank_name: "",
        iban: "",
        account_holder: form.company_name || "",
        currency: "RON",
        branch: "",
        swift_bic: "",
        is_default: prev.length === 0,
        show_on_documents: true,
        display_order: prev.length,
      },
    ]);
  };

  const updateAccount = (id: string, field: keyof BankAccount, value: any) => {
    setLocalAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== id) {
          if (field === "is_default" && value === true) return { ...a, is_default: false };
          return a;
        }
        return { ...a, [field]: value };
      })
    );
    if (field === "iban") setIbanErrors((e) => { const n = { ...e }; delete n[id]; return n; });
  };

  const removeAccount = (id: string) => {
    setLocalAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const condCountries = form.condition_countries || { mode: "any", values: [] };
  const condGroups = form.condition_customer_groups || { mode: "any", values: [], exclude: [] };
  const condCategories = form.condition_categories || { mode: "any", values: [], exclude: [] };

  if (isLoading) return <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transfer Bancar / Ordin de Plată</h1>
          <p className="text-muted-foreground">Configurare plată prin transfer bancar direct</p>
        </div>
        <div className="flex items-center gap-3">
          <Label>Activat</Label>
          <Switch
            checked={form.enabled || false}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, enabled: v }))}
          />
        </div>
      </div>

      {/* Section 1: Company Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Date Societate</CardTitle>
          <CardDescription>Informații afișate pe documente și pagina de confirmare</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nume societate *</Label>
              <Input
                value={form.company_name || ""}
                onChange={(e) => setForm((p: any) => ({ ...p, company_name: e.target.value }))}
                placeholder="SC MamaLucica SRL"
              />
            </div>
            <div className="space-y-2">
              <Label>Cod Unic de Înregistrare (CUI) *</Label>
              <Input
                value={form.cui || ""}
                onChange={(e) => setForm((p: any) => ({ ...p, cui: e.target.value }))}
                placeholder="RO12345678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Bank Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Conturi Bancare</CardTitle>
          <CardDescription>Adaugă conturile în care clienții pot efectua plata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {localAccounts.length === 0 && (
            <div className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-sm text-destructive">
                Adaugă cel puțin un cont bancar pentru a activa această metodă.
              </span>
            </div>
          )}

          {localAccounts.map((acc, idx) => (
            <div key={acc.id} className="border rounded-lg p-4 space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span className="font-medium text-sm">Cont #{idx + 1}</span>
                  {acc.is_default && <Badge variant="secondary">Implicit</Badge>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeAccount(acc.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Denumire bancă *</Label>
                  <Input value={acc.bank_name} onChange={(e) => updateAccount(acc.id, "bank_name", e.target.value)} placeholder="ING Bank România" />
                </div>
                <div className="space-y-2">
                  <Label>IBAN *</Label>
                  <Input
                    value={formatIban(acc.iban)}
                    onChange={(e) => updateAccount(acc.id, "iban", e.target.value.replace(/\s/g, ""))}
                    placeholder="RO49 AAAA 1B31 0075 9384 0000"
                    className={ibanErrors[acc.id] ? "border-destructive" : ""}
                  />
                  {ibanErrors[acc.id] && <p className="text-xs text-destructive">{ibanErrors[acc.id]}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Titular cont *</Label>
                  <Input value={acc.account_holder} onChange={(e) => updateAccount(acc.id, "account_holder", e.target.value)} placeholder="SC MamaLucica SRL" />
                </div>
                <div className="space-y-2">
                  <Label>Monedă</Label>
                  <Select value={acc.currency} onValueChange={(v) => updateAccount(acc.id, "currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sucursală</Label>
                  <Input value={acc.branch || ""} onChange={(e) => updateAccount(acc.id, "branch", e.target.value)} placeholder="Opțional" />
                </div>
                <div className="space-y-2">
                  <Label>Cod SWIFT/BIC</Label>
                  <Input value={acc.swift_bic || ""} onChange={(e) => updateAccount(acc.id, "swift_bic", e.target.value)} placeholder="INGBROBU" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={acc.is_default} onCheckedChange={(v) => updateAccount(acc.id, "is_default", v)} />
                  <Label className="text-sm">Cont implicit</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={acc.show_on_documents} onCheckedChange={(v) => updateAccount(acc.id, "show_on_documents", v)} />
                  <Label className="text-sm">Afișează pe documente</Label>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addAccount} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Adaugă cont bancar
          </Button>
        </CardContent>
      </Card>

      {/* Section 3: Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferințe Afișare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Denumire afișată în checkout</Label>
            <Input
              value={form.checkout_display_name || ""}
              onChange={(e) => setForm((p: any) => ({ ...p, checkout_display_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Mesaj pentru client după plasarea comenzii</Label>
            <Textarea
              value={form.customer_message || ""}
              onChange={(e) => setForm((p: any) => ({ ...p, customer_message: e.target.value }))}
              placeholder="Vă rugăm să efectuați plata în termen de 3 zile lucrătoare..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Termen de plată</Label>
              <Input
                type="number"
                min={0}
                value={form.payment_term_value ?? 3}
                onChange={(e) => setForm((p: any) => ({ ...p, payment_term_value: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unitate</Label>
              <Select value={form.payment_term_unit || "days"} onValueChange={(v) => setForm((p: any) => ({ ...p, payment_term_unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Zile</SelectItem>
                  <SelectItem value="hours">Ore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={form.auto_cancel_expired || false}
                onCheckedChange={(v) => setForm((p: any) => ({ ...p, auto_cancel_expired: v }))}
              />
              <Label className="text-sm">Anulează automat comenzile expirate</Label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.business_days_only || false}
              onCheckedChange={(v) => setForm((p: any) => ({ ...p, business_days_only: v }))}
            />
            <Label className="text-sm">Calculează termenul doar în zile lucrătoare</Label>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Metode de Livrare</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={form.delivery_restriction || "any"} onValueChange={(v) => setForm((p: any) => ({ ...p, delivery_restriction: v }))}>
            <div className="flex items-center gap-2"><RadioGroupItem value="any" id="del-any" /><Label htmlFor="del-any">Orice metodă de livrare</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="del-specific" /><Label htmlFor="del-specific">Doar anumite metode de livrare</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="none" id="del-none" /><Label htmlFor="del-none">Nicio metodă de livrare</Label></div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Section 5: Display Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Condiții Afișare</CardTitle>
          <CardDescription>Toate condițiile trebuie îndeplinite simultan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Country */}
          <div className="space-y-2">
            <Label className="font-medium">Disponibilitate în funcție de țară</Label>
            <RadioGroup value={condCountries.mode} onValueChange={(v) => setForm((p: any) => ({ ...p, condition_countries: { ...condCountries, mode: v } }))}>
              <div className="flex items-center gap-2"><RadioGroupItem value="any" id="c-any" /><Label htmlFor="c-any">Orice țară</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="c-spec" /><Label htmlFor="c-spec">Doar anumite țări</Label></div>
            </RadioGroup>
          </div>
          <Separator />

          {/* Customer Groups */}
          <div className="space-y-2">
            <Label className="font-medium">Disponibilitate în funcție de grupuri de clienți</Label>
            <RadioGroup value={condGroups.mode} onValueChange={(v) => setForm((p: any) => ({ ...p, condition_customer_groups: { ...condGroups, mode: v } }))}>
              <div className="flex items-center gap-2"><RadioGroupItem value="any" id="g-any" /><Label htmlFor="g-any">Orice grup</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="g-spec" /><Label htmlFor="g-spec">Doar anumite grupuri</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="exclude" id="g-excl" /><Label htmlFor="g-excl">Exclude anumite grupuri</Label></div>
            </RadioGroup>
          </div>
          <Separator />

          {/* Categories */}
          <div className="space-y-2">
            <Label className="font-medium">Disponibilitate în funcție de categorii</Label>
            <RadioGroup value={condCategories.mode} onValueChange={(v) => setForm((p: any) => ({ ...p, condition_categories: { ...condCategories, mode: v } }))}>
              <div className="flex items-center gap-2"><RadioGroupItem value="any" id="cat-any" /><Label htmlFor="cat-any">Orice categorie</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="cat-spec" /><Label htmlFor="cat-spec">Doar anumite categorii</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="exclude" id="cat-excl" /><Label htmlFor="cat-excl">Exclude anumite categorii</Label></div>
            </RadioGroup>
          </div>
          <Separator />

          {/* Order value */}
          <div className="space-y-3">
            <Label className="font-medium">Disponibilitate în funcție de valoarea comenzii</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Valoare minimă (RON)</Label>
                <Input
                  type="number"
                  value={form.min_order_value ?? ""}
                  onChange={(e) => setForm((p: any) => ({ ...p, min_order_value: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="Opțional"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Valoare maximă (RON)</Label>
                <Input
                  type="number"
                  value={form.max_order_value ?? ""}
                  onChange={(e) => setForm((p: any) => ({ ...p, max_order_value: e.target.value ? parseFloat(e.target.value) : null }))}
                  placeholder="Opțional"
                />
              </div>
            </div>
          </div>
          <Separator />

          {/* Customer type limit */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.limit_by_customer_type || false}
                onCheckedChange={(v) => setForm((p: any) => ({ ...p, limit_by_customer_type: v }))}
              />
              <Label>Limită diferențiată per tip de cont</Label>
            </div>
            {form.limit_by_customer_type && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Persoane fizice</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Min" value={form.limit_individual_min ?? ""} onChange={(e) => setForm((p: any) => ({ ...p, limit_individual_min: e.target.value ? parseFloat(e.target.value) : null }))} />
                    <Input type="number" placeholder="Max" value={form.limit_individual_max ?? ""} onChange={(e) => setForm((p: any) => ({ ...p, limit_individual_max: e.target.value ? parseFloat(e.target.value) : null }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Persoane juridice</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Min" value={form.limit_legal_min ?? ""} onChange={(e) => setForm((p: any) => ({ ...p, limit_legal_min: e.target.value ? parseFloat(e.target.value) : null }))} />
                    <Input type="number" placeholder="Max" value={form.limit_legal_max ?? ""} onChange={(e) => setForm((p: any) => ({ ...p, limit_legal_max: e.target.value ? parseFloat(e.target.value) : null }))} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <Separator />

          {/* IP restriction */}
          <div className="space-y-2">
            <Label>Restricție IP (opțional)</Label>
            <Input
              value={form.allowed_ips || ""}
              onChange={(e) => setForm((p: any) => ({ ...p, allowed_ips: e.target.value }))}
              placeholder="192.168.1.1, 10.0.0.1"
            />
            <p className="text-xs text-muted-foreground">Doar aceste IP-uri vor vedea metoda de plată. Lăsați gol pentru toți.</p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending || saveAccounts.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Se salvează..." : "Salvează setările"}
        </Button>
      </div>
    </div>
  );
}
