import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, CheckCircle2, XCircle, Loader2, MessageSquare, Settings, Image, Trash2, Camera } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  pros: string | null;
  cons: string | null;
  verified_purchase: boolean;
  status: string;
  admin_reply: string | null;
  photos: string[];
  created_at: string;
  helpful_count: number | null;
}

interface ReviewSettings {
  auto_approve: boolean;
  verified_only: boolean;
  allow_photos: boolean;
  max_photos: number;
  min_length: number;
  show_on_product: boolean;
  request_days_after_delivery: number;
  reminder_days: number;
  email_subject: string;
  email_body: string;
  reminder_subject: string;
  reminder_body: string;
  notify_admin_reply: boolean;
}

const DEFAULT_SETTINGS: ReviewSettings = {
  auto_approve: false,
  verified_only: false,
  allow_photos: true,
  max_photos: 3,
  min_length: 0,
  show_on_product: true,
  request_days_after_delivery: 5,
  reminder_days: 7,
  email_subject: "Cum a fost experiența ta cu comanda {{order_id}}?",
  email_body: "Bună {{customer_name}},\n\nSperăm că ești mulțumit/ă de produsele comandate. Ne-ar plăcea să afli părerea ta!\n\nClick pe stelele de mai jos pentru a lăsa o recenzie rapidă.",
  reminder_subject: "Ai uitat să ne spui părerea ta",
  reminder_body: "Bună {{customer_name}},\n\nÎți reamintim că poți lăsa o recenzie pentru produsele din comanda ta. Părerea ta contează!",
  notify_admin_reply: true,
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [settings, setSettings] = useState<ReviewSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterPhotos, setFilterPhotos] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [revRes, settingsRes] = await Promise.all([
      supabase.from("product_reviews").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("app_settings").select("value_json").eq("key", "review_settings").maybeSingle(),
    ]);
    setReviews((revRes.data || []) as Review[]);
    if (settingsRes.data?.value_json && typeof settingsRes.data.value_json === "object") {
      setSettings({ ...DEFAULT_SETTINGS, ...(settingsRes.data.value_json as Record<string, unknown>) } as ReviewSettings);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("product_reviews").update({ status }).eq("id", id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success(status === "approved" ? "Review aprobat" : "Review respins");
  };

  const submitReply = async (id: string) => {
    await supabase.from("product_reviews").update({ admin_reply: reply }).eq("id", id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, admin_reply: reply } : r));
    setReplyingTo(null);
    setReply("");
    toast.success("Răspuns salvat");
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Sigur vrei să ștergi acest review?")) return;
    await supabase.from("product_reviews").delete().eq("id", id);
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success("Review șters");
  };

  const bulkApprove = async () => {
    const pendingIds = filteredReviews.filter(r => r.status === "pending").map(r => r.id);
    if (pendingIds.length === 0) return;
    await supabase.from("product_reviews").update({ status: "approved" }).in("id", pendingIds);
    setReviews(prev => prev.map(r => pendingIds.includes(r.id) ? { ...r, status: "approved" } : r));
    toast.success(`${pendingIds.length} review-uri aprobate`);
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Ștergi ${selectedIds.size} review-uri?`)) return;
    const ids = Array.from(selectedIds);
    await supabase.from("product_reviews").delete().in("id", ids);
    setReviews(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    toast.success("Review-uri șterse");
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "review_settings").maybeSingle();
    if (existing) {
      await supabase.from("app_settings").update({ value_json: settings as unknown as Record<string, unknown> }).eq("key", "review_settings");
    } else {
      await supabase.from("app_settings").insert({ key: "review_settings", value_json: settings as unknown as Record<string, unknown>, description: "Review & feedback settings" });
    }
    setSavingSettings(false);
    toast.success("Setări salvate");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredReviews = reviews.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterRating !== "all" && r.rating !== Number(filterRating)) return false;
    if (filterPhotos === "with" && (!r.photos || r.photos.length === 0)) return false;
    if (filterPhotos === "without" && r.photos && r.photos.length > 0) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(r.user_name?.toLowerCase().includes(q) || r.body?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const pendingCount = reviews.filter(r => r.status === "pending").length;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";
  const photoCount = reviews.filter(r => r.photos && r.photos.length > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" /> Recenzii Produse
        </h1>
        <p className="text-sm text-muted-foreground">Moderează, răspunde și configurează sistemul de recenzii</p>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista Review-uri ({reviews.length})</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1"><Settings className="w-3 h-3" /> Setări</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{reviews.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Rating mediu</p><p className="text-2xl font-bold flex items-center gap-1">{avgRating} <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /></p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">În așteptare</p><p className="text-2xl font-bold text-yellow-500">{pendingCount}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Cu fotografii</p><p className="text-2xl font-bold flex items-center gap-1">{photoCount} <Camera className="w-4 h-4 text-muted-foreground" /></p></CardContent></Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="pending">În așteptare</SelectItem>
                  <SelectItem value="approved">Aprobate</SelectItem>
                  <SelectItem value="rejected">Respinse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Rating</Label>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={String(r)}>{r} ★</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fotografii</Label>
              <Select value={filterPhotos} onValueChange={setFilterPhotos}>
                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="with">Cu poze</SelectItem>
                  <SelectItem value="without">Fără poze</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Caută..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-48 h-8" />
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={bulkApprove} disabled={pendingCount === 0}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Aprobă toate pending
              </Button>
              {selectedIds.size > 0 && (
                <Button size="sm" variant="destructive" onClick={bulkDelete}>
                  <Trash2 className="w-3 h-3 mr-1" /> Șterge ({selectedIds.size})
                </Button>
              )}
            </div>
          </div>

          {/* Review list */}
          <Card className="border-border">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
              ) : filteredReviews.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Niciun review găsit.</p>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map(r => (
                    <div key={r.id} className={`border border-border rounded-lg p-4 space-y-2 ${selectedIds.has(r.id) ? "ring-2 ring-primary/50" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                          <span className="font-medium">{r.user_name || "Anonim"}</span>
                          <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />)}</div>
                          {r.verified_purchase && <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs">Verificat</Badge>}
                          {r.photos && r.photos.length > 0 && <Badge variant="outline" className="text-xs gap-1"><Image className="w-3 h-3" /> {r.photos.length}</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={r.status === "approved" ? "default" : r.status === "pending" ? "secondary" : "outline"}>
                            {r.status === "approved" ? "Aprobat" : r.status === "pending" ? "În așteptare" : "Respins"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</span>
                        </div>
                      </div>
                      {r.title && <p className="font-medium">{r.title}</p>}
                      {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
                      {r.pros && <p className="text-sm text-green-600">👍 {r.pros}</p>}
                      {r.cons && <p className="text-sm text-red-500">👎 {r.cons}</p>}
                      {r.photos && r.photos.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {r.photos.map((url, i) => (
                            <img key={i} src={url} alt={`Review photo ${i + 1}`} className="w-16 h-16 object-cover rounded border border-border cursor-pointer" onClick={() => window.open(url, "_blank")} />
                          ))}
                        </div>
                      )}
                      {r.admin_reply && (
                        <div className="bg-muted/50 rounded p-3 text-sm"><span className="font-medium">Răspuns oficial:</span> {r.admin_reply}</div>
                      )}
                      <div className="flex gap-2 pt-1">
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "approved")}><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobă</Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "rejected")} className="text-destructive"><XCircle className="w-3 h-3 mr-1" /> Respinge</Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(r.id); setReply(r.admin_reply || ""); }}><MessageSquare className="w-3 h-3 mr-1" /> Răspunde</Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteReview(r.id)} className="text-destructive ml-auto"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                      {replyingTo === r.id && (
                        <div className="flex gap-2 mt-2">
                          <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Scrie răspunsul oficial..." rows={2} className="flex-1" />
                          <div className="flex flex-col gap-1">
                            <Button size="sm" onClick={() => submitReply(r.id)}>Salvează</Button>
                            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Anulează</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <h3 className="font-semibold text-lg">Setări Generale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <Label>Aprobare automată review-uri</Label>
                  <Switch checked={settings.auto_approve} onCheckedChange={v => setSettings(s => ({ ...s, auto_approve: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Doar cumpărători verificați</Label>
                  <Switch checked={settings.verified_only} onCheckedChange={v => setSettings(s => ({ ...s, verified_only: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Permite fotografii</Label>
                  <Switch checked={settings.allow_photos} onCheckedChange={v => setSettings(s => ({ ...s, allow_photos: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Afișează review-uri pe produs</Label>
                  <Switch checked={settings.show_on_product} onCheckedChange={v => setSettings(s => ({ ...s, show_on_product: v }))} />
                </div>
                <div className="space-y-1">
                  <Label>Max fotografii per review</Label>
                  <Input type="number" value={settings.max_photos} onChange={e => setSettings(s => ({ ...s, max_photos: Number(e.target.value) }))} className="w-24 h-8" />
                </div>
                <div className="space-y-1">
                  <Label>Lungime minimă review (caractere, 0 = fără)</Label>
                  <Input type="number" value={settings.min_length} onChange={e => setSettings(s => ({ ...s, min_length: Number(e.target.value) }))} className="w-24 h-8" />
                </div>
              </div>

              <h3 className="font-semibold text-lg pt-4">Email Cerere Recenzie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label>Trimite email la X zile după livrare</Label>
                  <Select value={String(settings.request_days_after_delivery)} onValueChange={v => setSettings(s => ({ ...s, request_days_after_delivery: Number(v) }))}>
                    <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 7, 14].map(d => <SelectItem key={d} value={String(d)}>{d} zile</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Reminder după încă X zile</Label>
                  <Input type="number" value={settings.reminder_days} onChange={e => setSettings(s => ({ ...s, reminder_days: Number(e.target.value) }))} className="w-24 h-8" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Notifică clientul la răspuns admin</Label>
                  <Switch checked={settings.notify_admin_reply} onCheckedChange={v => setSettings(s => ({ ...s, notify_admin_reply: v }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subiect email cerere recenzie</Label>
                <Input value={settings.email_subject} onChange={e => setSettings(s => ({ ...s, email_subject: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Variabile: {"{{order_id}}, {{customer_name}}"}</p>
              </div>
              <div className="space-y-2">
                <Label>Corp email cerere recenzie</Label>
                <Textarea value={settings.email_body} onChange={e => setSettings(s => ({ ...s, email_body: e.target.value }))} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Subiect email reminder</Label>
                <Input value={settings.reminder_subject} onChange={e => setSettings(s => ({ ...s, reminder_subject: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Corp email reminder</Label>
                <Textarea value={settings.reminder_body} onChange={e => setSettings(s => ({ ...s, reminder_body: e.target.value }))} rows={3} />
              </div>

              <Button onClick={saveSettings} disabled={savingSettings}>
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Salvează setările
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
