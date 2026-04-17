import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, MessageCircle, Save, Plus, Trash2, Eye, Download, BarChart3, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

// ─── Types ───
interface ChatbotSettings {
  id: string;
  enabled: boolean;
  assistant_name: string;
  avatar_url: string | null;
  widget_color: string;
  welcome_message: string;
  offline_message: string;
  schedule_type: string;
  schedule_hours: any;
  features_enabled: any;
  auto_escalate_after_messages: number;
  escalate_on_negative_sentiment: boolean;
  escalate_keywords: string;
}

interface Session {
  id: string;
  customer_email: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  satisfaction_rating: number | null;
  messages_count: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  sort_order: number;
}

const DEFAULTS: ChatbotSettings = {
  id: "",
  enabled: true,
  assistant_name: "Asistent",
  avatar_url: null,
  widget_color: "#6366f1",
  welcome_message: "Bună! Sunt asistentul virtual al magazinului. Cum te pot ajuta astăzi?",
  offline_message: "Momentan suntem offline. Lasă-ne un mesaj și te contactăm în cel mai scurt timp!",
  schedule_type: "24h",
  schedule_hours: {},
  features_enabled: { order_tracking: true, order_cancel: true, return_init: true, invoice_download: true, address_update: false, product_recommendations: true, faq: true },
  auto_escalate_after_messages: 3,
  escalate_on_negative_sentiment: false,
  escalate_keywords: "reclamație, plângere, avocat, ANPC",
};

const FEATURE_LABELS: Record<string, string> = {
  order_tracking: "Urmărire comenzi",
  order_cancel: "Anulare comenzi",
  return_init: "Inițiere retur",
  invoice_download: "Descărcare factură",
  address_update: "Modificare adresă livrare",
  product_recommendations: "Recomandări produse",
  faq: "Informații generale / FAQ",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  resolved: "bg-blue-100 text-blue-800",
  escalated: "bg-red-100 text-red-800",
};

