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
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Truck, Save, TestTube, Loader2, RefreshCw, Info,
  AlertTriangle, MapPin, Package, Download, Trash2, Plus
} from "lucide-react";

export default function AdminSamedaySettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({});
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState("");

  // Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["sameday-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sameday_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Pickup points
  const { data: pickupPoints = [] } = useQuery({
    queryKey: ["sameday-pickup-points"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sameday_pickup_points" as any)
        .select("*")
        .order("alias");
      return (data as any[]) || [];
    },
  });

  // Services
  const { data: services = [] } = useQuery({
    queryKey: ["sameday-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sameday_services" as any)
        .select("*")
        .order("name");
      return (data as any[]) || [];
    },
  });

  // Counties
  const { data: counties = [] } = useQuery({
    queryKey: ["sameday-counties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sameday_counties" as any)
        .select("*")
        .order("name");
      return (data as any[]) || [];
    },
  });

  // AWBs
  const { data: awbs = [] } = useQuery({
    queryKey: ["sameday-awbs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sameday_awbs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data as any[]) || [];
    },
  });

  // City mappings
  const { data: cityMappings = [] } = useQuery({
    queryKey: ["sameday-city-mappings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sameday_city_mappings" as any)
        .select("*")
        .order("platform_city_name");
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
        .from("sameday_settings" as any)
        .update({ ...rest, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sameday-settings"] });
      toast.success("Setări Sameday salvate!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testConnection = async () => {
    if (!form.username || !form.password) {
      toast.error("Completează username și parola înainte de test");
      return;
    }
    setTesting(true);
    try {
      const baseUrl = form.sandbox_mode
        ? "https://sameday-api.demo.zitec.com"
        : "https://api.sameday.ro";
      const res = await fetch(`${baseUrl}/api/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(form.username)}&password=${encodeURIComponent(form.password)}`,
      });
      if (res.ok) {
        const data = await res.json();
        // Store token
        update("auth_token", data.token);
        update("token_expires_at", data.expire_at);
        toast.success("Autentificare Sameday reușită! ✅");
      } else {
        toast.error("Autentificare eșuată. Verifică credențialele.");
      }
    } catch (err: any) {
      toast.error(`Eroare conexiune: ${err.message}`);
    }
    setTesting(false);
  };

  const syncData = async (type: string) => {
    setSyncing(type);
    toast.info(`Sincronizare ${type}... (demo — necesită edge function conectată la Sameday API)`);
    await new Promise((r) => setTimeout(r, 1500));
    setSyncing("");
    toast.success(`Sincronizare ${type} finalizată (demo)`);
  };

  const update = (key: string, value: any) => setForm((p: any) => ({ ...p, [key]: value }));

  const tokenValid = form.token_expires_at && new Date(form.token_expires_at) > new Date();

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Truck className="h-6 w-6 text-primary" /> Sameday Courier
          </h1>
          <p className="text-muted-foreground">Integrare completă Sameday & EasyBox</p>
        </div>
        <div className="flex items-center gap-3">
          <Label>Activat</Label>
          <Switch checked={form.enabled || false} onCheckedChange={(v) => update("enabled", v)} />
        </div>
      </div>

      {form.sandbox_mode && (
        <Alert className="border-accent bg-accent/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">Modul Sandbox activ — se folosește mediul de test Sameday</AlertDescription>
        </Alert>
      )}

      {form.auth_token && (
        <Alert className={tokenValid ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Token: {tokenValid ? "✅ Valid" : "⚠ Expirat"} {form.token_expires_at ? `(expiră: ${format(new Date(form.token_expires_at), "dd.MM.yyyy HH:mm", { locale: ro })})` : ""}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="connection">Conectare</TabsTrigger>
          <TabsTrigger value="awb-config">Configurare AWB</TabsTrigger>
          <TabsTrigger value="data">Date Sameday</TabsTrigger>
          <TabsTrigger value="mapping">Mapare Localități</TabsTrigger>
          <TabsTrigger value="awbs">AWB-uri ({awbs.length})</TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: CONNECTION ═══ */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credențiale Sameday API</CardTitle>
              <CardDescription>Datele de autentificare pentru contul Sameday</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input value={form.username || ""} onChange={(e) => update("username", e.target.value)} placeholder="utilizator_sameday" />
                </div>
                <div className="space-y-2">
                  <Label>Parola *</Label>
                  <Input type="password" value={form.password || ""} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Switch checked={form.sandbox_mode ?? true} onCheckedChange={(v) => update("sandbox_mode", v)} />
                <Label>Mod Sandbox (test)</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={testConnection} disabled={testing}>
                  {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
                  Autentificare & Test Conexiune
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Instrucțiuni</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Creează cont pe <span className="font-medium text-foreground">sameday.ro</span> sau contactează <span className="font-medium text-foreground">office@sameday.ro</span></li>
                <li>Solicită acces API (username + parolă) de la Sameday</li>
                <li>Folosește modul Sandbox pentru teste înainte de producție</li>
                <li>URL API producție: <code className="text-xs bg-muted px-2 py-1 rounded">https://api.sameday.ro</code></li>
                <li>URL API sandbox: <code className="text-xs bg-muted px-2 py-1 rounded">https://sameday-api.demo.zitec.com</code></li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 2: AWB CONFIG ═══ */}
        <TabsContent value="awb-config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setări Implicite AWB</CardTitle>
              <CardDescription>Valori utilizate la generarea automată sau manuală de AWB-uri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Punct de ridicare implicit</Label>
                  <Select value={String(form.default_pickup_point_id || "")} onValueChange={(v) => update("default_pickup_point_id", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                    <SelectContent>
                      {pickupPoints.map((pp: any) => (
                        <SelectItem key={pp.id} value={String(pp.id)}>{pp.alias || pp.address} — {pp.city_name}</SelectItem>
                      ))}
                      {pickupPoints.length === 0 && <SelectItem value="" disabled>Sincronizează punctele de ridicare</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Serviciu implicit</Label>
                  <Select value={String(form.default_service_id || "")} onValueChange={(v) => update("default_service_id", Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Selectează..." /></SelectTrigger>
                    <SelectContent>
                      {services.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                      {services.length === 0 && <SelectItem value="" disabled>Sincronizează serviciile</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tip colet implicit</Label>
                  <Select value={String(form.default_package_type || 2)} onValueChange={(v) => update("default_package_type", Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Plic</SelectItem>
                      <SelectItem value="1">Colet mic</SelectItem>
                      <SelectItem value="2">Colet mare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plata expediere (awbPayment)</Label>
                  <Select value={String(form.default_awb_payment || 1)} onValueChange={(v) => update("default_awb_payment", Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Expeditor</SelectItem>
                      <SelectItem value="2">Destinatar</SelectItem>
                      <SelectItem value="3">Terță parte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Greutate implicită (kg)</Label>
                  <Input type="number" step="0.1" min="0.1" value={form.default_weight || 1} onChange={(e) => update("default_weight", parseFloat(e.target.value))} />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch checked={form.auto_generate || false} onCheckedChange={(v) => update("auto_generate", v)} />
                  <Label>Generare automată AWB</Label>
                </div>
                {form.auto_generate && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                    <Label className="text-sm">La statusul comenzii</Label>
                    <Select value={form.auto_generate_on_status || "processing"} onValueChange={(v) => update("auto_generate_on_status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Comandă confirmată</SelectItem>
                        <SelectItem value="processing">În procesare</SelectItem>
                        <SelectItem value="payment_confirmed">Plată confirmată</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label>Trimite email tracking clientului</Label>
                <Switch checked={form.send_tracking_email ?? true} onCheckedChange={(v) => update("send_tracking_email", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 3: SAMEDAY DATA ═══ */}
        <TabsContent value="data" className="space-y-4">
          {/* Pickup Points */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Puncte de Ridicare</CardTitle>
                <CardDescription>{pickupPoints.length} puncte sincronizate</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => syncData("puncte de ridicare")} disabled={!!syncing}>
                {syncing === "puncte de ridicare" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Sincronizează
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Alias</TableHead>
                      <TableHead>Adresă</TableHead>
                      <TableHead>Oraș</TableHead>
                      <TableHead>Județ</TableHead>
                      <TableHead>Implicit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pickupPoints.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Niciun punct de ridicare sincronizat. Apasă „Sincronizează" mai sus.</TableCell></TableRow>
                    )}
                    {pickupPoints.map((pp: any) => (
                      <TableRow key={pp.id}>
                        <TableCell className="font-mono text-xs">{pp.id}</TableCell>
                        <TableCell className="font-medium">{pp.alias || "—"}</TableCell>
                        <TableCell className="text-sm">{pp.address || "—"}</TableCell>
                        <TableCell className="text-sm">{pp.city_name || "—"}</TableCell>
                        <TableCell className="text-sm">{pp.county_name || "—"}</TableCell>
                        <TableCell>{pp.is_default ? <Badge>Implicit</Badge> : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Servicii</CardTitle>
                <CardDescription>{services.length} servicii disponibile</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => syncData("servicii")} disabled={!!syncing}>
                {syncing === "servicii" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Sincronizează
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nume</TableHead>
                      <TableHead>Cod</TableHead>
                      <TableHead>Tip livrare</TableHead>
                      <TableHead>Implicit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Niciun serviciu sincronizat.</TableCell></TableRow>
                    )}
                    {services.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-sm">{s.service_code || "—"}</TableCell>
                        <TableCell className="text-sm">{s.delivery_type_name || "—"}</TableCell>
                        <TableCell>{s.is_default ? <Badge>Implicit</Badge> : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Counties */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Județe Sameday</CardTitle>
                <CardDescription>{counties.length} județe sincronizate</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => syncData("județe")} disabled={!!syncing}>
                {syncing === "județe" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Sincronizează
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="flex flex-wrap gap-2">
                  {counties.map((c: any) => (
                    <Badge key={c.id} variant="outline" className="text-xs">{c.name} ({c.code || c.id})</Badge>
                  ))}
                  {counties.length === 0 && <p className="text-sm text-muted-foreground">Niciun județ sincronizat.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 4: CITY MAPPING ═══ */}
        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapare Localități</CardTitle>
              <CardDescription>Potrivire manuală între localitățile din platformă și ID-urile Sameday (pentru orașe negăsite automat)</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Localitate platformă</TableHead>
                      <TableHead>Județ platformă</TableHead>
                      <TableHead>ID oraș Sameday</TableHead>
                      <TableHead>ID județ Sameday</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cityMappings.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nicio mapare manuală configurată. Localitățile sunt potrivite automat după nume.</TableCell></TableRow>
                    )}
                    {cityMappings.map((cm: any) => (
                      <TableRow key={cm.id}>
                        <TableCell className="font-medium">{cm.platform_city_name}</TableCell>
                        <TableCell className="text-sm">{cm.platform_county_name || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{cm.sameday_city_id || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{cm.sameday_county_id || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm"><Trash2 className="h-3 w-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Adaugă mapare
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 5: AWBs ═══ */}
        <TabsContent value="awbs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> AWB-uri Generate</CardTitle>
              <CardDescription>Istoric AWB-uri generate prin Sameday</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Nr. AWB</TableHead>
                      <TableHead>Destinatar</TableHead>
                      <TableHead>Colete</TableHead>
                      <TableHead>Greutate</TableHead>
                      <TableHead>Ramburs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {awbs.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Niciun AWB generat</TableCell></TableRow>
                    )}
                    {awbs.map((awb: any) => (
                      <TableRow key={awb.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {awb.generated_at ? format(new Date(awb.generated_at), "dd.MM.yy HH:mm", { locale: ro }) : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          <a href={`https://www.sameday.ro/tracking?awb=${awb.awb_number}`} target="_blank" rel="noopener" className="text-primary hover:underline">
                            {awb.awb_number}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm">{awb.recipient_name || "—"}</TableCell>
                        <TableCell className="text-sm">{awb.package_count}</TableCell>
                        <TableCell className="text-sm">{awb.total_weight} kg</TableCell>
                        <TableCell className="text-sm font-medium">
                          {awb.cash_on_delivery > 0 ? `${awb.cash_on_delivery} RON` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={awb.status === "generated" ? "default" : awb.status === "delivered" ? "secondary" : "destructive"} className="text-xs">
                            {awb.status === "generated" ? "Generat" : awb.status === "delivered" ? "Livrat" : "Șters"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" title="Descarcă PDF"><Download className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="sm" title="Șterge AWB"><Trash2 className="h-3 w-3" /></Button>
                          </div>
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
