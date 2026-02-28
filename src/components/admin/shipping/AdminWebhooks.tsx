import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Webhook, RefreshCw, Search, Eye, Trash2, Loader2,
  CheckCircle2, XCircle, AlertTriangle, Clock, Copy,
  ArrowDownToLine, ArrowUpFromLine, RotateCcw, Send,
  Shield, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/15 text-yellow-600", icon: <Clock className="w-3 h-3" /> },
  delivered: { label: "Procesat", color: "bg-green-500/15 text-green-600", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: "Eșuat", color: "bg-red-500/15 text-red-600", icon: <XCircle className="w-3 h-3" /> },
  retrying: { label: "Retry", color: "bg-orange-500/15 text-orange-600", icon: <RotateCcw className="w-3 h-3" /> },
};

const CARRIERS = [
  { key: "fancourier", label: "Fan Courier" },
  { key: "sameday", label: "Sameday" },
  { key: "dpd", label: "DPD" },
  { key: "cargus", label: "Cargus" },
  { key: "gls", label: "GLS" },
];

export default function AdminWebhooks() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [viewPayload, setViewPayload] = useState<any>(null);
  const [setupDialog, setSetupDialog] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("");

  // ─── Queries ───
  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["admin-webhooks", statusFilter, directionFilter],
    queryFn: async () => {
      let q = supabase
        .from("webhook_queue")
        .select("*, connector_instances(connectors(name, key))")
        .order("created_at", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (directionFilter !== "all") q = q.eq("direction", directionFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: courierConfigs = [] } = useQuery({
    queryKey: ["courier-configs-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courier_configs")
        .select("*")
        .order("courier");
      if (error) throw error;
      return data;
    },
  });

  // ─── Retry mutation ───
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("webhook_queue")
        .update({
          status: "pending",
          retry_count: 0,
          last_error: null,
          dead_letter: false,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-webhooks"] });
      toast.success("Webhook readăugat în coadă!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhook_queue").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-webhooks"] });
      toast.success("Webhook șters!");
    },
  });

  // ─── Generate webhook URL ───
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "jkmiemvihdjwpcpgfleh";
  const getWebhookUrl = (carrier: string, secret: string) =>
    `https://${projectId}.supabase.co/functions/v1/webhook-receiver?carrier=${carrier}&secret=${secret}`;

  // ─── Setup webhook secret for a carrier ───
  const setupWebhookSecret = async () => {
    if (!selectedCarrier) return;
    const secret = crypto.randomUUID().replace(/-/g, "").slice(0, 32);

    const existing = courierConfigs.find((c: any) => c.courier === selectedCarrier);
    if (existing) {
      const currentConfig = (existing.config_json as Record<string, any>) || {};
      const { error } = await supabase
        .from("courier_configs")
        .update({
          config_json: { ...currentConfig, webhook_secret: secret },
        })
        .eq("id", existing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const carrierLabel = CARRIERS.find(c => c.key === selectedCarrier)?.label || selectedCarrier;
      const { error } = await supabase
        .from("courier_configs")
        .insert({
          courier: selectedCarrier,
          display_name: carrierLabel,
          is_active: true,
          config_json: { webhook_secret: secret },
        });
      if (error) { toast.error(error.message); return; }
    }

    qc.invalidateQueries({ queryKey: ["courier-configs-webhooks"] });
    toast.success("Webhook secret generat! Copiază URL-ul de mai jos.");
    setSetupDialog(false);
  };

  // ─── Stats ───
  const stats = {
    total: webhooks.length,
    pending: webhooks.filter((w: any) => w.status === "pending").length,
    delivered: webhooks.filter((w: any) => w.status === "delivered").length,
    failed: webhooks.filter((w: any) => w.status === "failed" || w.dead_letter).length,
    incoming: webhooks.filter((w: any) => w.direction === "incoming").length,
  };

  const filtered = webhooks.filter((w: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.url?.toLowerCase().includes(s) ||
      w.idempotency_key?.toLowerCase().includes(s) ||
      JSON.stringify(w.payload).toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            Webhook Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.total} webhook-uri · {stats.incoming} incoming · {stats.failed} eșuate
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setSetupDialog(true)}>
          <Link2 className="w-3.5 h-3.5" /> Configurare Webhook
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending", value: stats.pending, icon: <Clock className="w-4 h-4 text-yellow-600" /> },
          { label: "Procesate", value: stats.delivered, icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
          { label: "Eșuate / DLQ", value: stats.failed, icon: <XCircle className="w-4 h-4 text-red-600" /> },
          { label: "Incoming", value: stats.incoming, icon: <ArrowDownToLine className="w-4 h-4 text-primary" /> },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center gap-2">
              {s.icon}
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue" className="text-xs">Coadă Webhook-uri</TabsTrigger>
          <TabsTrigger value="endpoints" className="text-xs">Endpoint-uri Active</TabsTrigger>
        </TabsList>

        {/* ─── Queue Tab ─── */}
        <TabsContent value="queue" className="space-y-3">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută URL, payload..." className="pl-7 h-8 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Toate</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Toate</SelectItem>
                <SelectItem value="incoming" className="text-xs">Incoming</SelectItem>
                <SelectItem value="outgoing" className="text-xs">Outgoing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center">
              <Webhook className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Niciun webhook în coadă.</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Dir</TableHead>
                      <TableHead className="text-[10px]">Conector</TableHead>
                      <TableHead className="text-[10px]">Data</TableHead>
                      <TableHead className="text-[10px]">Status</TableHead>
                      <TableHead className="text-[10px]">Retry</TableHead>
                      <TableHead className="text-[10px]">DLQ</TableHead>
                      <TableHead className="text-[10px] text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((wh: any) => {
                      const st = statusConfig[wh.status] || statusConfig.pending;
                      const connectorName = wh.connector_instances?.connectors?.name || "—";
                      return (
                        <TableRow key={wh.id} className="text-xs">
                          <TableCell>
                            {wh.direction === "incoming" ? (
                              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowUpFromLine className="w-3.5 h-3.5 text-purple-600" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{connectorName}</TableCell>
                          <TableCell className="text-muted-foreground text-[10px]">
                            {format(new Date(wh.created_at), "dd MMM HH:mm:ss", { locale: ro })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[9px] gap-0.5 ${st.color}`}>
                              {st.icon} {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-[10px]">{wh.retry_count}/{wh.max_retries}</TableCell>
                          <TableCell>
                            {wh.dead_letter && <Badge variant="destructive" className="text-[9px]">DLQ</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewPayload(wh)} title="Vezi payload">
                                <Eye className="w-3 h-3" />
                              </Button>
                              {(wh.status === "failed" || wh.dead_letter) && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => retryMutation.mutate(wh.id)} title="Retry">
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => { if (confirm("Ștergi webhook-ul?")) deleteMutation.mutate(wh.id); }}
                                title="Șterge"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Endpoints Tab ─── */}
        <TabsContent value="endpoints" className="space-y-3">
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs">Endpoint-uri Webhook Active</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              {CARRIERS.map(carrier => {
                const config = courierConfigs.find((c: any) => c.courier === carrier.key);
                const configJson = (config?.config_json as Record<string, any>) || {};
                const hasSecret = !!configJson.webhook_secret;
                const webhookUrl = hasSecret ? getWebhookUrl(carrier.key, configJson.webhook_secret) : null;

                return (
                  <div key={carrier.key} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{carrier.label}</span>
                        {hasSecret ? (
                          <Badge variant="outline" className="text-[9px] bg-green-500/15 text-green-600">
                            <Shield className="w-2.5 h-2.5 mr-0.5" /> Activ
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground">Neconfigurat</Badge>
                        )}
                      </div>
                      {webhookUrl && (
                        <p className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">{webhookUrl}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {webhookUrl && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(webhookUrl);
                            toast.success("URL copiat!");
                          }}
                          title="Copiază URL"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="outline" size="sm" className="h-7 text-[10px]"
                        onClick={() => { setSelectedCarrier(carrier.key); setSetupDialog(true); }}
                      >
                        {hasSecret ? "Regenerează" : "Configurează"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs text-muted-foreground">Cum funcționează?</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 text-[10px] text-muted-foreground space-y-1">
              <p>1. Configurează webhook-ul pentru curierul dorit (se generează un URL unic cu secret).</p>
              <p>2. Copiază URL-ul și adaugă-l în panoul curierului ca "Tracking Callback URL".</p>
              <p>3. Curierul va trimite automat actualizări de status care vor fi procesate și salvate în timeline-ul comenzii.</p>
              <p>4. Statusurile AWB se mapează automat: picked_up → in_transit → out_for_delivery → delivered.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── View Payload Dialog ─── */}
      <Dialog open={!!viewPayload} onOpenChange={() => setViewPayload(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Detalii Webhook
            </DialogTitle>
          </DialogHeader>
          {viewPayload && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Direcție:</span> <span className="font-medium">{viewPayload.direction}</span></div>
                <div><span className="text-muted-foreground">Metodă:</span> <span className="font-mono">{viewPayload.method}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{viewPayload.status}</span></div>
                <div><span className="text-muted-foreground">Retry:</span> <span>{viewPayload.retry_count}/{viewPayload.max_retries}</span></div>
              </div>
              {viewPayload.url && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">URL</p>
                  <p className="font-mono text-[10px] break-all bg-muted p-1.5 rounded">{viewPayload.url}</p>
                </div>
              )}
              {viewPayload.idempotency_key && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Idempotency Key</p>
                  <p className="font-mono text-[10px] bg-muted p-1.5 rounded">{viewPayload.idempotency_key}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Payload</p>
                <pre className="font-mono text-[9px] bg-muted p-2 rounded overflow-x-auto max-h-48">
                  {JSON.stringify(viewPayload.payload, null, 2)}
                </pre>
              </div>
              {viewPayload.response_body && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Response ({viewPayload.response_status})</p>
                  <pre className="font-mono text-[9px] bg-muted p-2 rounded overflow-x-auto max-h-32">
                    {viewPayload.response_body}
                  </pre>
                </div>
              )}
              {viewPayload.last_error && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Ultima eroare</p>
                  <p className="text-red-600 text-[10px]">{viewPayload.last_error}</p>
                </div>
              )}
              {viewPayload.error_message && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Error Message</p>
                  <p className="text-red-600 text-[10px]">{viewPayload.error_message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Setup Dialog ─── */}
      <Dialog open={setupDialog} onOpenChange={setSetupDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Configurare Webhook Curier</DialogTitle>
            <DialogDescription className="text-xs">Generează un URL de webhook securizat pentru a primi actualizări tracking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Curier</Label>
              <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selectează curier..." /></SelectTrigger>
                <SelectContent>
                  {CARRIERS.map(c => (
                    <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg text-[10px] text-muted-foreground space-y-1">
              <p className="flex items-center gap-1"><Shield className="w-3 h-3" /> <strong>Securitate:</strong></p>
              <p>Se generează un secret unic care trebuie inclus în URL. Doar cererile cu secret-ul corect vor fi procesate.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setSetupDialog(false)}>Anulează</Button>
            <Button size="sm" className="text-xs" disabled={!selectedCarrier} onClick={setupWebhookSecret}>
              Generează Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
