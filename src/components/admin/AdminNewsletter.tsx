import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Send, Trash2, Users, Mail, Plus, Download, Upload, Eye, Smartphone, Monitor, Copy, Search, Settings, BarChart3, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminNewsletter() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("subscribers");
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Campaign form
  const [cf, setCf] = useState({
    subject: "", preview_text: "", sender_name: "", sender_email: "",
    content: "", target_segment: "all", target_groups: [] as string[],
    scheduled_at: "", blocks: [] as any[],
  });
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // Group form
  const [gf, setGf] = useState({ name: "", description: "", auto_sync_customer_group_id: "" });

  // Newsletter settings
  const [ns, setNs] = useState({
    popup_enabled: false, popup_delay: 5, popup_title: "Abonează-te!", popup_subtitle: "Primește oferte exclusive pe email.",
    popup_image: "", popup_offer: "10% reducere la prima comandă", popup_max_dismissals: 3,
    checkout_optin: true, checkout_prechecked: false,
    auto_subscribe_on_register: false, double_optin: true,
  });

  const { data: subscribers = [], isLoading: loadingSubs } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns = [], isLoading: loadingCamps } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["newsletter-groups"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("newsletter_groups").select("*").order("name");
      return data || [];
    },
  });

  const { data: customerGroups = [] } = useQuery({
    queryKey: ["customer-groups-for-newsletter"],
    queryFn: async () => {
      const { data } = await supabase.from("customer_groups").select("id, name");
      return data || [];
    },
  });

  // Load settings
  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "newsletter_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setNs(s => ({ ...s, ...(data.value_json as any) })); });
  }, []);

  // Filtered subscribers
  const filtered = subscribers.filter((s: any) => {
    if (filterStatus === "active" && !s.is_active) return false;
    if (filterStatus === "unsubscribed" && s.is_active) return false;
    if (filterSource !== "all" && s.source !== filterSource) return false;
    if (searchQuery && !s.email.toLowerCase().includes(searchQuery.toLowerCase()) && !(s.name || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeCount = subscribers.filter((s: any) => s.is_active).length;

  // Mutations
  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("newsletter_subscribers").delete().eq("id", id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] }); toast.success("Abonat eliminat"); },
  });

  const sendCampaign = useMutation({
    mutationFn: async () => {
      if (!cf.subject.trim() || !cf.content.trim()) throw new Error("Completează subiectul și conținutul");
      const payload: any = {
        subject: cf.subject, content: cf.content, preview_text: cf.preview_text,
        sender_name: cf.sender_name, sender_email: cf.sender_email,
        target_groups: cf.target_groups, target_segment: cf.target_segment,
        blocks: cf.blocks,
        status: cf.scheduled_at ? "scheduled" : "sending",
        scheduled_at: cf.scheduled_at || null,
      };
      const { data: campaign, error: campError } = await supabase.from("newsletter_campaigns").insert(payload).select().single();
      if (campError) throw campError;

      if (!cf.scheduled_at) {
        await supabase.functions.invoke("send-newsletter", {
          body: { campaignId: campaign.id, subject: cf.subject, content: cf.content },
        });
      }
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setCampaignOpen(false);
      setCf({ subject: "", preview_text: "", sender_name: "", sender_email: "", content: "", target_segment: "all", target_groups: [], scheduled_at: "", blocks: [] });
      toast.success(cf.scheduled_at ? "Campanie programată!" : "Campania a fost trimisă!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSendTest = async () => {
    if (!cf.subject || !cf.content) { toast.error("Completează subiectul și conținutul"); return; }
    const testEmail = prompt("Email pentru test:");
    if (!testEmail) return;
    await supabase.functions.invoke("send-email", {
      body: { to: testEmail, subject: `[TEST] ${cf.subject}`, html: cf.content, type: "newsletter_test" },
    });
    toast.success("Email test trimis!");
  };

  // Export CSV
  const exportCSV = () => {
    const rows = filtered.map((s: any) => `${s.email},${s.name || ""},${s.source || ""},${s.is_active ? "abonat" : "dezabonat"},${s.subscribed_at}`);
    const csv = "email,name,source,status,subscribed_at\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "newsletter_subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1).filter(l => l.trim());
    let imported = 0;
    for (const line of lines) {
      const [email, name] = line.split(",").map(s => s.trim());
      if (email && email.includes("@")) {
        const { error } = await supabase.from("newsletter_subscribers").upsert(
          { email, name: name || null, source: "import", consent_at: new Date().toISOString() } as any,
          { onConflict: "email" }
        );
        if (!error) imported++;
      }
    }
    toast.success(`${imported} abonați importați`);
    queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Bulk actions
  const bulkUnsubscribe = async () => {
    for (const id of selectedIds) {
      await supabase.from("newsletter_subscribers").update({ is_active: false, unsubscribed_at: new Date().toISOString() } as any).eq("id", id);
    }
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
    toast.success("Abonați dezabonați");
  };

  const bulkDelete = async () => {
    if (!confirm(`Șterge ${selectedIds.length} abonați?`)) return;
    for (const id of selectedIds) { await supabase.from("newsletter_subscribers").delete().eq("id", id); }
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
    toast.success("Abonați șterși");
  };

  const bulkAddToGroup = async (groupName: string) => {
    for (const id of selectedIds) {
      const sub = subscribers.find((s: any) => s.id === id);
      if (sub) {
        const currentGroups = (sub as any).groups || [];
        if (!currentGroups.includes(groupName)) {
          await supabase.from("newsletter_subscribers").update({ groups: [...currentGroups, groupName] } as any).eq("id", id);
        }
      }
    }
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
    toast.success(`Adăugați la grupul "${groupName}"`);
  };

  // Save group
  const saveGroup = async () => {
    if (!gf.name) return;
    const payload: any = { name: gf.name, description: gf.description };
    if (gf.auto_sync_customer_group_id) payload.auto_sync_customer_group_id = gf.auto_sync_customer_group_id;
    await (supabase as any).from("newsletter_groups").insert(payload);
    toast.success("Grup creat");
    setGroupDialogOpen(false);
    setGf({ name: "", description: "", auto_sync_customer_group_id: "" });
    queryClient.invalidateQueries({ queryKey: ["newsletter-groups"] });
  };

  // Save settings
  const saveSettings = async () => {
    await supabase.from("app_settings").upsert({ key: "newsletter_settings", value_json: ns as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast.success("Setări salvate");
    setSettingsOpen(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((s: any) => s.id));
  };

  const duplicateCampaign = (c: any) => {
    setCf({ subject: c.subject, preview_text: c.preview_text || "", sender_name: c.sender_name || "", sender_email: c.sender_email || "", content: c.content || "", target_segment: c.target_segment || "all", target_groups: c.target_groups || [], scheduled_at: "", blocks: c.blocks || [] });
    setCampaignOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Mail className="w-5 h-5" /> Email Marketing & Newsletter</h1>
          <p className="text-sm text-muted-foreground">Gestionare abonați, campanii email, grupuri.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}><Settings className="w-4 h-4 mr-1" /> Setări</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">Abonați activi</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{campaigns.length}</p><p className="text-xs text-muted-foreground">Campanii</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{campaigns.reduce((s: number, c: any) => s + (c.open_count || 0), 0)}</p><p className="text-xs text-muted-foreground">Total deschideri</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{groups.length}</p><p className="text-xs text-muted-foreground">Grupuri</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="subscribers"><Users className="w-4 h-4 mr-1" />Abonați ({activeCount})</TabsTrigger>
          <TabsTrigger value="campaigns"><Mail className="w-4 h-4 mr-1" />Campanii</TabsTrigger>
          <TabsTrigger value="groups">Grupuri</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 mr-1" />Statistici</TabsTrigger>
        </TabsList>

        {/* ═══ SUBSCRIBERS ═══ */}
        <TabsContent value="subscribers" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Caută email / nume..." className="pl-8" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="active">Activi</SelectItem>
                <SelectItem value="unsubscribed">Dezabonați</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate sursele</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
                <SelectItem value="popup">Popup</SelectItem>
                <SelectItem value="checkout">Checkout</SelectItem>
                <SelectItem value="import">Import</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-1" />Import CSV</Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex gap-2 items-center bg-muted/50 rounded-lg p-2">
              <span className="text-sm font-medium">{selectedIds.length} selectați</span>
              <Button size="sm" variant="outline" onClick={bulkUnsubscribe}>Dezabonează</Button>
              <Button size="sm" variant="destructive" onClick={bulkDelete}>Șterge</Button>
              {groups.length > 0 && (
                <Select onValueChange={v => bulkAddToGroup(v)}>
                  <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Adaugă la grup" /></SelectTrigger>
                  <SelectContent>{groups.map((g: any) => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {loadingSubs ? <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-10"><Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                    <TableHead>Email</TableHead><TableHead>Nume</TableHead><TableHead>Sursă</TableHead><TableHead>Grupuri</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Niciun abonat.</TableCell></TableRow>
                    ) : filtered.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell><Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])} /></TableCell>
                        <TableCell className="font-medium text-sm">{s.email}</TableCell>
                        <TableCell className="text-sm">{s.name || "-"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{s.source || "footer"}</Badge></TableCell>
                        <TableCell>{((s as any).groups || []).map((g: string) => <Badge key={g} variant="secondary" className="text-[10px] mr-1">{g}</Badge>)}</TableCell>
                        <TableCell className="text-xs">{format(new Date(s.subscribed_at), "dd.MM.yyyy", { locale: ro })}</TableCell>
                        <TableCell><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Activ" : "Dezabonat"}</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => { if (confirm("Elimini abonat?")) deleteSub.mutate(s.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ CAMPAIGNS ═══ */}
        <TabsContent value="campaigns" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCampaignOpen(true)}><Send className="w-4 h-4 mr-1" /> Campanie nouă</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingCamps ? <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Subiect</TableHead><TableHead>Destinatari</TableHead><TableHead>Deschideri</TableHead><TableHead>Click-uri</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {campaigns.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nicio campanie.</TableCell></TableRow>
                    ) : campaigns.map((c: any) => {
                      const openRate = c.recipient_count > 0 ? ((c.open_count || 0) / c.recipient_count * 100).toFixed(1) : "0";
                      const ctr = c.recipient_count > 0 ? ((c.click_count || 0) / c.recipient_count * 100).toFixed(1) : "0";
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-sm">{c.subject}</TableCell>
                          <TableCell>{c.recipient_count || 0}</TableCell>
                          <TableCell>{c.open_count || 0} ({openRate}%)</TableCell>
                          <TableCell>{c.click_count || 0} ({ctr}%)</TableCell>
                          <TableCell className="text-xs">{format(new Date(c.created_at), "dd.MM.yyyy HH:mm", { locale: ro })}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "sent" ? "default" : c.status === "scheduled" ? "secondary" : "outline"}>
                              {c.status === "sent" ? "Trimis" : c.status === "sending" ? "Se trimite" : c.status === "scheduled" ? "Programat" : "Ciornă"}
                            </Badge>
                          </TableCell>
                          <TableCell><Button variant="ghost" size="icon" title="Duplică" onClick={() => duplicateCampaign(c)}><Copy className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ GROUPS ═══ */}
        <TabsContent value="groups" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setGroupDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Grup nou</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {groups.map((g: any) => (
              <Card key={g.id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm">{g.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{g.description || "Fără descriere"}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline">{g.member_count || 0} membri</Badge>
                    {g.auto_sync_customer_group_id && <Badge variant="secondary" className="text-[10px]">Auto-sync</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {groups.length === 0 && <p className="text-sm text-muted-foreground col-span-3 text-center py-8">Niciun grup creat.</p>}
          </div>
        </TabsContent>

        {/* ═══ STATS ═══ */}
        <TabsContent value="stats" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.filter((c: any) => c.status === "sent").slice(0, 6).map((c: any) => {
              const openRate = c.recipient_count > 0 ? ((c.open_count || 0) / c.recipient_count * 100).toFixed(1) : "0";
              const ctr = c.recipient_count > 0 ? ((c.click_count || 0) / c.recipient_count * 100).toFixed(1) : "0";
              return (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm truncate">{c.subject}</h3>
                    <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), "dd MMM yyyy", { locale: ro })}</p>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <div className="text-center"><p className="text-lg font-bold">{c.recipient_count || 0}</p><p className="text-[10px] text-muted-foreground">Trimiși</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-primary">{openRate}%</p><p className="text-[10px] text-muted-foreground">Open rate</p></div>
                      <div className="text-center"><p className="text-lg font-bold">{ctr}%</p><p className="text-[10px] text-muted-foreground">CTR</p></div>
                      <div className="text-center"><p className="text-lg font-bold">{c.unsubscribe_count || 0}</p><p className="text-[10px] text-muted-foreground">Dezab.</p></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {campaigns.filter((c: any) => c.status === "sent").length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nicio campanie trimisă încă.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Campaign Dialog ═══ */}
      <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Campanie Newsletter</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Subiect *</Label><Input value={cf.subject} onChange={e => setCf({ ...cf, subject: e.target.value })} placeholder="Oferte speciale!" /></div>
              <div><Label className="text-xs">Preview text</Label><Input value={cf.preview_text} onChange={e => setCf({ ...cf, preview_text: e.target.value })} placeholder="Text preview inbox..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Sender name</Label><Input value={cf.sender_name} onChange={e => setCf({ ...cf, sender_name: e.target.value })} placeholder="MamaLucica" /></div>
              <div><Label className="text-xs">Sender email</Label><Input value={cf.sender_email} onChange={e => setCf({ ...cf, sender_email: e.target.value })} placeholder="news@ventuza.ro" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Destinatari</Label>
                <Select value={cf.target_segment} onValueChange={v => setCf({ ...cf, target_segment: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toți abonații ({activeCount})</SelectItem>
                    <SelectItem value="groups">Grupuri specifice</SelectItem>
                    <SelectItem value="active_customers">Clienți activi</SelectItem>
                    <SelectItem value="inactive_customers">Clienți inactivi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Programează (opțional)</Label>
                <Input type="datetime-local" value={cf.scheduled_at} onChange={e => setCf({ ...cf, scheduled_at: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Conținut email (HTML)</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant={previewMode === "desktop" ? "default" : "ghost"} onClick={() => setPreviewMode("desktop")}><Monitor className="w-3 h-3" /></Button>
                  <Button size="sm" variant={previewMode === "mobile" ? "default" : "ghost"} onClick={() => setPreviewMode("mobile")}><Smartphone className="w-3 h-3" /></Button>
                </div>
              </div>
              <Textarea value={cf.content} onChange={e => setCf({ ...cf, content: e.target.value })} rows={10} placeholder="<h1>Bună {{nume_client}}!</h1>..." />
              <p className="text-xs text-muted-foreground mt-1">Variabile: {"{{nume_client}}"}, {"{{email}}"}, {"{{link_dezabonare}}"}</p>
            </div>

            {cf.content && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs">Preview {previewMode}</CardTitle></CardHeader>
                <CardContent>
                  <div className={`border rounded bg-white p-4 mx-auto ${previewMode === "mobile" ? "max-w-[375px]" : "max-w-full"}`}>
                    <div dangerouslySetInnerHTML={{ __html: cf.content.replace(/\{\{nume_client\}\}/g, "Ion Popescu").replace(/\{\{email\}\}/g, "ion@test.ro").replace(/\{\{link_dezabonare\}\}/g, "#") }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleSendTest}><Eye className="w-4 h-4 mr-1" /> Trimite test</Button>
            <Button onClick={() => sendCampaign.mutate()} disabled={sendCampaign.isPending}>
              {sendCampaign.isPending ? "Se trimite..." : cf.scheduled_at ? "Programează" : `Trimite acum`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Group Dialog ═══ */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grup Newsletter nou</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nume grup</Label><Input value={gf.name} onChange={e => setGf({ ...gf, name: e.target.value })} placeholder="Ex: Clienți VIP" /></div>
            <div><Label className="text-xs">Descriere</Label><Input value={gf.description} onChange={e => setGf({ ...gf, description: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Auto-sync cu grup clienți (opțional)</Label>
              <Select value={gf.auto_sync_customer_group_id} onValueChange={v => setGf({ ...gf, auto_sync_customer_group_id: v })}>
                <SelectTrigger><SelectValue placeholder="Nu sincroniza" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Fără auto-sync</SelectItem>
                  {customerGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={saveGroup}>Creează grup</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Settings Dialog ═══ */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Setări Newsletter</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Popup Newsletter</h4>
            <div className="flex items-center justify-between"><Label className="text-xs">Popup activat</Label><Switch checked={ns.popup_enabled} onCheckedChange={v => setNs({ ...ns, popup_enabled: v })} /></div>
            {ns.popup_enabled && <>
              <div><Label className="text-xs">Delay (secunde)</Label><Input type="number" value={ns.popup_delay} onChange={e => setNs({ ...ns, popup_delay: Number(e.target.value) })} className="w-24" /></div>
              <div><Label className="text-xs">Titlu</Label><Input value={ns.popup_title} onChange={e => setNs({ ...ns, popup_title: e.target.value })} /></div>
              <div><Label className="text-xs">Subtitlu</Label><Input value={ns.popup_subtitle} onChange={e => setNs({ ...ns, popup_subtitle: e.target.value })} /></div>
              <div><Label className="text-xs">Ofertă (ex: "10% reducere")</Label><Input value={ns.popup_offer} onChange={e => setNs({ ...ns, popup_offer: e.target.value })} /></div>
              <div><Label className="text-xs">Max închideri înainte de a nu mai afișa</Label><Input type="number" value={ns.popup_max_dismissals} onChange={e => setNs({ ...ns, popup_max_dismissals: Number(e.target.value) })} className="w-24" /></div>
            </>}

            <h4 className="font-semibold text-sm pt-2">Checkout</h4>
            <div className="flex items-center justify-between"><Label className="text-xs">Checkbox opt-in la checkout</Label><Switch checked={ns.checkout_optin} onCheckedChange={v => setNs({ ...ns, checkout_optin: v })} /></div>
            <div className="flex items-center justify-between"><Label className="text-xs">Pre-bifat</Label><Switch checked={ns.checkout_prechecked} onCheckedChange={v => setNs({ ...ns, checkout_prechecked: v })} /></div>

            <h4 className="font-semibold text-sm pt-2">General</h4>
            <div className="flex items-center justify-between"><Label className="text-xs">Auto-abonare la înregistrare</Label><Switch checked={ns.auto_subscribe_on_register} onCheckedChange={v => setNs({ ...ns, auto_subscribe_on_register: v })} /></div>
            <div className="flex items-center justify-between"><Label className="text-xs">Double opt-in (email confirmare)</Label><Switch checked={ns.double_optin} onCheckedChange={v => setNs({ ...ns, double_optin: v })} /></div>
          </div>
          <DialogFooter><Button onClick={saveSettings}>Salvează setări</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
