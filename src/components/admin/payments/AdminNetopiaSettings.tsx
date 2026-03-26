import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CreditCard, Upload, CheckCircle, AlertTriangle, Save, Shield, FileKey, Info } from "lucide-react";

export default function AdminNetopiaSettings() {
  const qc = useQueryClient();
  const cerInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["netopia-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("netopia_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<any>({});
  const [uploadingCer, setUploadingCer] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (vals: any) => {
      const { id, ...rest } = vals;
      const { error } = await supabase
        .from("netopia_settings")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["netopia-settings"] });
      toast.success("Setările au fost salvate");
    },
    onError: () => toast.error("Eroare la salvare"),
  });

  const handleFileUpload = async (file: File, type: "cer" | "key") => {
    if (!settings?.id) return;
    const setter = type === "cer" ? setUploadingCer : setUploadingKey;
    setter(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (type === "cer" && !["cer", "pem"].includes(ext || "")) {
        toast.error("Fișierul trebuie să fie .cer sau .pem");
        return;
      }
      if (type === "key" && !["key", "pem"].includes(ext || "")) {
        toast.error("Fișierul trebuie să fie .key sau .pem");
        return;
      }

      const storagePath = `${settings.id}/${crypto.randomUUID()}.${ext}`;

      // Delete old file if exists
      const oldPath = type === "cer" ? form.netopia_cert_path : form.merchant_key_path;
      if (oldPath) {
        await supabase.storage.from("netopia-certificates").remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from("netopia-certificates")
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const now = new Date().toISOString();
      const updatePayload = type === "cer"
        ? { netopia_cert_path: storagePath, netopia_cert_filename: file.name, netopia_cert_uploaded_at: now }
        : { merchant_key_path: storagePath, merchant_key_filename: file.name, merchant_key_uploaded_at: now };

      const { error } = await supabase
        .from("netopia_settings")
        .update({ ...updatePayload, updated_at: now })
        .eq("id", settings.id);
      if (error) throw error;

      setForm((p: any) => ({ ...p, ...updatePayload }));
      qc.invalidateQueries({ queryKey: ["netopia-settings"] });
      toast.success(`Certificat ${type === "cer" ? ".cer" : ".key"} încărcat cu succes`);
    } catch (err: any) {
      toast.error(`Eroare la încărcare: ${err.message}`);
    } finally {
      setter(false);
    }
  };

  const handleSave = () => {
    if (form.enabled) {
      if (!form.merchant_signature?.trim()) {
        toast.error("Signature-ul comerciantului este obligatoriu");
        return;
      }
      if (!form.netopia_cert_path) {
        toast.error("Certificatul digital NETOPIA (.cer) este obligatoriu");
        return;
      }
      if (!form.merchant_key_path) {
        toast.error("Certificatul comerciantului (.key) este obligatoriu");
        return;
      }
    }
    updateSettings.mutate(form);
  };

  const condCountries = form.condition_countries || { mode: "any", values: [] };
  const condGroups = form.condition_customer_groups || { mode: "any", values: [], exclude: [] };
  const condCategories = form.condition_categories || { mode: "any", values: [], exclude: [] };

  if (isLoading) return <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  const hasCer = !!form.netopia_cert_path;
  const hasKey = !!form.merchant_key_path;
  const hasSignature = !!form.merchant_signature?.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6" /> NETOPIA Payments
          </h1>
          <p className="text-muted-foreground">Procesare plăți cu cardul prin NETOPIA (MobilPay)</p>
        </div>
        <div className="flex items-center gap-3">
          <Label>Activat</Label>
          <Switch
            checked={form.enabled || false}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, enabled: v }))}
          />
        </div>
      </div>

      {form.demo_mode && (
        <Alert className="border-accent bg-accent/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Modul Demo activ — plăți de test (sandbox.mobilpay.ro)
          </AlertDescription>
        </Alert>
      )}

      {form.enabled && (!hasSignature || !hasCer || !hasKey) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Completează toate câmpurile obligatorii (Signature + ambele certificate) pentru a activa modulul.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Setări Conectare</TabsTrigger>
          <TabsTrigger value="display">Preferințe Afișare</TabsTrigger>
          <TabsTrigger value="conditions">Condiții Afișare</TabsTrigger>
        </TabsList>

        {/* TAB 1: Connection */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Credențiale NETOPIA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Identificator cont comerciant / Signature *</Label>
                <Input
                  value={form.merchant_signature || ""}
                  onChange={(e) => setForm((p: any) => ({ ...p, merchant_signature: e.target.value }))}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                />
                <p className="text-xs text-muted-foreground">
                  Găsești în NETOPIA Admin → Conturi de comerciant → Editare → Setări securitate
                </p>
              </div>

              <Separator />

              {/* .cer upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileKey className="h-4 w-4" /> Certificat digital NETOPIA Payments (.cer) *
                </Label>
                {hasCer ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{form.netopia_cert_filename}</p>
                      <p className="text-xs text-muted-foreground">
                        Încărcat pe {form.netopia_cert_uploaded_at ? new Date(form.netopia_cert_uploaded_at).toLocaleDateString("ro-RO") : "—"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => cerInputRef.current?.click()} disabled={uploadingCer}>
                      {uploadingCer ? "Se încarcă..." : "Înlocuiește"}
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => cerInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadingCer ? "Se încarcă..." : "Click pentru a încărca fișierul .cer"}
                    </p>
                  </div>
                )}
                <input
                  ref={cerInputRef}
                  type="file"
                  accept=".cer,.pem"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "cer");
                    e.target.value = "";
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Descarcă din NETOPIA Admin → Setări securitate → Certificat digital NETOPIA Payments
                </p>
              </div>

              <Separator />

              {/* .key upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileKey className="h-4 w-4" /> Certificat cont comerciant (.key) *
                </Label>
                {hasKey ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{form.merchant_key_filename}</p>
                      <p className="text-xs text-muted-foreground">
                        Încărcat pe {form.merchant_key_uploaded_at ? new Date(form.merchant_key_uploaded_at).toLocaleDateString("ro-RO") : "—"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => keyInputRef.current?.click()} disabled={uploadingKey}>
                      {uploadingKey ? "Se încarcă..." : "Înlocuiește"}
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => keyInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadingKey ? "Se încarcă..." : "Click pentru a încărca fișierul .key"}
                    </p>
                  </div>
                )}
                <input
                  ref={keyInputRef}
                  type="file"
                  accept=".key,.pem"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, "key");
                    e.target.value = "";
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Descarcă din NETOPIA Admin → Setări securitate → Certificat cont comerciant
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monedă procesare tranzacție</Label>
                  <Select value={form.currency || "order_currency"} onValueChange={(v) => setForm((p: any) => ({ ...p, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_currency">Moneda comenzii (dinamic)</SelectItem>
                      <SelectItem value="RON">RON</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={form.demo_mode || false}
                    onCheckedChange={(v) => setForm((p: any) => ({ ...p, demo_mode: v }))}
                  />
                  <Label>Activează modul Demo (sandbox)</Label>
                </div>
              </div>

              {form.demo_mode && (
                <div className="p-3 rounded-lg border bg-muted/30 text-sm space-y-1">
                  <p className="font-medium">Date card de test:</p>
                  <p className="text-muted-foreground">Card: 9900009184214768 | Exp: orice dată viitoare | CVV: 111</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Instrucțiuni Setare</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Creați cont pe admin.netopia-payments.com</li>
                <li>Mergeți la Admin → Conturi de comerciant</li>
                <li>Apăsați pictograma Editare din dreptul contului</li>
                <li>Accesați secțiunea Setări securitate</li>
                <li>Copiați Identificatorul cont comerciant (Signature)</li>
                <li>Descărcați Certificat digital NETOPIA Payments (.cer)</li>
                <li>Descărcați Certificat cont comerciant (.key)</li>
                <li>După integrare, trimiteți email la <span className="font-medium text-foreground">implementare@netopia.ro</span> pentru validare și activare POS</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Display */}
        <TabsContent value="display" className="space-y-4">
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
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.show_footer_icon ?? true}
                  onCheckedChange={(v) => setForm((p: any) => ({ ...p, show_footer_icon: v }))}
                />
                <Label>Afișează pictogramă în zona de footer</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metode de Livrare</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={form.delivery_restriction || "any"} onValueChange={(v) => setForm((p: any) => ({ ...p, delivery_restriction: v }))}>
                <div className="flex items-center gap-2"><RadioGroupItem value="any" id="nd-any" /><Label htmlFor="nd-any">Orice metodă de livrare</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="nd-spec" /><Label htmlFor="nd-spec">Doar anumite metode de livrare</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="none" id="nd-none" /><Label htmlFor="nd-none">Nicio metodă de livrare</Label></div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Conditions */}
        <TabsContent value="conditions" className="space-y-4">
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
                  <div className="flex items-center gap-2"><RadioGroupItem value="any" id="nc-any" /><Label htmlFor="nc-any">Orice țară</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="nc-spec" /><Label htmlFor="nc-spec">Doar anumite țări</Label></div>
                </RadioGroup>
              </div>
              <Separator />

              {/* Customer Groups */}
              <div className="space-y-2">
                <Label className="font-medium">Disponibilitate în funcție de grupuri de clienți</Label>
                <RadioGroup value={condGroups.mode} onValueChange={(v) => setForm((p: any) => ({ ...p, condition_customer_groups: { ...condGroups, mode: v } }))}>
                  <div className="flex items-center gap-2"><RadioGroupItem value="any" id="ng-any" /><Label htmlFor="ng-any">Orice grup</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="ng-spec" /><Label htmlFor="ng-spec">Doar anumite grupuri</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="exclude" id="ng-excl" /><Label htmlFor="ng-excl">Exclude anumite grupuri</Label></div>
                </RadioGroup>
              </div>
              <Separator />

              {/* Categories */}
              <div className="space-y-2">
                <Label className="font-medium">Disponibilitate în funcție de categorii</Label>
                <RadioGroup value={condCategories.mode} onValueChange={(v) => setForm((p: any) => ({ ...p, condition_categories: { ...condCategories, mode: v } }))}>
                  <div className="flex items-center gap-2"><RadioGroupItem value="any" id="ncat-any" /><Label htmlFor="ncat-any">Orice categorie</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="ncat-spec" /><Label htmlFor="ncat-spec">Doar anumite categorii</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="exclude" id="ncat-excl" /><Label htmlFor="ncat-excl">Exclude anumite categorii</Label></div>
                </RadioGroup>
              </div>
              <Separator />

              {/* Order value */}
              <div className="space-y-3">
                <Label className="font-medium">Disponibilitate în funcție de valoarea comenzii</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Valoare minimă (RON)</Label>
                    <Input type="number" value={form.min_order_value ?? ""} onChange={(e) => setForm((p: any) => ({ ...p, min_order_value: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Opțional" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Valoare maximă (RON)</Label>
                    <Input type="number" value={form.max_order_value ?? ""} onChange={(e) => setForm((p: any) => ({ ...p, max_order_value: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Opțional" />
                  </div>
                </div>
              </div>
              <Separator />

              {/* Customer type limit */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.limit_by_customer_type || false} onCheckedChange={(v) => setForm((p: any) => ({ ...p, limit_by_customer_type: v }))} />
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
                <Input value={form.allowed_ips || ""} onChange={(e) => setForm((p: any) => ({ ...p, allowed_ips: e.target.value }))} placeholder="192.168.1.1, 10.0.0.1" />
                <p className="text-xs text-muted-foreground">Doar aceste IP-uri vor vedea metoda de plată. Lăsați gol pentru toți.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Se salvează..." : "Salvează setările"}
        </Button>
      </div>
    </div>
  );
}