export default function AdminChatBot() {
  const [tab, setTab] = useState("conversations");
  const [settings, setSettings] = useState<ChatbotSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<any[]>([]);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "general" });

  // Stats
  const [stats, setStats] = useState({ total: 0, resolved: 0, escalated: 0, avgMessages: 0, satisfied: 0, dissatisfied: 0 });

  useEffect(() => {
    loadSettings();
    loadSessions();
    loadFaqs();
    loadStats();
  }, []);

  const loadSettings = async () => {
    const { data } = await (supabase.from("chatbot_settings" as any).select("*").limit(1).maybeSingle() as any);
    if (data) setSettings(data);
  };

  const loadSessions = async () => {
    const { data } = await (supabase.from("chatbot_sessions" as any).select("*").order("started_at", { ascending: false }).limit(100) as any);
    if (data) setSessions(data);
  };

  const loadFaqs = async () => {
    const { data } = await (supabase.from("chatbot_faq" as any).select("*").order("sort_order") as any);
    if (data) setFaqs(data);
  };

  const loadStats = async () => {
    const { data } = await (supabase.from("chatbot_sessions" as any).select("status, satisfaction_rating, messages_count") as any);
    if (data) {
      const total = data.length;
      const resolved = data.filter((s: any) => s.status === "resolved").length;
      const escalated = data.filter((s: any) => s.status === "escalated").length;
      const avgMessages = total > 0 ? Math.round(data.reduce((a: number, s: any) => a + (s.messages_count || 0), 0) / total) : 0;
      const satisfied = data.filter((s: any) => s.satisfaction_rating === 1).length;
      const dissatisfied = data.filter((s: any) => s.satisfaction_rating === -1).length;
      setStats({ total, resolved, escalated, avgMessages, satisfied, dissatisfied });
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    const { id, ...rest } = settings;
    await (supabase.from("chatbot_settings" as any).update({ ...rest, updated_at: new Date().toISOString() } as any).eq("id", id) as any);
    toast.success("Setări ChatBot salvate!");
    setSaving(false);
  };

  const viewSession = async (sessionId: string) => {
    setSelectedSession(sessionId);
    const { data } = await (supabase.from("chatbot_messages" as any).select("*").eq("session_id", sessionId).order("created_at") as any);
    setSessionMessages(data || []);
  };

  const markResolved = async (sessionId: string) => {
    await (supabase.from("chatbot_sessions" as any).update({ status: "resolved", ended_at: new Date().toISOString() } as any).eq("id", sessionId) as any);
    loadSessions();
    toast.success("Sesiune marcată ca rezolvată");
  };

  const addFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return toast.error("Completează întrebarea și răspunsul");
    await (supabase.from("chatbot_faq" as any).insert({ ...newFaq, sort_order: faqs.length } as any) as any);
    setNewFaq({ question: "", answer: "", category: "general" });
    loadFaqs();
    toast.success("FAQ adăugat!");
  };

  const deleteFaq = async (id: string) => {
    await (supabase.from("chatbot_faq" as any).delete().eq("id", id) as any);
    loadFaqs();
    toast.success("FAQ șters");
  };

  const toggleFaq = async (id: string, active: boolean) => {
    await (supabase.from("chatbot_faq" as any).update({ active } as any).eq("id", id) as any);
    loadFaqs();
  };

  const exportCSV = () => {
    const headers = ["ID", "Client", "Data", "Mesaje", "Status", "Rating"];
    const rows = sessions.map(s => [s.id.slice(0, 8), s.customer_email || "Guest", new Date(s.started_at).toLocaleDateString("ro-RO"), s.messages_count, s.status, s.satisfaction_rating ?? "-"]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "chatbot_sessions.csv"; a.click();
  };

  const set = (k: keyof ChatbotSettings, v: any) => setSettings(s => ({ ...s, [k]: v }));
  const setFeature = (k: string, v: boolean) => setSettings(s => ({ ...s, features_enabled: { ...s.features_enabled, [k]: v } }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Bot className="w-5 h-5" /> ChatBot AI — Suport Clienți</h1>
          <p className="text-sm text-muted-foreground">Gestionează chatbot-ul, conversațiile, FAQ-urile și statisticile.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="conversations">Conversații ({sessions.length})</TabsTrigger>
          <TabsTrigger value="config">Configurare</TabsTrigger>
          <TabsTrigger value="faq">FAQ / Răspunsuri</TabsTrigger>
          <TabsTrigger value="stats">Statistici</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: CONVERSAȚII ─── */}
        <TabsContent value="conversations" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Mesaje</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nicio conversație încă</TableCell></TableRow>
                  )}
                  {sessions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{new Date(s.started_at).toLocaleString("ro-RO")}</TableCell>
                      <TableCell className="text-sm">{s.customer_email || "Guest"}</TableCell>
                      <TableCell>{s.messages_count}</TableCell>
                      <TableCell><Badge className={STATUS_COLORS[s.status] || ""}>{s.status === "active" ? "Activă" : s.status === "resolved" ? "Rezolvată" : "Escaladată"}</Badge></TableCell>
                      <TableCell>
                        {s.satisfaction_rating === 1 && <ThumbsUp className="w-4 h-4 text-green-600" />}
                        {s.satisfaction_rating === -1 && <ThumbsDown className="w-4 h-4 text-red-600" />}
                        {s.satisfaction_rating == null && <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => viewSession(s.id)}><Eye className="w-4 h-4" /></Button>
                        {s.status === "active" && <Button variant="ghost" size="sm" onClick={() => markResolved(s.id)}>✓</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Session detail dialog */}
          <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Conversație</DialogTitle></DialogHeader>
              <div className="space-y-2">
                {sessionMessages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {sessionMessages.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Niciun mesaj</p>}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── TAB 2: CONFIGURARE ─── */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Activare ChatBot</Label>
                <Switch checked={settings.enabled} onCheckedChange={v => set("enabled", v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nume asistent</Label>
                  <Input value={settings.assistant_name} onChange={e => set("assistant_name", e.target.value)} />
                </div>
                <div>
                  <Label>Culoare widget</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.widget_color} onChange={e => set("widget_color", e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                    <Input value={settings.widget_color} onChange={e => set("widget_color", e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
              <div>
                <Label>Mesaj de bun venit</Label>
                <Textarea value={settings.welcome_message} onChange={e => set("welcome_message", e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Mesaj offline</Label>
                <Textarea value={settings.offline_message} onChange={e => set("offline_message", e.target.value)} rows={2} />
              </div>
              <div className="flex items-center gap-4">
                <Label>Program funcționare</Label>
                <Select value={settings.schedule_type} onValueChange={v => set("schedule_type", v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24/7</SelectItem>
                    <SelectItem value="custom">Program custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Funcții activate</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm">{label}</Label>
                  <Switch checked={!!settings.features_enabled[key]} onCheckedChange={v => setFeature(key, v)} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Escalare automată</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm whitespace-nowrap">După</Label>
                <Input type="number" min={1} max={20} value={settings.auto_escalate_after_messages} onChange={e => set("auto_escalate_after_messages", +e.target.value)} className="w-20" />
                <span className="text-sm text-muted-foreground">mesaje fără rezolvare</span>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">La detectare sentiment negativ</Label>
                <Switch checked={settings.escalate_on_negative_sentiment} onCheckedChange={v => set("escalate_on_negative_sentiment", v)} />
              </div>
              <div>
                <Label className="text-sm">Cuvinte cheie escalare</Label>
                <Textarea value={settings.escalate_keywords} onChange={e => set("escalate_keywords", e.target.value)} rows={2} placeholder="reclamație, plângere, avocat..." />
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveSettings} disabled={saving}><Save className="w-4 h-4 mr-1" /> {saving ? "Se salvează..." : "Salvează setările"}</Button>
        </TabsContent>

        {/* ─── TAB 3: FAQ ─── */}
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Adaugă întrebare/răspuns</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Întrebare</Label>
                <Input value={newFaq.question} onChange={e => setNewFaq(f => ({ ...f, question: e.target.value }))} placeholder="Ex: Care sunt costurile de livrare?" />
              </div>
              <div>
                <Label>Răspuns</Label>
                <Textarea value={newFaq.answer} onChange={e => setNewFaq(f => ({ ...f, answer: e.target.value }))} rows={3} placeholder="Răspunsul pe care AI-ul îl va folosi ca bază..." />
              </div>
              <div className="flex items-center gap-4">
                <Label>Categorie</Label>
                <Select value={newFaq.category} onValueChange={v => setNewFaq(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="livrare">Livrare</SelectItem>
                    <SelectItem value="plata">Plată</SelectItem>
                    <SelectItem value="retur">Retur</SelectItem>
                    <SelectItem value="produs">Produs</SelectItem>
                    <SelectItem value="alt">Altele</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addFaq}><Plus className="w-4 h-4 mr-1" /> Adaugă FAQ</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Întrebare</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead>Activ</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nicio întrebare FAQ</TableCell></TableRow>
                  )}
                  {faqs.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="text-sm max-w-[300px] truncate">{f.question}</TableCell>
                      <TableCell><Badge variant="outline">{f.category}</Badge></TableCell>
                      <TableCell><Switch checked={f.active} onCheckedChange={v => toggleFaq(f.id, v)} /></TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => deleteFaq(f.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: STATISTICI ─── */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total conversații</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Rata rezolvare</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.total > 0 ? Math.round((stats.escalated / stats.total) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Rata escalare</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.avgMessages}</p><p className="text-xs text-muted-foreground">Mesaje medii</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.satisfied}</p><p className="text-xs text-muted-foreground">👍 Satisfăcuți</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{stats.dissatisfied}</p><p className="text-xs text-muted-foreground">👎 Nesatisfăcuți</p></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
