import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, TestTube, Loader2, CheckCircle, XCircle, RefreshCw, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface SmartBillConfig {
  email: string;
  token: string;
  cif: string;
  warehouse: string;
  series_invoice: string;
  series_proforma: string;
  sandbox: boolean;
  auto_emit: boolean;
  trigger_status: string;
  auto_proforma_b2b: boolean;
  include_shipping: boolean;
  shipping_product_name: string;
  default_meas_unit: string;
  default_vat_rate: number;
}

const DEFAULTS: SmartBillConfig = {
  email: "", token: "", cif: "", warehouse: "Depozit",
  series_invoice: "FACT", series_proforma: "PROF",
  sandbox: false, auto_emit: false, trigger_status: "processing",
  auto_proforma_b2b: false, include_shipping: true,
  shipping_product_name: "Transport", default_meas_unit: "buc",
  default_vat_rate: 19,
};

export default function AdminSmartBillSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<SmartBillConfig>(DEFAULTS);
  const [testing, setTesting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["smartbill-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "smartbill_settings")
        .maybeSingle();
      return data?.value_json as unknown as SmartBillConfig | null;
    },
  });

  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["smartbill-sync-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("smartbill_sync_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data as any[]) || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["smartbill-product-mapping"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, smartbill_code, smartbill_meas_unit, smartbill_vat_rate")
        .order("name")
        .limit(200);
      return (data as any[]) || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "smartbill_settings", value_json: form as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smartbill-settings"] });
      toast.success("Setări SmartBill salvate!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testConnection = async () => {
    setTesting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/smartbill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection", config: form }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Conexiune SmartBill reușită! ✅");
      } else {
        toast.error(`Eroare: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setTesting(false);
  };

  const retrySync = async (logId: string, orderId: string) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/smartbill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_invoice", order_id: orderId }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Factură ${data.number} emisă!`);
        qc.invalidateQueries({ queryKey: ["smartbill-sync-logs"] });
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateProductMapping = async (productId: string, field: string, value: string | number) => {
    await supabase.from("products").update({ [field]: value } as any).eq("id", productId);
    qc.invalidateQueries({ queryKey: ["smartbill-product-mapping"] });
    toast.success("Produs actualizat");
  };

  const update = (key: keyof SmartBillConfig, value: any) => setForm(f => ({ ...f, [key]: value }));

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> SmartBill
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Integrare facturare automată cu SmartBill.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={testConnection} disabled={testing}>
            {testing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <TestTube className="w-3.5 h-3.5 mr-1" />}
            Test conexiune
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Salvează
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Configurare</TabsTrigger>
          <TabsTrigger value="mapping">Mapare produse</TabsTrigger>
          <TabsTrigger value="log">Jurnal ({syncLogs.length})</TabsTrigger>
        </TabsList>

        {/* ═══ CONFIG ═══ */}
        <TabsContent value="config" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Credențiale API</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Email cont SmartBill</Label>
                  <Input value={form.email} onChange={e => update("email", e.target.value)} placeholder="email@firma.ro" />
                </div>
                <div>
                  <Label className="text-xs">API Token</Label>
                  <Input type="password" value={form.token} onChange={e => update("token", e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <Label className="text-xs">CIF companie</Label>
                  <Input value={form.cif} onChange={e => update("cif", e.target.value)} placeholder="RO12345678" />
                </div>
                <div>
                  <Label className="text-xs">Denumire depozit</Label>
                  <Input value={form.warehouse} onChange={e => update("warehouse", e.target.value)} placeholder="Depozit" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Mod sandbox (test)</Label>
                  <Switch checked={form.sandbox} onCheckedChange={v => update("sandbox", v)} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Serie documente</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Serie facturi</Label>
                      <Input value={form.series_invoice} onChange={e => update("series_invoice", e.target.value)} placeholder="FACT" />
                    </div>
                    <div>
                      <Label className="text-xs">Serie proforme</Label>
                      <Input value={form.series_proforma} onChange={e => update("series_proforma", e.target.value)} placeholder="PROF" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Unitate de măsură implicită</Label>
                      <Select value={form.default_meas_unit} onValueChange={v => update("default_meas_unit", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["buc", "kg", "set", "l", "m", "ml", "pereche"].map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">TVA implicit (%)</Label>
                      <Select value={String(form.default_vat_rate)} onValueChange={v => update("default_vat_rate", Number(v))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="19">19%</SelectItem>
                          <SelectItem value="9">9%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="0">0% (SDD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Automatizare</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Emite factură automat</Label>
                    <Switch checked={form.auto_emit} onCheckedChange={v => update("auto_emit", v)} />
                  </div>
                  {form.auto_emit && (
                    <div>
                      <Label className="text-xs">La statusul comenzii</Label>
                      <Select value={form.trigger_status} onValueChange={v => update("trigger_status", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="processing">Confirmată (Processing)</SelectItem>
                          <SelectItem value="shipped">Expediată (Shipped)</SelectItem>
                          <SelectItem value="delivered">Livrată (Delivered)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Proformă automată B2B</Label>
                    <Switch checked={form.auto_proforma_b2b} onCheckedChange={v => update("auto_proforma_b2b", v)} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Include transport ca linie separată</Label>
                    <Switch checked={form.include_shipping} onCheckedChange={v => update("include_shipping", v)} />
                  </div>
                  {form.include_shipping && (
                    <div>
                      <Label className="text-xs">Nume produs transport</Label>
                      <Input value={form.shipping_product_name} onChange={e => update("shipping_product_name", e.target.value)} placeholder="Transport" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ═══ PRODUCT MAPPING ═══ */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Mapare produse SmartBill</CardTitle>
              <p className="text-xs text-muted-foreground">Setează cod produs, unitate de măsură și cota TVA pentru fiecare produs.</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produs</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Cod SmartBill</TableHead>
                      <TableHead>UM</TableHead>
                      <TableHead>TVA %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium max-w-[200px] truncate">{p.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{p.sku || "—"}</TableCell>
                        <TableCell>
                          <Input
                            className="h-7 text-xs w-28"
                            defaultValue={p.smartbill_code || ""}
                            onBlur={e => {
                              if (e.target.value !== (p.smartbill_code || "")) {
                                updateProductMapping(p.id, "smartbill_code", e.target.value);
                              }
                            }}
                            placeholder="—"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={p.smartbill_meas_unit || "buc"}
                            onValueChange={v => updateProductMapping(p.id, "smartbill_meas_unit", v)}
                          >
                            <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["buc", "kg", "set", "l", "m", "ml"].map(u => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={String(p.smartbill_vat_rate || 19)}
                            onValueChange={v => updateProductMapping(p.id, "smartbill_vat_rate", Number(v))}
                          >
                            <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="19">19%</SelectItem>
                              <SelectItem value="9">9%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="0">0%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SYNC LOG ═══ */}
        <TabsContent value="log">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Jurnal sincronizare SmartBill</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dată</TableHead>
                      <TableHead>Comandă</TableHead>
                      <TableHead>Acțiune</TableHead>
                      <TableHead>Nr. Factură</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Eroare</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "dd.MM.yy HH:mm", { locale: ro })}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.order_id?.slice(0, 8) || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {log.action === "create_invoice" ? "Factură" :
                             log.action === "create_proforma" ? "Proformă" :
                             log.action === "create_storno" ? "Storno" : log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono font-medium">{log.smartbill_number || "—"}</TableCell>
                        <TableCell>
                          {log.status === "success" && <Badge className="text-[10px] bg-green-500/15 text-green-600 border-green-500/30" variant="outline"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>}
                          {log.status === "error" && <Badge variant="destructive" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />Eroare</Badge>}
                          {log.status === "pending" && <Badge variant="outline" className="text-[10px]"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Pending</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">{log.error_message || ""}</TableCell>
                        <TableCell>
                          {log.status === "error" && log.order_id && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => retrySync(log.id, log.order_id)}>
                              <RefreshCw className="w-3 h-3 mr-1" /> Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {syncLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                          Nicio operație de sincronizare înregistrată.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
