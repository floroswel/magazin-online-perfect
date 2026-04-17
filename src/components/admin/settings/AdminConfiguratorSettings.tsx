import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save, Plus, Trash2, Settings, Package, Palette, PenTool } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Vessel {
  id: string;
  name: string;
  burn_hours: number;
  price: number;
  image_url: string;
}

interface ConfigSettings {
  vessels: Vessel[];
  scent_surcharge: number;
  gift_box_surcharge: number;
  custom_text_surcharge: number;
  rush_surcharge: number;
  production_time: string;
  min_order_quantity: number;
  premium_scent_ids: string[];
}

const DEFAULT_SETTINGS: ConfigSettings = {
  vessels: [
    { id: "borcan-200", name: "Borcan clasic 200ml / ~45 ore", burn_hours: 45, price: 45, image_url: "" },
    { id: "ceramic-300", name: "Recipient ceramic 300ml / ~65 ore", burn_hours: 65, price: 65, image_url: "" },
    { id: "beton-150", name: "Vas din beton 150ml / ~30 ore", burn_hours: 30, price: 55, image_url: "" },
  ],
  scent_surcharge: 0,
  gift_box_surcharge: 25,
  custom_text_surcharge: 0,
  rush_surcharge: 30,
  production_time: "3-5 zile lucrătoare",
  min_order_quantity: 1,
  premium_scent_ids: [],
};

export default function AdminConfiguratorSettings() {
  const qc = useQueryClient();
  const [settings, setSettings] = useState<ConfigSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("vessels");

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "configurator_settings").maybeSingle().then(({ data }) => {
      if (data?.value_json && typeof data.value_json === "object" && !Array.isArray(data.value_json)) {
        setSettings({ ...DEFAULT_SETTINGS, ...(data.value_json as any) });
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "configurator_settings", value_json: settings as any, description: "Configurator pricing settings" },
      { onConflict: "key" }
    );
    if (error) toast.error(error.message); else toast.success("Setări configurator salvate!");
    setSaving(false);
  };

  const updateVessel = (idx: number, field: keyof Vessel, value: any) => {
    setSettings(s => ({
      ...s,
      vessels: s.vessels.map((v, i) => i === idx ? { ...v, [field]: value } : v),
    }));
  };

  const addVessel = () => {
    setSettings(s => ({
      ...s,
      vessels: [...s.vessels, { id: `vessel-${Date.now()}`, name: "", burn_hours: 0, price: 0, image_url: "" }],
    }));
  };

  const removeVessel = (idx: number) => {
    setSettings(s => ({ ...s, vessels: s.vessels.filter((_, i) => i !== idx) }));
  };

  // Custom orders
  const { data: customOrders = [] } = useQuery({
    queryKey: ["admin-custom-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, created_at, status, total, user_email, notes")
        .not("notes", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []).filter((o: any) => {
        try {
          const n = typeof o.notes === "string" ? JSON.parse(o.notes) : o.notes;
          return n?.is_custom === true;
        } catch { return false; }
      });
    },
  });

  const statusOptions = [
    { value: "pending", label: "Primit" },
    { value: "in_production", label: "În producție" },
    { value: "ready", label: "Gata" },
    { value: "shipped", label: "Expediat" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setări Configurator</h1>
          <p className="text-sm text-muted-foreground">Gestionează prețurile și opțiunile configuratorului de lumânări</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" /> Salvează</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="vessels" className="gap-1.5"><Package className="w-4 h-4" /> Recipiente</TabsTrigger>
          <TabsTrigger value="surcharges" className="gap-1.5"><Settings className="w-4 h-4" /> Surcharge-uri</TabsTrigger>
          <TabsTrigger value="custom-orders" className="gap-1.5"><PenTool className="w-4 h-4" /> Comenzi Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="vessels" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recipiente & Prețuri</CardTitle>
              <Button size="sm" onClick={addVessel}><Plus className="h-4 w-4 mr-1" /> Adaugă</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nume recipient</TableHead>
                    <TableHead>Ore ardere</TableHead>
                    <TableHead>Preț (RON)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.vessels.map((v, i) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Input value={v.name} onChange={e => updateVessel(i, "name", e.target.value)} placeholder="Borcan clasic 200ml" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-24" value={v.burn_hours} onChange={e => updateVessel(i, "burn_hours", Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-28" value={v.price} onChange={e => updateVessel(i, "price", Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeVessel(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surcharges" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Surcharge-uri & Opțiuni</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Suprataxă parfum premium (RON)</Label>
                  <Input type="number" value={settings.scent_surcharge} onChange={e => setSettings(s => ({ ...s, scent_surcharge: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Cutie cadou premium (RON)</Label>
                  <Input type="number" value={settings.gift_box_surcharge} onChange={e => setSettings(s => ({ ...s, gift_box_surcharge: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Mesaj personalizat text (RON)</Label>
                  <Input type="number" value={settings.custom_text_surcharge} onChange={e => setSettings(s => ({ ...s, custom_text_surcharge: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Rush production 1-2 zile (RON)</Label>
                  <Input type="number" value={settings.rush_surcharge} onChange={e => setSettings(s => ({ ...s, rush_surcharge: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Timp de producție (text afișat)</Label>
                <Input value={settings.production_time} onChange={e => setSettings(s => ({ ...s, production_time: e.target.value }))} />
              </div>
              <div>
                <Label>Cantitate minimă per comandă custom</Label>
                <Input type="number" min={1} value={settings.min_order_quantity} onChange={e => setSettings(s => ({ ...s, min_order_quantity: Number(e.target.value) }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-orders" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Comenzi Personalizate</CardTitle></CardHeader>
            <CardContent>
              {customOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PenTool className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Nicio comandă personalizată încă.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comandă</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customOrders.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">#{o.order_number || o.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{o.user_email || "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString("ro-RO")}</TableCell>
                        <TableCell className="font-medium">{Number(o.total || 0).toFixed(2)} lei</TableCell>
                        <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
