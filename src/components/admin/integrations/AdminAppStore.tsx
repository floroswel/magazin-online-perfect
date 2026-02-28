import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Puzzle, Download, Settings, Play, Trash2, ToggleLeft, ToggleRight,
  RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Package, CreditCard, Truck, Globe, BarChart3, Megaphone, Database,
  Zap, Eye, ChevronRight, Search, Filter, ArrowUpDown, Plug, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const CATEGORY_ICONS: Record<string, any> = {
  courier: Truck,
  payment: CreditCard,
  marketplace: Globe,
  erp: Database,
  accounting: BarChart3,
  marketing: Megaphone,
  analytics: BarChart3,
};

const CATEGORY_LABELS: Record<string, string> = {
  courier: "Curieri",
  payment: "Plăți",
  marketplace: "Marketplace",
  erp: "ERP",
  accounting: "Contabilitate",
  marketing: "Marketing",
  analytics: "Analiză",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Activ", color: "bg-green-500/15 text-green-700 border-green-200", icon: CheckCircle2 },
  error: { label: "Eroare", color: "bg-red-500/15 text-red-700 border-red-200", icon: XCircle },
  syncing: { label: "Sincronizare...", color: "bg-blue-500/15 text-blue-700 border-blue-200", icon: RefreshCw },
  inactive: { label: "Inactiv", color: "bg-gray-500/15 text-gray-600 border-gray-200", icon: ToggleLeft },
};

async function sdkCall(action: string, method = "GET", body?: any, params?: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/integration-sdk/${action}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Eroare SDK");
  return data;
}

