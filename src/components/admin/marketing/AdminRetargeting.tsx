import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, UserX, Users, Target, Plus, Loader2, Play, Pause, BarChart3, Send, Smartphone, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminRetargeting() {
  const [tab, setTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [pushCampaigns, setPushCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "", trigger_days: 60, target_segment: "all", target_group_id: "",
    email_1_enabled: true, email_1_subject: "Ne este dor de tine, {{nume}}!",
    email_2_enabled: true, email_2_delay_days: 7, email_2_subject: "Avem ceva special pentru tine", email_2_discount_percent: 10, email_2_discount_validity_days: 7,
    email_3_enabled: true, email_3_delay_days: 14, email_3_subject: "Ultima noastră ofertă pentru tine", email_3_discount_percent: 15, email_3_free_shipping: true,
  });

  const [pushForm, setPushForm] = useState({ title: "", body: "", url: "/", target: "all", target_group_id: "" });

  const load = async () => {
    setLoading(true);
    const [c, e, p, g] = await Promise.all([
      (supabase as any).from("winback_campaigns").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("winback_enrollments").select("*").order("created_at", { ascending: false }).limit(200),
      (supabase as any).from("push_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("customer_groups").select("id, name"),
    ]);
    setCampaigns(c.data || []);
    setEnrollments(e.data || []);
    setPushCampaigns(p.data || []);
    setGroups(g.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Stats
  const totalContacted = enrollments.length;
  const converted = enrollments.filter((e: any) => e.converted).length;
  const convRate = totalContacted > 0 ? ((converted / totalContacted) * 100).toFixed(1) : "0";
  const revenueRecovered = enrollments.reduce((s: number, e: any) => s + Number(e.revenue || 0), 0);

  // Segments
  const atRisk = enrollments.filter((e: any) => e.status === "active" && !e.email_2_sent_at).length;
  const lost = enrollments.filter((e: any) => e.status === "lost").length;
  const recovered = enrollments.filter((e: any) => e.converted).length;

  const handleCreateCampaign = async () => {
    if (!form.name) return;
    const payload: any = { ...form };
    if (!payload.target_group_id) delete payload.target_group_id;
    const { error } = await (supabase as any).from("winback_campaigns").insert(payload);
    if (error) { toast({ title: "Eroare", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Campanie win-back creată" });
    setDialogOpen(false);
    load();
  };

  const toggleCampaign = async (id: string, active: boolean) => {
    await (supabase as any).from("winback_campaigns").update({ is_active: !active }).eq("id", id);
    load();
  };

  const handleSendPush = async () => {
    if (!pushForm.title || !pushForm.body) return;
    const payload: any = { ...pushForm, status: "sent", sent_at: new Date().toISOString() };
    if (!payload.target_group_id) delete payload.target_group_id;
    const { error } = await (supabase as any).from("push_campaigns").insert(payload);
    if (error) { toast({ title: "Eroare", description: error.message, variant: "destructive" }); return; }

    // Trigger actual push via edge function for all users
    try {
      const { data: subs } = await (supabase as any).from("push_subscriptions").select("user_id").limit(500);
      if (subs?.length) {
        const uniqueUsers = [...new Set(subs.map((s: any) => s.user_id))];
        for (const uid of uniqueUsers.slice(0, 100)) {
          supabase.functions.invoke("send-push", { body: { user_id: uid, title: pushForm.title, body: pushForm.body, url: pushForm.url, event_type: "campaign" } });
        }
      }
    } catch {}

    toast({ title: "Push notification trimis" });
    setPushDialogOpen(false);
    setPushForm({ title: "", body: "", url: "/", target: "all", target_group_id: "" });
    load();
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Target className="w-5 h-5" /> Retargetare & Win-Back</h1>
          <p className="text-sm text-muted-foreground">Campanii de reactivare clienți, push notifications, SMS marketing.</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalContacted}</p><p className="text-xs text-muted-foreground">Clienți contactați</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{convRate}%</p><p className="text-xs text-muted-foreground">Rată conversie</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{recovered}</p><p className="text-xs text-muted-foreground">Clienți recuperați</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{revenueRecovered.toFixed(0)} RON</p><p className="text-xs text-muted-foreground">Venit recuperat</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campanii Win-Back</TabsTrigger>
          <TabsTrigger value="segments">Segmente</TabsTrigger>
          <TabsTrigger value="push">Push Notifications</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        {/* ═══ CAMPAIGNS ═══ */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Campanie nouă</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Campanie</TableHead><TableHead>Trigger</TableHead><TableHead>Segment</TableHead><TableHead>Înrolați</TableHead><TableHead>Conversii</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nicio campanie win-back.</TableCell></TableRow>
                  ) : campaigns.map((c: any) => {
                    const enrolled = enrollments.filter((e: any) => e.campaign_id === c.id).length;
                    const conv = enrollments.filter((e: any) => e.campaign_id === c.id && e.converted).length;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.trigger_days} zile inactivitate</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{c.target_segment}</Badge></TableCell>
                        <TableCell>{enrolled}</TableCell>
                        <TableCell>{conv}</TableCell>
                        <TableCell>
                          <Badge className={c.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                            {c.is_active ? "Activ" : "Inactiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => toggleCampaign(c.id, c.is_active)}>
                            {c.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SEGMENTS ═══ */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserX className="w-4 h-4 text-orange-500" />Clienți în pericol</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{atRisk}</p>
                <p className="text-xs text-muted-foreground mt-1">Inactivi 30-60 zile, email 1 trimis</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs">Lansează campanie</Button>
                  <Button size="sm" variant="ghost" className="text-xs">Export CSV</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-destructive" />Clienți pierduți</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{lost}</p>
                <p className="text-xs text-muted-foreground mt-1">Inactivi 60-120 zile, secvență completă</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="ghost" className="text-xs">Export pentru Facebook Ads</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" />Clienți recuperați</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{recovered}</p>
                <p className="text-xs text-muted-foreground mt-1">Au cumpărat după win-back</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="ghost" className="text-xs">Export CSV</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ PUSH NOTIFICATIONS ═══ */}
        <TabsContent value="push" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setPushDialogOpen(true)}><Bell className="w-4 h-4 mr-1" /> Trimite push</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Titlu</TableHead><TableHead>Destinatari</TableHead><TableHead>Trimise</TableHead><TableHead>Click-uri</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pushCampaigns.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nicio campanie push.</TableCell></TableRow>
                  ) : pushCampaigns.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.title}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{p.target}</Badge></TableCell>
                      <TableCell>{p.sent_count}</TableCell>
                      <TableCell>{p.clicked_count}</TableCell>
                      <TableCell className="text-xs">{p.sent_at ? format(new Date(p.sent_at), "dd.MM.yyyy HH:mm") : "-"}</TableCell>
                      <TableCell><Badge className="bg-primary/10 text-primary text-[10px]">{p.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Setări Push Permission</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <PushSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SMS ═══ */}
        <TabsContent value="sms" className="space-y-4">
          <SMSTab />
        </TabsContent>
      </Tabs>

      {/* ═══ Create Campaign Dialog ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Campanie Win-Back nouă</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nume campanie</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Reactivare Q1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Trigger (zile inactivitate)</Label>
                <Select value={String(form.trigger_days)} onValueChange={v => setForm({ ...form, trigger_days: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[30, 60, 90, 120, 180].map(d => <SelectItem key={d} value={String(d)}>{d} zile</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Segment țintă</Label>
                <Select value={form.target_segment} onValueChange={v => setForm({ ...form, target_segment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toți inactivii</SelectItem>
                    <SelectItem value="abc_a">Clasa A</SelectItem>
                    <SelectItem value="abc_b">Clasa B</SelectItem>
                    <SelectItem value="abc_c">Clasa C</SelectItem>
                    <SelectItem value="group">Grup specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.target_segment === "group" && groups.length > 0 && (
              <div>
                <Label className="text-xs">Grup</Label>
                <Select value={form.target_group_id} onValueChange={v => setForm({ ...form, target_group_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Alege grup" /></SelectTrigger>
                  <SelectContent>
                    {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <h4 className="font-semibold text-sm pt-2">Email 1 — Reminder</h4>
            <div className="flex items-center justify-between"><Label className="text-xs">Activat</Label><Switch checked={form.email_1_enabled} onCheckedChange={v => setForm({ ...form, email_1_enabled: v })} /></div>
            <div><Label className="text-xs">Subject</Label><Input value={form.email_1_subject} onChange={e => setForm({ ...form, email_1_subject: e.target.value })} /></div>

            <h4 className="font-semibold text-sm pt-2">Email 2 — Cu discount</h4>
            <div className="flex items-center justify-between"><Label className="text-xs">Activat</Label><Switch checked={form.email_2_enabled} onCheckedChange={v => setForm({ ...form, email_2_enabled: v })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Delay (zile)</Label><Input type="number" value={form.email_2_delay_days} onChange={e => setForm({ ...form, email_2_delay_days: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Discount %</Label><Input type="number" value={form.email_2_discount_percent} onChange={e => setForm({ ...form, email_2_discount_percent: Number(e.target.value) })} /></div>
            </div>

            <h4 className="font-semibold text-sm pt-2">Email 3 — Ultimă tentativă</h4>
            <div className="flex items-center justify-between"><Label className="text-xs">Activat</Label><Switch checked={form.email_3_enabled} onCheckedChange={v => setForm({ ...form, email_3_enabled: v })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Delay (zile)</Label><Input type="number" value={form.email_3_delay_days} onChange={e => setForm({ ...form, email_3_delay_days: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Discount %</Label><Input type="number" value={form.email_3_discount_percent} onChange={e => setForm({ ...form, email_3_discount_percent: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center justify-between"><Label className="text-xs">Transport gratuit (Email 3)</Label><Switch checked={form.email_3_free_shipping} onCheckedChange={v => setForm({ ...form, email_3_free_shipping: v })} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreateCampaign}>Creează campanie</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Push Dialog ═══ */}
      <Dialog open={pushDialogOpen} onOpenChange={setPushDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Trimite Push Notification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Titlu</Label><Input value={pushForm.title} onChange={e => setPushForm({ ...pushForm, title: e.target.value })} placeholder="Promoție nouă!" /></div>
            <div><Label className="text-xs">Mesaj</Label><Textarea value={pushForm.body} onChange={e => setPushForm({ ...pushForm, body: e.target.value })} rows={3} placeholder="Descriere notificare..." /></div>
            <div><Label className="text-xs">Link (URL)</Label><Input value={pushForm.url} onChange={e => setPushForm({ ...pushForm, url: e.target.value })} placeholder="/" /></div>
            <div>
              <Label className="text-xs">Destinatari</Label>
              <Select value={pushForm.target} onValueChange={v => setPushForm({ ...pushForm, target: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți abonații</SelectItem>
                  {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSendPush}><Send className="w-4 h-4 mr-1" /> Trimite acum</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══ Push Settings sub-component ═══ */
function PushSettings() {
  const [settings, setSettings] = useState({
    push_permission_delay_seconds: 10,
    push_permission_text: "Activează notificările pentru oferte exclusive!",
    push_abandoned_cart: true,
    push_new_promo: true,
    push_back_in_stock: true,
    push_order_shipped: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "push_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings(s => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "push_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast({ title: "Setări push salvate" });
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Delay cerere permisiune (secunde)</Label>
        <Input type="number" value={settings.push_permission_delay_seconds} onChange={e => setSettings(s => ({ ...s, push_permission_delay_seconds: Number(e.target.value) }))} className="w-24 mt-1" />
      </div>
      <div>
        <Label className="text-xs">Text cerere permisiune</Label>
        <Input value={settings.push_permission_text} onChange={e => setSettings(s => ({ ...s, push_permission_text: e.target.value }))} className="mt-1" />
      </div>
      <h4 className="font-semibold text-xs pt-2">Triggere automate</h4>
      {[
        { key: "push_abandoned_cart", label: "Coș abandonat" },
        { key: "push_new_promo", label: "Promoție nouă" },
        { key: "push_back_in_stock", label: "Produs reapărut în stoc" },
        { key: "push_order_shipped", label: "Comandă expediată" },
      ].map(item => (
        <div key={item.key} className="flex items-center justify-between">
          <Label className="text-xs">{item.label}</Label>
          <Switch checked={(settings as any)[item.key]} onCheckedChange={() => setSettings(s => ({ ...s, [item.key]: !(s as any)[item.key] }))} />
        </div>
      ))}
      <Button size="sm" onClick={save} disabled={saving}>Salvează setări push</Button>
    </div>
  );
}

/* ═══ SMS Tab sub-component ═══ */
function SMSTab() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", message: "", trigger_type: "manual" });
  const [smsSettings, setSmsSettings] = useState({ provider: "twilio", api_key: "", sender_name: "MamaLucica" });
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    (supabase as any).from("sms_campaigns").select("*").order("created_at", { ascending: false })
      .then(({ data }: any) => { setCampaigns(data || []); setLoading(false); });
    supabase.from("app_settings").select("value_json").eq("key", "sms_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSmsSettings(s => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.message) return;
    await (supabase as any).from("sms_campaigns").insert({ name: form.name, message: form.message, trigger_type: form.trigger_type });
    toast({ title: "Campanie SMS creată" });
    setDialogOpen(false);
    setForm({ name: "", message: "", trigger_type: "manual" });
    const { data } = await (supabase as any).from("sms_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data || []);
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    await supabase.from("app_settings").upsert({ key: "sms_settings", value_json: smsSettings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast({ title: "Setări SMS salvate" });
    setSettingsSaving(false);
  };

  const totalSent = campaigns.reduce((s: number, c: any) => s + (c.sent_count || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium flex items-center gap-2"><Smartphone className="w-4 h-4" /> Campanii SMS</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Campanie nouă</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalSent}</p><p className="text-xs text-muted-foreground">SMS-uri trimise</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{campaigns.length}</p><p className="text-xs text-muted-foreground">Campanii totale</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Campanie</TableHead><TableHead>Trigger</TableHead><TableHead>Trimise</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nicio campanie SMS.</TableCell></TableRow>
                ) : campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{c.trigger_type || "manual"}</Badge></TableCell>
                    <TableCell>{c.sent_count}</TableCell>
                    <TableCell><Badge className={c.status === "sent" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Setări SMS Provider</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-xs">Provider</Label>
            <Select value={smsSettings.provider} onValueChange={v => setSmsSettings(s => ({ ...s, provider: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="smso">SMS.ro</SelectItem>
                <SelectItem value="sendsms">SendSMS.ro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">API Key</Label><Input type="password" value={smsSettings.api_key} onChange={e => setSmsSettings(s => ({ ...s, api_key: e.target.value }))} className="mt-1" /></div>
          <div><Label className="text-xs">Sender Name</Label><Input value={smsSettings.sender_name} onChange={e => setSmsSettings(s => ({ ...s, sender_name: e.target.value }))} className="mt-1" /></div>
          <Button size="sm" onClick={saveSettings} disabled={settingsSaving}>Salvează setări</Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Campanie SMS nouă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nume</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Trigger</Label>
              <Select value={form.trigger_type} onValueChange={v => setForm({ ...form, trigger_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="abandoned_cart">Coș abandonat</SelectItem>
                  <SelectItem value="winback">Reactivare client</SelectItem>
                  <SelectItem value="flash_promo">Promoție flash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mesaj (max 160)</Label>
              <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} maxLength={160} rows={3} />
              <p className="text-xs text-muted-foreground mt-1">{form.message.length}/160</p>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Creează</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
