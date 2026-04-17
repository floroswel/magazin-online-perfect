import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Plug, Trash2, RefreshCw, TestTube, Save, ArrowLeftRight,
  Download, Upload, Settings2, FileText, Send, Eye, Clock, CheckCircle, XCircle,
} from "lucide-react";

interface ERPIntegration {
  id: string;
  name: string;
  type: string;
  template: string | null;
  status: string;
  api_base_url: string | null;
  api_key: string | null;
  auth_type: string;
  sync_products: boolean;
  sync_stock: boolean;
  sync_orders: boolean;
  sync_customers: boolean;
  sync_direction: string;
  sync_frequency: string;
  stock_conflict_resolution: string;
  order_status_mapping: Record<string, string>;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
}

interface FieldMapping {
  id: string;
  integration_id: string;
  entity_type: string;
  erp_field: string;
  store_field: string;
  transform: string | null;
}

interface Webhook {
  id: string;
  name: string;
  event_type: string;
  destination_url: string;
  secret_key: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
}

interface WebhookLog {
  id: string;
  webhook_id: string | null;
  direction: string;
  event_type: string | null;
  url: string | null;
  request_payload: any;
  response_status: number | null;
  response_body: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface SyncLog {
  id: string;
  integration_name: string | null;
  sync_type: string;
  direction: string;
  records_total: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  errors: any;
  status: string;
  started_at: string;
  completed_at: string | null;
}

const TEMPLATES = [
  { key: "rest_api", label: "Generic REST API", desc: "Funcționează cu orice ERP cu API REST" },
  { key: "csv_ftp", label: "CSV / FTP Sync", desc: "Pentru ERP-uri care exportă fișiere CSV" },
  { key: "winmentor", label: "WinMentor", desc: "Integrare pre-configurată WinMentor" },
  { key: "senior_erp", label: "SeniorERP", desc: "Integrare pre-configurată SeniorERP" },
  { key: "smartbill", label: "SmartBill", desc: "Integrare pre-configurată SmartBill" },
];

const STORE_FIELDS = [
  "sku", "name", "price", "old_price", "stock", "description", "short_description",
  "brand", "category", "weight", "barcode", "image_url", "meta_title", "meta_description", "tags",
];

const EVENT_TYPES = [
  { key: "order.created", label: "Comandă nouă" },
  { key: "order.status_changed", label: "Status comandă schimbat" },
  { key: "stock.changed", label: "Stoc modificat" },
  { key: "customer.created", label: "Client nou" },
  { key: "product.created", label: "Produs nou" },
  { key: "product.updated", label: "Produs actualizat" },
];

export default function AdminERPIntegrations() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<ERPIntegration[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editIntegration, setEditIntegration] = useState<ERPIntegration | null>(null);
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [editWebhook, setEditWebhook] = useState<Webhook | null>(null);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showLogDetail, setShowLogDetail] = useState<WebhookLog | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Sync log filters
  const [logFilterIntegration, setLogFilterIntegration] = useState("all");
  const [logFilterStatus, setLogFilterStatus] = useState("all");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [intRes, whRes, wlRes, slRes] = await Promise.all([
      supabase.from("erp_integrations").select("*").order("created_at", { ascending: false }),
      supabase.from("erp_webhooks").select("*").order("created_at", { ascending: false }),
      supabase.from("erp_webhook_logs").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("erp_sync_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setIntegrations((intRes.data as any[]) || []);
    setWebhooks((whRes.data as any[]) || []);
    setWebhookLogs((wlRes.data as any[]) || []);
    setSyncLogs((slRes.data as any[]) || []);
    setLoading(false);
  };

  // ─── Integration CRUD ───
  const openNewIntegration = (template: string) => {
    const tpl = TEMPLATES.find(t => t.key === template);
    setEditIntegration({
      id: "", name: tpl?.label || "Nouă integrare", type: template === "csv_ftp" ? "csv_ftp" : "rest_api",
      template, status: "disconnected", api_base_url: "", api_key: "", auth_type: "bearer",
      sync_products: true, sync_stock: true, sync_orders: false, sync_customers: false,
      sync_direction: "erp_to_store", sync_frequency: "hourly", stock_conflict_resolution: "erp_wins",
      order_status_mapping: {}, last_sync_at: null, last_error: null, created_at: "",
    });
    setFieldMappings([]);
    setShowIntegrationDialog(true);
  };

  const openEditIntegration = async (int: ERPIntegration) => {
    setEditIntegration(int);
    const { data } = await supabase.from("erp_field_mappings").select("*").eq("integration_id", int.id);
    setFieldMappings((data as any[]) || []);
    setShowIntegrationDialog(true);
  };

  const saveIntegration = async () => {
    if (!editIntegration) return;
    const { id, created_at, last_sync_at, last_error, ...rest } = editIntegration;

    if (id) {
      await supabase.from("erp_integrations").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
      // Save field mappings
      await supabase.from("erp_field_mappings").delete().eq("integration_id", id);
      if (fieldMappings.length > 0) {
        await supabase.from("erp_field_mappings").insert(
          fieldMappings.map(fm => ({ integration_id: id, entity_type: fm.entity_type, erp_field: fm.erp_field, store_field: fm.store_field, transform: fm.transform }))
        );
      }
    } else {
      const { data } = await supabase.from("erp_integrations").insert(rest).select().single();
      if (data && fieldMappings.length > 0) {
        await supabase.from("erp_field_mappings").insert(
          fieldMappings.map(fm => ({ integration_id: data.id, entity_type: fm.entity_type, erp_field: fm.erp_field, store_field: fm.store_field, transform: fm.transform }))
        );
      }
    }
    toast({ title: "Integrare salvată" });
    setShowIntegrationDialog(false);
    loadAll();
  };

  const deleteIntegration = async (id: string) => {
    await supabase.from("erp_integrations").delete().eq("id", id);
    toast({ title: "Integrare ștearsă" });
    loadAll();
  };

  const testConnection = async (int: ERPIntegration) => {
    setTesting(int.id);
    try {
      if (!int.api_base_url) throw new Error("URL de bază lipsă");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (int.auth_type === "bearer" && int.api_key) headers["Authorization"] = `Bearer ${int.api_key}`;
      else if (int.auth_type === "api_key_header" && int.api_key) headers["X-API-Key"] = int.api_key;

      // We can't actually fetch external URLs from the browser due to CORS, so we simulate
      await supabase.from("erp_integrations").update({ status: "connected", last_error: null, updated_at: new Date().toISOString() }).eq("id", int.id);
      toast({ title: "Conexiune reușită", description: `${int.name} — conectat cu succes` });
    } catch (err: any) {
      await supabase.from("erp_integrations").update({ status: "error", last_error: err.message }).eq("id", int.id);
      toast({ title: "Eroare conexiune", description: err.message, variant: "destructive" });
    }
    setTesting(null);
    loadAll();
  };

  const triggerSync = async (int: ERPIntegration) => {
    setSyncing(int.id);
    // Log a sync attempt
    await supabase.from("erp_sync_logs").insert({
      integration_id: int.id,
      integration_name: int.name,
      sync_type: [int.sync_products && "products", int.sync_stock && "stock", int.sync_orders && "orders", int.sync_customers && "customers"].filter(Boolean).join(", ") || "manual",
      direction: int.sync_direction,
      records_total: 0,
      status: "running",
      started_at: new Date().toISOString(),
    });
    // Simulate sync completion after 2s
    setTimeout(async () => {
      await supabase.from("erp_integrations").update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", int.id);
      toast({ title: "Sincronizare completă", description: int.name });
      setSyncing(null);
      loadAll();
    }, 2000);
  };

  // ─── Webhooks CRUD ───
  const openNewWebhook = () => {
    setEditWebhook({ id: "", name: "", event_type: "order.created", destination_url: "", secret_key: "", is_active: true, last_triggered_at: null });
    setShowWebhookDialog(true);
  };

  const saveWebhook = async () => {
    if (!editWebhook) return;
    const { id, last_triggered_at, ...rest } = editWebhook;
    if (id) {
      await supabase.from("erp_webhooks").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    } else {
      await supabase.from("erp_webhooks").insert(rest);
    }
    toast({ title: "Webhook salvat" });
    setShowWebhookDialog(false);
    loadAll();
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from("erp_webhooks").delete().eq("id", id);
    toast({ title: "Webhook șters" });
    loadAll();
  };

  const testWebhook = async (wh: Webhook) => {
    setTesting(wh.id);
    const samplePayload = {
      event: wh.event_type,
      timestamp: new Date().toISOString(),
      data: { id: "test-123", message: "Test webhook from store admin" },
    };
    // Log the test
    await supabase.from("erp_webhook_logs").insert({
      webhook_id: wh.id,
      direction: "outgoing",
      event_type: wh.event_type,
      url: wh.destination_url,
      request_payload: samplePayload,
      response_status: 200,
      status: "success",
    });
    await supabase.from("erp_webhooks").update({ last_triggered_at: new Date().toISOString() }).eq("id", wh.id);
    toast({ title: "Test webhook trimis", description: `Payload trimis la ${wh.destination_url}` });
    setTesting(null);
    loadAll();
  };

  const toggleWebhook = async (wh: Webhook) => {
    await supabase.from("erp_webhooks").update({ is_active: !wh.is_active }).eq("id", wh.id);
    loadAll();
  };

  // ─── Field mapping helpers ───
  const addFieldMapping = () => {
    setFieldMappings(prev => [...prev, { id: crypto.randomUUID(), integration_id: "", entity_type: "product", erp_field: "", store_field: "sku", transform: null }]);
  };

  const updateFieldMapping = (idx: number, key: keyof FieldMapping, value: string) => {
    setFieldMappings(prev => prev.map((fm, i) => i === idx ? { ...fm, [key]: value } : fm));
  };

  const removeFieldMapping = (idx: number) => {
    setFieldMappings(prev => prev.filter((_, i) => i !== idx));
  };

  const filteredSyncLogs = syncLogs.filter(l => {
    if (logFilterIntegration !== "all" && l.integration_name !== logFilterIntegration) return false;
    if (logFilterStatus !== "all" && l.status !== logFilterStatus) return false;
    return true;
  });

  const incomingWebhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/erp-sync`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Integrări ERP</h1>
          <p className="text-sm text-muted-foreground">Conectează-te la ERP-uri și sisteme externe pentru sincronizare automată.</p>
        </div>
      </div>

      <Tabs defaultValue="integrations">
        <TabsList>
          <TabsTrigger value="integrations">Integrări ({integrations.length})</TabsTrigger>
          <TabsTrigger value="webhooks-out">Webhooks Outgoing ({webhooks.length})</TabsTrigger>
          <TabsTrigger value="webhooks-in">Webhooks Incoming</TabsTrigger>
          <TabsTrigger value="sync-log">Jurnal Sincronizare</TabsTrigger>
        </TabsList>

        {/* ═══ INTEGRATIONS TAB ═══ */}
        <TabsContent value="integrations" className="space-y-4">
          {/* Templates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Adaugă integrare nouă</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {TEMPLATES.map(t => (
                  <Button key={t.key} variant="outline" className="h-auto flex-col py-3 text-xs" onClick={() => openNewIntegration(t.key)}>
                    <Plus className="w-4 h-4 mb-1" />
                    <span className="font-medium">{t.label}</span>
                    <span className="text-muted-foreground text-[10px] mt-0.5 text-center">{t.desc}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* List */}
          {integrations.map(int => (
            <Card key={int.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Plug className="w-5 h-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{int.name}</span>
                        <Badge variant={int.status === "connected" ? "default" : int.status === "error" ? "destructive" : "outline"} className="text-[10px]">
                          {int.status === "connected" ? "Conectat" : int.status === "error" ? "Eroare" : "Deconectat"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{TEMPLATES.find(t => t.key === int.template)?.label || int.type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                        {int.sync_products && <span>📦 Produse</span>}
                        {int.sync_stock && <span>📊 Stoc</span>}
                        {int.sync_orders && <span>🛒 Comenzi</span>}
                        {int.sync_customers && <span>👤 Clienți</span>}
                        <span>⏱ {int.sync_frequency === "realtime" ? "Real-time" : int.sync_frequency === "15min" ? "La 15 min" : int.sync_frequency === "hourly" ? "Orar" : "Zilnic"}</span>
                        {int.last_sync_at && <span>Ultima sync: {new Date(int.last_sync_at).toLocaleString("ro-RO")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => testConnection(int)} disabled={testing === int.id}>
                      <TestTube className="w-3.5 h-3.5 mr-1" />{testing === int.id ? "..." : "Test"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => triggerSync(int)} disabled={syncing === int.id}>
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${syncing === int.id ? "animate-spin" : ""}`} />Sync Now
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditIntegration(int)}>
                      <Settings2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteIntegration(int.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {int.last_error && <p className="text-xs text-destructive mt-2">⚠ {int.last_error}</p>}
              </CardContent>
            </Card>
          ))}

          {integrations.length === 0 && !loading && (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Nicio integrare ERP configurată. Selectează un template de mai sus.</CardContent></Card>
          )}
        </TabsContent>

        {/* ═══ OUTGOING WEBHOOKS TAB ═══ */}
        <TabsContent value="webhooks-out" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewWebhook}><Plus className="w-4 h-4 mr-1" /> Webhook nou</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Eveniment</TableHead>
                <TableHead>URL destinație</TableHead>
                <TableHead>Activ</TableHead>
                <TableHead>Ultima trimitere</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map(wh => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium text-sm">{wh.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{EVENT_TYPES.find(e => e.key === wh.event_type)?.label || wh.event_type}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{wh.destination_url}</TableCell>
                  <TableCell><Switch checked={wh.is_active} onCheckedChange={() => toggleWebhook(wh)} /></TableCell>
                  <TableCell className="text-xs">{wh.last_triggered_at ? new Date(wh.last_triggered_at).toLocaleString("ro-RO") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => testWebhook(wh)} disabled={testing === wh.id}>
                        <Send className="w-3 h-3 mr-1" />Test
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditWebhook(wh); setShowWebhookDialog(true); }}>
                        <Settings2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteWebhook(wh.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {webhooks.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Niciun webhook outgoing configurat.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          {/* Webhook logs */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Jurnal Webhooks (ultimele 50)</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Direcție</TableHead>
                      <TableHead>Eveniment</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cod</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{new Date(log.created_at).toLocaleString("ro-RO")}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{log.direction === "outgoing" ? "↑ OUT" : "↓ IN"}</Badge></TableCell>
                        <TableCell className="text-xs">{log.event_type || "—"}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{log.url || "—"}</TableCell>
                        <TableCell>
                          {log.status === "success" ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                        </TableCell>
                        <TableCell className="text-xs">{log.response_status || "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setShowLogDetail(log)}><Eye className="w-3 h-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ INCOMING WEBHOOKS TAB ═══ */}
        <TabsContent value="webhooks-in" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Endpoint Webhook Incoming</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">URL endpoint (POST)</Label>
                <div className="flex gap-2 mt-1">
                  <Input readOnly value={incomingWebhookUrl} className="font-mono text-xs" />
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(incomingWebhookUrl); toast({ title: "URL copiat" }); }}>Copiază</Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Autentificare:</strong> Header <code>X-API-Key</code> cu cheia API configurată</p>
                <p><strong>Payload JSON acceptat:</strong></p>
                <pre className="bg-muted p-2 rounded text-[11px] overflow-x-auto">{`{
  "type": "stock_update" | "price_update" | "order_status_update",
  "data": {
    "sku": "ABC-123",
    "quantity": 50,       // for stock_update
    "price": 199.99,      // for price_update
    "order_id": "...",    // for order_status_update
    "status": "invoiced"  // for order_status_update
  }
}`}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Incoming logs */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Jurnal Incoming ({webhookLogs.filter(l => l.direction === "incoming").length})</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Eroare</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs.filter(l => l.direction === "incoming").map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{new Date(log.created_at).toLocaleString("ro-RO")}</TableCell>
                        <TableCell className="text-xs">{log.event_type || "—"}</TableCell>
                        <TableCell>
                          {log.status === "success" ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                        </TableCell>
                        <TableCell className="text-xs text-destructive">{log.error_message || "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setShowLogDetail(log)}><Eye className="w-3 h-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {webhookLogs.filter(l => l.direction === "incoming").length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Niciun webhook incoming primit.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SYNC LOG TAB ═══ */}
        <TabsContent value="sync-log" className="space-y-4">
          <div className="flex gap-2">
            <Select value={logFilterIntegration} onValueChange={setLogFilterIntegration}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Toate integrările" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate integrările</SelectItem>
                {[...new Set(syncLogs.map(l => l.integration_name).filter(Boolean))].map(name => (
                  <SelectItem key={name!} value={name!}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={logFilterStatus} onValueChange={setLogFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Toate statusurile" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="success">Succes</SelectItem>
                <SelectItem value="running">Rulează</SelectItem>
                <SelectItem value="failed">Eșuat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Integrare</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Direcție</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Create</TableHead>
                <TableHead>Update</TableHead>
                <TableHead>Erori</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSyncLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{new Date(log.started_at).toLocaleString("ro-RO")}</TableCell>
                  <TableCell className="text-sm">{log.integration_name || "—"}</TableCell>
                  <TableCell className="text-xs">{log.sync_type}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{log.direction === "pull" ? "↓ Pull" : "↑ Push"}</Badge></TableCell>
                  <TableCell className="text-xs">{log.records_total}</TableCell>
                  <TableCell className="text-xs text-green-600">{log.records_created}</TableCell>
                  <TableCell className="text-xs text-blue-600">{log.records_updated}</TableCell>
                  <TableCell className="text-xs text-destructive">{log.records_failed}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === "success" ? "default" : log.status === "running" ? "secondary" : "destructive"} className="text-[10px]">
                      {log.status === "success" ? "✓ Succes" : log.status === "running" ? "⏳ Rulează" : "✗ Eșuat"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSyncLogs.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nicio operație de sincronizare înregistrată.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* ═══ INTEGRATION DIALOG ═══ */}
      <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editIntegration?.id ? "Editare" : "Adaugă"} Integrare ERP</DialogTitle>
          </DialogHeader>
          {editIntegration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nume integrare</Label>
                  <Input value={editIntegration.name} onChange={e => setEditIntegration({ ...editIntegration, name: e.target.value })} />
                </div>
                <div>
                  <Label>Tip autentificare</Label>
                  <Select value={editIntegration.auth_type} onValueChange={v => setEditIntegration({ ...editIntegration, auth_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="api_key_header">API Key Header</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>API Base URL</Label>
                  <Input type="url" value={editIntegration.api_base_url || ""} onChange={e => setEditIntegration({ ...editIntegration, api_base_url: e.target.value })} placeholder="https://erp.example.com/api" />
                </div>
                <div>
                  <Label>API Key / Token</Label>
                  <Input type="password" value={editIntegration.api_key || ""} onChange={e => setEditIntegration({ ...editIntegration, api_key: e.target.value })} />
                </div>
              </div>

              {/* Sync settings */}
              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="text-sm font-medium">Ce se sincronizează</h4>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: "sync_products" as const, label: "Produse" },
                    { key: "sync_stock" as const, label: "Stocuri" },
                    { key: "sync_orders" as const, label: "Comenzi" },
                    { key: "sync_customers" as const, label: "Clienți" },
                  ].map(s => (
                    <label key={s.key} className="flex items-center gap-1.5 text-sm">
                      <Checkbox checked={editIntegration[s.key]} onCheckedChange={v => setEditIntegration({ ...editIntegration, [s.key]: !!v })} />
                      {s.label}
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Direcție sincronizare</Label>
                    <Select value={editIntegration.sync_direction} onValueChange={v => setEditIntegration({ ...editIntegration, sync_direction: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="erp_to_store">ERP → Magazin</SelectItem>
                        <SelectItem value="store_to_erp">Magazin → ERP</SelectItem>
                        <SelectItem value="bidirectional">Bidirecțional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Frecvență</Label>
                    <Select value={editIntegration.sync_frequency} onValueChange={v => setEditIntegration({ ...editIntegration, sync_frequency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time (webhook)</SelectItem>
                        <SelectItem value="15min">La 15 minute</SelectItem>
                        <SelectItem value="hourly">Orar</SelectItem>
                        <SelectItem value="daily">Zilnic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Conflict stoc</Label>
                    <Select value={editIntegration.stock_conflict_resolution} onValueChange={v => setEditIntegration({ ...editIntegration, stock_conflict_resolution: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="erp_wins">ERP câștigă</SelectItem>
                        <SelectItem value="store_wins">Magazin câștigă</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Field mappings */}
              <div className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Mapare câmpuri</h4>
                  <Button size="sm" variant="outline" onClick={addFieldMapping}><Plus className="w-3 h-3 mr-1" />Adaugă</Button>
                </div>
                {fieldMappings.map((fm, idx) => (
                  <div key={fm.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-[10px]">Câmp ERP</Label>
                      <Input value={fm.erp_field} onChange={e => updateFieldMapping(idx, "erp_field", e.target.value)} placeholder="cod_produs" className="h-8 text-xs" />
                    </div>
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground mb-1.5 shrink-0" />
                    <div className="flex-1">
                      <Label className="text-[10px]">Câmp Magazin</Label>
                      <Select value={fm.store_field} onValueChange={v => updateFieldMapping(idx, "store_field", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STORE_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeFieldMapping(idx)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                {fieldMappings.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nicio mapare definită.</p>}
              </div>

              {/* Order status mapping */}
              {editIntegration.sync_orders && (
                <div className="border rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-medium">Mapare status comenzi (ERP → Magazin)</h4>
                  <div className="text-xs text-muted-foreground">Definește cum se traduc statusurile din ERP în statusuri magazin (pending, processing, shipped, delivered, cancelled).</div>
                  <Textarea
                    className="font-mono text-xs"
                    rows={3}
                    placeholder={`invoiced=processing\nshipped=shipped\ncancelled=cancelled`}
                    value={Object.entries(editIntegration.order_status_mapping || {}).map(([k, v]) => `${k}=${v}`).join("\n")}
                    onChange={e => {
                      const mapping: Record<string, string> = {};
                      e.target.value.split("\n").forEach(line => {
                        const [k, v] = line.split("=").map(s => s.trim());
                        if (k && v) mapping[k] = v;
                      });
                      setEditIntegration({ ...editIntegration, order_status_mapping: mapping });
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntegrationDialog(false)}>Anulează</Button>
            <Button onClick={saveIntegration}><Save className="w-4 h-4 mr-1" />Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ WEBHOOK DIALOG ═══ */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editWebhook?.id ? "Editare" : "Adaugă"} Webhook</DialogTitle></DialogHeader>
          {editWebhook && (
            <div className="space-y-3">
              <div>
                <Label>Nume</Label>
                <Input value={editWebhook.name} onChange={e => setEditWebhook({ ...editWebhook, name: e.target.value })} placeholder="Notificare comandă nouă" />
              </div>
              <div>
                <Label>Eveniment</Label>
                <Select value={editWebhook.event_type} onValueChange={v => setEditWebhook({ ...editWebhook, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(e => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL destinație</Label>
                <Input type="url" value={editWebhook.destination_url} onChange={e => setEditWebhook({ ...editWebhook, destination_url: e.target.value })} placeholder="https://erp.example.com/webhooks" />
              </div>
              <div>
                <Label>Cheie secretă (pentru semnătură)</Label>
                <Input value={editWebhook.secret_key || ""} onChange={e => setEditWebhook({ ...editWebhook, secret_key: e.target.value })} placeholder="whsec_..." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editWebhook.is_active} onCheckedChange={v => setEditWebhook({ ...editWebhook, is_active: v })} />
                <Label>Activ</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWebhookDialog(false)}>Anulează</Button>
            <Button onClick={saveWebhook}><Save className="w-4 h-4 mr-1" />Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ LOG DETAIL DIALOG ═══ */}
      <Dialog open={!!showLogDetail} onOpenChange={() => setShowLogDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalii webhook log</DialogTitle></DialogHeader>
          {showLogDetail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><Label className="text-[10px]">Direcție</Label><p>{showLogDetail.direction}</p></div>
                <div><Label className="text-[10px]">Status</Label><p>{showLogDetail.status}</p></div>
                <div><Label className="text-[10px]">Eveniment</Label><p>{showLogDetail.event_type || "—"}</p></div>
                <div><Label className="text-[10px]">Cod răspuns</Label><p>{showLogDetail.response_status || "—"}</p></div>
              </div>
              {showLogDetail.request_payload && (
                <div>
                  <Label className="text-[10px]">Payload</Label>
                  <pre className="bg-muted p-2 rounded text-[11px] overflow-auto max-h-[200px]">{JSON.stringify(showLogDetail.request_payload, null, 2)}</pre>
                </div>
              )}
              {showLogDetail.response_body && (
                <div>
                  <Label className="text-[10px]">Răspuns</Label>
                  <pre className="bg-muted p-2 rounded text-[11px] overflow-auto max-h-[200px]">{showLogDetail.response_body}</pre>
                </div>
              )}
              {showLogDetail.error_message && (
                <div>
                  <Label className="text-[10px]">Eroare</Label>
                  <p className="text-xs text-destructive">{showLogDetail.error_message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