export default function AdminAppStore() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [configDialog, setConfigDialog] = useState<any>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  // Queries
  const { data: catalogData, isLoading: loadingCatalog } = useQuery({
    queryKey: ["sdk-connectors"],
    queryFn: () => sdkCall("connectors"),
  });

  const { data: instancesData, isLoading: loadingInstances } = useQuery({
    queryKey: ["sdk-instances"],
    queryFn: () => sdkCall("instances"),
  });

  const { data: eventsData } = useQuery({
    queryKey: ["sdk-events"],
    queryFn: () => sdkCall("events", "GET", undefined, { limit: "30" }),
    refetchInterval: 10000,
  });

  const { data: syncLogsData } = useQuery({
    queryKey: ["sdk-sync-logs"],
    queryFn: () => sdkCall("sync-logs"),
  });

  // Mutations
  const installMutation = useMutation({
    mutationFn: (connector_id: string) => sdkCall("install", "POST", { connector_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sdk-instances"] });
      toast({ title: "Conector instalat", description: "Configurează-l pentru a-l activa." });
    },
    onError: (e: Error) => toast({ title: "Eroare", description: e.message, variant: "destructive" }),
  });

  const configureMutation = useMutation({
    mutationFn: (data: any) => sdkCall("configure", "PUT", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sdk-instances"] });
      setConfigDialog(null);
      toast({ title: "Configurație salvată" });
    },
    onError: (e: Error) => toast({ title: "Eroare", description: e.message, variant: "destructive" }),
  });

  const uninstallMutation = useMutation({
    mutationFn: (instance_id: string) => sdkCall("uninstall", "DELETE", undefined, { instance_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sdk-instances"] });
      toast({ title: "Conector dezinstalat" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (instance_id: string) => sdkCall("sync", "POST", { instance_id, sync_action: "manual_sync" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sdk-instances"] });
      qc.invalidateQueries({ queryKey: ["sdk-sync-logs"] });
      toast({ title: "Sincronizare pornită" });
    },
  });

  const connectors = catalogData?.connectors || [];
  const instances = instancesData?.instances || [];
  const events = eventsData?.events || [];
  const syncLogs = syncLogsData?.logs || [];

  const installedConnectorIds = new Set(instances.map((i: any) => i.connector_id));

  const filteredConnectors = connectors.filter((c: any) => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(connectors.map((c: any) => c.category))].sort();

  const openConfig = (instance: any) => {
    setConfigDialog(instance);
    setConfigValues(instance.config_json || {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-primary" />
            App Store / Integrări
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {instances.length} integrări instalate · {instances.filter((i: any) => i.status === "active").length} active
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-8">
          <TabsTrigger value="catalog" className="text-xs">Catalog</TabsTrigger>
          <TabsTrigger value="installed" className="text-xs">Instalate ({instances.length})</TabsTrigger>
          <TabsTrigger value="events" className="text-xs">Evenimente</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Sync Logs</TabsTrigger>
        </TabsList>

        {/* === CATALOG === */}
        <TabsContent value="catalog" className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Caută integrări..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-xs"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                {categories.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingCatalog ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConnectors.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Puzzle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {connectors.length === 0
                    ? "Niciun conector disponibil încă. Adaugă conectori din baza de date."
                    : "Niciun rezultat pentru filtrul selectat."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredConnectors.map((connector: any) => {
                const isInstalled = installedConnectorIds.has(connector.id);
                const CategoryIcon = CATEGORY_ICONS[connector.category] || Puzzle;

                return (
                  <Card key={connector.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {connector.icon_url ? (
                            <img src={connector.icon_url} alt="" className="w-6 h-6" />
                          ) : (
                            <CategoryIcon className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm truncate">{connector.name}</h3>
                            {connector.is_official && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Oficial</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{connector.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {CATEGORY_LABELS[connector.category] || connector.category}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">v{connector.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        {isInstalled ? (
                          <Badge className="bg-green-500/15 text-green-700 border-green-200 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Instalat
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => installMutation.mutate(connector.id)}
                            disabled={installMutation.isPending}
                          >
                            {installMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Download className="w-3 h-3 mr-1" />
                            )}
                            Instalează
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* === INSTALLED === */}
        <TabsContent value="installed" className="space-y-3">
          {loadingInstances ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : instances.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nicio integrare instalată.</p>
                <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => setActiveTab("catalog")}>
                  Explorează catalogul
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {instances.map((instance: any) => {
                const connector = instance.connectors;
                const statusInfo = STATUS_CONFIG[instance.status] || STATUS_CONFIG.inactive;
                const StatusIcon = statusInfo.icon;
                const CategoryIcon = CATEGORY_ICONS[connector?.category] || Puzzle;

                return (
                  <Card key={instance.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <CategoryIcon className="w-4 h-4 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{connector?.name || "Conector"}</h3>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${statusInfo.color}`}>
                              <StatusIcon className={`w-2.5 h-2.5 mr-0.5 ${instance.status === "syncing" ? "animate-spin" : ""}`} />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {CATEGORY_LABELS[connector?.category] || connector?.category}
                            </span>
                            {instance.last_sync_at && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                Sync: {format(new Date(instance.last_sync_at), "dd MMM HH:mm", { locale: ro })}
                              </span>
                            )}
                            {instance.last_error && (
                              <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {instance.last_error}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={async () => {
                              toast({ title: "Test conexiune...", description: "Se verifică credențialele..." });
                              try {
                                const result = await sdkCall("test-connection", "POST", { instance_id: instance.id });
                                if (result.success) {
                                  toast({ title: "✅ Conexiune reușită", description: `${connector?.name} răspunde corect.` });
                                } else {
                                  toast({ title: "❌ Conexiune eșuată", description: result.error || "Verifică credențialele.", variant: "destructive" });
                                }
                              } catch (err: any) {
                                toast({ title: "❌ Test eșuat", description: err.message, variant: "destructive" });
                              }
                            }}
                            title="Test conexiune"
                          >
                            <Plug className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => syncMutation.mutate(instance.id)}
                            disabled={syncMutation.isPending || instance.status === "syncing"}
                            title="Sincronizare manuală"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openConfig(instance)}
                            title="Configurare"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Sigur vrei să dezinstalezi acest conector?")) {
                                uninstallMutation.mutate(instance.id);
                              }
                            }}
                            title="Dezinstalează"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* === EVENTS === */}
        <TabsContent value="events" className="space-y-3">
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Evenimente Integrări
                <Badge variant="secondary" className="text-[9px] ml-auto">{events.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Niciun eveniment încă.</p>
                  ) : (
                    events.map((event: any) => (
                      <div key={event.id} className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${event.processed ? "bg-green-500" : "bg-amber-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-medium text-[10px]">{event.event_type}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground text-[10px]">{event.entity_type}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(event.created_at), "dd MMM HH:mm:ss", { locale: ro })}
                            </span>
                            <span className="text-[10px] text-muted-foreground">Sursă: {event.source}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] shrink-0">
                          {event.processed ? "Procesat" : "Pending"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === SYNC LOGS === */}
        <TabsContent value="logs" className="space-y-3">
          <Card>
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-blue-500" />
                Istoric Sincronizări
                <Badge variant="secondary" className="text-[9px] ml-auto">{syncLogs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ScrollArea className="h-[400px]">
                {syncLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nicio sincronizare încă.</p>
                ) : (
                  <div className="space-y-1.5">
                    {syncLogs.map((log: any) => {
                      const isSuccess = log.status === "success";
                      const isError = log.status === "error";
                      const isRunning = log.status === "running";

                      return (
                        <div key={log.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 text-xs">
                          {isRunning ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
                          ) : isSuccess ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          ) : isError ? (
                            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{log.action}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                              <span>{format(new Date(log.started_at), "dd MMM HH:mm", { locale: ro })}</span>
                              {log.duration_ms && <span>{log.duration_ms}ms</span>}
                              {log.items_processed > 0 && (
                                <span>{log.items_processed} procesate</span>
                              )}
                              {log.items_failed > 0 && (
                                <span className="text-red-600">{log.items_failed} erori</span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${isSuccess ? "text-green-700" : isError ? "text-red-700" : isRunning ? "text-blue-700" : ""}`}
                          >
                            {log.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* === CONFIG DIALOG === */}
      {configDialog && (
        <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">
                Configurare: {configDialog.connectors?.name || "Conector"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configurează credențialele și setările pentru această integrare.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Dynamic fields from settings_schema */}
              {(configDialog.connectors?.settings_schema?.fields || []).map((field: any) => (
                <div key={field.name} className="space-y-1">
                  <Label className="text-xs">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                  {field.type === "json" ? (
                    <Textarea
                      value={configValues[field.name] || ""}
                      onChange={(e) => setConfigValues({ ...configValues, [field.name]: e.target.value })}
                      className="text-xs font-mono h-20"
                      placeholder="{}"
                    />
                  ) : (
                    <Input
                      type={field.type === "password" ? "password" : "text"}
                      value={configValues[field.name] || ""}
                      onChange={(e) => setConfigValues({ ...configValues, [field.name]: e.target.value })}
                      className="h-8 text-xs"
                      placeholder={field.label}
                    />
                  )}
                </div>
              ))}

              {/* If no schema fields, show generic JSON editor */}
              {(!configDialog.connectors?.settings_schema?.fields || configDialog.connectors.settings_schema.fields.length === 0) && (
                <div className="space-y-1">
                  <Label className="text-xs">Configurare (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(configValues, null, 2)}
                    onChange={(e) => {
                      try { setConfigValues(JSON.parse(e.target.value)); } catch {}
                    }}
                    className="text-xs font-mono h-32"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <Label className="text-xs">Activat</Label>
                <Switch
                  checked={configDialog.enabled}
                  onCheckedChange={(checked) => setConfigDialog({ ...configDialog, enabled: checked })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Frecvență sincronizare (minute)</Label>
                <Select
                  value={String(configDialog.sync_frequency_minutes || 60)}
                  onValueChange={(v) => setConfigDialog({ ...configDialog, sync_frequency_minutes: parseInt(v) })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minute</SelectItem>
                    <SelectItem value="15">15 minute</SelectItem>
                    <SelectItem value="30">30 minute</SelectItem>
                    <SelectItem value="60">1 oră</SelectItem>
                    <SelectItem value="360">6 ore</SelectItem>
                    <SelectItem value="1440">24 ore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfigDialog(null)}>
                Anulează
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={() => configureMutation.mutate({
                  instance_id: configDialog.id,
                  config_json: configValues,
                  enabled: configDialog.enabled,
                  sync_frequency_minutes: configDialog.sync_frequency_minutes,
                })}
                disabled={configureMutation.isPending}
              >
                {configureMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                Salvează
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
