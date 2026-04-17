import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  FileText, Save, TestTube, Loader2, CheckCircle, XCircle,
  RefreshCw, Download, Info, AlertTriangle, Package, BarChart3
} from "lucide-react";

export default function AdminSmartBillSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["smartbill-settings-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smartbill_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["smartbill-stock-sync-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("smartbill_stock_sync_log" as any)
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      return (data as any[]) || [];
    },
  });

  const { data: invoiceLogs = [] } = useQuery({
    queryKey: ["smartbill-invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("smartbill_invoices" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data as any[]) || [];
    },
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (vals: any) => {
      const { id, ...rest } = vals;
      const { error } = await supabase
        .from("smartbill_settings" as any)
        .update({ ...rest, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smartbill-settings-v2"] });
      toast.success("Setări SmartBill salvate!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testConnection = async () => {
    if (!form.email || !form.token || !form.cif) {
      toast.error("Completează email, token și CIF înainte de test");
      return;
    }
    setTesting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/smartbill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection", config: { email: form.email, token: form.token, cif: form.cif } }),
      });
      const data = await res.json();
      if (data.ok) toast.success("Conexiune SmartBill reușită! ✅");
      else toast.error(`Eroare: ${data.error}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setTesting(false);
  };

  const update = (key: string, value: any) => setForm((p: any) => ({ ...p, [key]: value }));

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-6 w-6 text-primary" /> SmartBill
          </h1>
          <p className="text-muted-foreground">Integrare facturare și gestiune stocuri SmartBill</p>
        </div>
        <div className="flex items-center gap-3">
          <Label>Activat</Label>
          <Switch checked={form.enabled || false} onCheckedChange={(v) => update("enabled", v)} />
        </div>
      </div>

      {form.sandbox && (
        <Alert className="border-accent bg-accent/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">Modul Sandbox activ — date de test</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Setări Conectare</TabsTrigger>
          <TabsTrigger value="modules">Setări Module</TabsTrigger>
          <TabsTrigger value="invoices">Facturi ({invoiceLogs.length})</TabsTrigger>
          <TabsTrigger value="stocklog">Log Stocuri ({syncLogs.length})</TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: CONNECTION ═══ */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credențiale API</CardTitle>
              <CardDescription>
                Informații de conectare la contul SmartBill
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email cont SmartBill *</Label>
                  <Input value={form.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="email@firma.ro" />
                </div>
                <div className="space-y-2">
                  <Label>API Token *</Label>
                  <Input type="password" value={form.token || ""} onChange={(e) => update("token", e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cod Fiscal / CUI *</Label>
                <Input value={form.cif || ""} onChange={(e) => update("cif", e.target.value)} placeholder="RO12345678" />
                <p className="text-xs text-muted-foreground">Trebuie să corespundă exact CIF-ului definit în interfața SmartBill</p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Dacă schimbi parola contului SmartBill, tokenul se va schimba automat. Actualizați tokenul după orice schimbare de parolă.
                </AlertDescription>
              </Alert>

              <Separator />

              <div className="flex items-center gap-3">
                <Switch checked={form.sandbox || false} onCheckedChange={(v) => update("sandbox", v)} />
                <Label>Mod Sandbox (test)</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={testConnection} disabled={testing}>
                  {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Testează Conexiunea
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Instrucțiuni Setare</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Email: adresa cu care ești înregistrat în SmartBill</li>
                <li>Token: Contul meu → Integrări → Informații API → Token API</li>
                <li>CIF: trebuie să corespundă CIF-ului definit în interfața SmartBill</li>
                <li>Support API: <span className="font-medium text-foreground">vreauapi@smartbill.ro</span></li>
              </ol>
              <Separator className="my-3" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">URL Callback (setare în SmartBill):</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">https://yourdomain.com/api/smartbill/callback</code>
                <p className="text-xs mt-1">Setare: SmartBill → Contul meu → Integrări → URL notificare</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 2: MODULES ═══ */}
        <TabsContent value="modules" className="space-y-4">
          {/* MODULE 1: INVOICES */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Modul 1: Generează Facturi</CardTitle>
                  <CardDescription>Emite facturi automat din comenzi în SmartBill</CardDescription>
                </div>
                <Switch checked={form.generate_invoices_enabled || false} onCheckedChange={(v) => update("generate_invoices_enabled", v)} />
              </div>
            </CardHeader>
            {form.generate_invoices_enabled && (
              <CardContent className="space-y-5">
                <Alert className="border-accent bg-accent/10">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Atenție: Din 1 august 2025 cotele TVA sunt 21% (Normala) și 11% (Redusa)
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Serie documente *</Label>
                    <Input value={form.invoice_series || ""} onChange={(e) => update("invoice_series", e.target.value)} placeholder="FACT" />
                    <p className="text-xs text-muted-foreground">Trebuie să corespundă unei serii existente în SmartBill (case-sensitive)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Serie proforme</Label>
                    <Input value={form.series_proforma || ""} onChange={(e) => update("series_proforma", e.target.value)} placeholder="PROF" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tip document</Label>
                  <RadioGroup value={form.document_type || "invoice"} onValueChange={(v) => update("document_type", v)} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="invoice" id="dt-inv" /><Label htmlFor="dt-inv">Factură</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="proforma" id="dt-prof" /><Label htmlFor="dt-prof">Factură proformă</Label></div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.auto_generate || false} onCheckedChange={(v) => update("auto_generate", v)} />
                    <Label>Generare automată facturi</Label>
                  </div>
                  {form.auto_generate && (
                    <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                      <Label className="text-sm">Generare la statusul comenzii</Label>
                      <Select value={form.auto_generate_on_status || "confirmed"} onValueChange={(v) => update("auto_generate_on_status", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Comandă confirmată</SelectItem>
                          <SelectItem value="payment_confirmed">Plată confirmată</SelectItem>
                          <SelectItem value="shipped">Comandă expediată</SelectItem>
                          <SelectItem value="delivered">Comandă livrată</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cotă TVA implicită</Label>
                    <Select value={String(form.default_tax_percentage || 19)} onValueChange={(v) => { update("default_tax_percentage", Number(v)); update("default_tax_name", v === "0" ? "Scutit" : v === "5" ? "Redusa2" : v === "9" ? "Redusa" : "Normala"); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="19">Normală — 19% (21% din aug 2025)</SelectItem>
                        <SelectItem value="9">Redusă — 9%</SelectItem>
                        <SelectItem value="5">Redusă — 5%</SelectItem>
                        <SelectItem value="0">Scutit — 0%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monedă</Label>
                    <Select value={form.currency || "RON"} onValueChange={(v) => update("currency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RON">RON</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unitate de măsură implicită</Label>
                    <Select value={form.default_meas_unit || "buc"} onValueChange={(v) => update("default_meas_unit", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["buc", "kg", "set", "l", "m", "ml", "pereche"].map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Câmp referință comandă</Label>
                    <Input value={form.order_reference_template || ""} onChange={(e) => update("order_reference_template", e.target.value)} placeholder="Comanda #{order_id}" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Salvează clientul în SmartBill</Label>
                    <Switch checked={form.save_client_to_db ?? true} onCheckedChange={(v) => update("save_client_to_db", v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Salvează produsele în SmartBill</Label>
                    <Switch checked={form.save_products_to_db || false} onCheckedChange={(v) => update("save_products_to_db", v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Trimite factura pe email clientului</Label>
                    <Switch checked={form.send_email_to_client || false} onCheckedChange={(v) => update("send_email_to_client", v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Include transport ca linie separată</Label>
                    <Switch checked={form.include_shipping ?? true} onCheckedChange={(v) => update("include_shipping", v)} />
                  </div>
                  {form.include_shipping && (
                    <div className="pl-4 border-l-2 border-primary/20">
                      <Label className="text-sm">Nume produs transport</Label>
                      <Input value={form.shipping_product_name || ""} onChange={(e) => update("shipping_product_name", e.target.value)} placeholder="Transport" className="mt-1" />
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* MODULE 2: STOCK SYNC */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Modul 2: Sincronizează Stocuri</CardTitle>
                  <CardDescription>Sincronizare stocuri între SmartBill Gestiune și platformă</CardDescription>
                </div>
                <Switch checked={form.sync_stocks_enabled || false} onCheckedChange={(v) => update("sync_stocks_enabled", v)} />
              </div>
            </CardHeader>
            {form.sync_stocks_enabled && (
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Gestiune SmartBill *</Label>
                  <Input value={form.warehouse_name || ""} onChange={(e) => update("warehouse_name", e.target.value)} placeholder="Gestiune principala" />
                  <p className="text-xs text-muted-foreground">Denumirea exactă din SmartBill → Nomenclatoare → Gestiuni (case-sensitive)</p>
                </div>

                <div className="space-y-2">
                  <Label>Identificator produs SmartBill</Label>
                  <RadioGroup value={form.product_identifier || "code"} onValueChange={(v) => update("product_identifier", v)}>
                    <div className="flex items-center gap-2"><RadioGroupItem value="code" id="pi-code" /><Label htmlFor="pi-code">Cod produs (SKU)</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="ean" id="pi-ean" /><Label htmlFor="pi-ean">EAN (cod de bare)</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="name" id="pi-name" /><Label htmlFor="pi-name">Denumire produs</Label></div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.auto_sync_stocks || false} onCheckedChange={(v) => update("auto_sync_stocks", v)} />
                    <Label>Sincronizare automată stocuri</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Frecvență sincronizare periodică</Label>
                    <Select value={form.sync_frequency || "daily"} onValueChange={(v) => update("sync_frequency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">La fiecare 1 oră</SelectItem>
                        <SelectItem value="6hours">La fiecare 6 ore</SelectItem>
                        <SelectItem value="daily">O dată pe zi</SelectItem>
                        <SelectItem value="manual">Doar manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Produse inexistente în platformă</Label>
                  <RadioGroup value={form.unknown_products_action || "ignore"} onValueChange={(v) => update("unknown_products_action", v)}>
                    <div className="flex items-center gap-2"><RadioGroupItem value="ignore" id="up-ign" /><Label htmlFor="up-ign">Ignoră (skip)</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="create_hidden" id="up-create" /><Label htmlFor="up-create">Adaugă ascuns în catalog</Label></div>
                  </RadioGroup>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* ═══ TAB 3: INVOICES LOG ═══ */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Facturi SmartBill</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dată</TableHead>
                      <TableHead>Nr. Factură</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Eroare</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceLogs.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nicio factură generată</TableCell></TableRow>
                    )}
                    {invoiceLogs.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {inv.generated_at ? format(new Date(inv.generated_at), "dd.MM.yy HH:mm", { locale: ro }) : "—"}
                        </TableCell>
                        <TableCell className="text-sm font-mono">{inv.invoice_series}-{inv.invoice_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {inv.document_type === "proforma" ? "Proformă" : "Factură"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "issued" ? "default" : inv.status === "cancelled" ? "destructive" : "secondary"} className="text-xs">
                            {inv.status === "issued" ? "Emisă" : inv.status === "cancelled" ? "Anulată" : inv.status === "deleted" ? "Ștearsă" : inv.status === "converted" ? "Convertită" : inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">{inv.error_message || "—"}</TableCell>
                        <TableCell>
                          {inv.smartbill_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={inv.smartbill_url} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3" /></a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 4: STOCK SYNC LOG ═══ */}
        <TabsContent value="stocklog">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Log Sincronizare Stocuri</CardTitle>
                <CardDescription>Istoric sincronizări stocuri SmartBill</CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled={!form.sync_stocks_enabled}>
                <RefreshCw className="h-4 w-4 mr-2" /> Sincronizează acum
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Ora</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Procesate</TableHead>
                      <TableHead>Actualizate</TableHead>
                      <TableHead>Negăsite</TableHead>
                      <TableHead>Erori</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nicio sincronizare efectuată</TableCell></TableRow>
                    )}
                    {syncLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.started_at ? format(new Date(log.started_at), "dd.MM.yy HH:mm", { locale: ro }) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.sync_type === "manual" ? "Manual" : log.sync_type === "automatic" ? "Automat" : "Webhook"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.products_processed}</TableCell>
                        <TableCell className="text-sm font-medium text-primary">{log.products_updated}</TableCell>
                        <TableCell className="text-sm">{log.products_not_found}</TableCell>
                        <TableCell className="text-sm text-destructive">{log.errors_count}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === "success" ? "default" : log.status === "partial" ? "secondary" : "destructive"} className="text-xs">
                            {log.status === "success" ? "Succes" : log.status === "partial" ? "Parțial" : "Eșuat"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={() => updateSettings.mutate(form)} disabled={updateSettings.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Se salvează..." : "Salvează setările"}
        </Button>
      </div>
    </div>
  );
}
