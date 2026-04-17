import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2, RefreshCw, DollarSign, MousePointerClick, ShoppingBag, Settings, Upload, Check, X, Ban, Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AffiliateRow {
  id: string; user_id: string; affiliate_code: string; commission_rate: number; status: string;
  total_earnings: number; total_paid: number; total_clicks: number; total_orders: number;
  created_at: string; full_name: string | null; email: string | null; website: string | null;
  promotion_plan: string | null; tax_id: string | null; available_balance: number;
  pending_balance: number; rejection_reason: string | null; discount_code: string | null;
  discount_percent: number; cookie_duration_days: number;
}

interface PayoutRequest {
  id: string; affiliate_id: string; amount: number; payment_method: string; status: string;
  reference_number: string | null; processed_at: string | null; created_at: string;
}

interface AffMaterial {
  id: string; title: string; description: string | null; file_url: string; file_type: string; created_at: string;
}

const DEFAULT_SETTINGS = {
  enabled: true, default_commission: 10, cookie_duration: 30, min_payout: 100,
  payout_methods: ["bank_transfer", "paypal"], program_description: "Câștigă comision promovând produsele noastre!",
  affiliate_discount_enabled: false, affiliate_discount_percent: 5,
};

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [materials, setMaterials] = useState<AffMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [editAff, setEditAff] = useState<AffiliateRow | null>(null);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [payRefDialog, setPayRefDialog] = useState<string | null>(null);
  const [payRef, setPayRef] = useState("");
  const [matTitle, setMatTitle] = useState(""); const [matFile, setMatFile] = useState<File | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: a }, { data: p }, { data: m }, { data: s }] = await Promise.all([
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_payout_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("app_settings").select("*").eq("key", "affiliate_config").maybeSingle(),
    ]);
    setAffiliates((a as any[]) || []);
    setPayouts((p as any[]) || []);
    setMaterials((m as any[]) || []);
    if (s?.value_json) setSettings({ ...DEFAULT_SETTINGS, ...(s.value_json as any) });
    setLoading(false);
  };

  const saveSettings = async () => {
    await supabase.from("app_settings").upsert({ key: "affiliate_config", value_json: settings as any }, { onConflict: "key" });
    toast.success("Setări salvate!");
  };

  const approve = async (id: string) => {
    await supabase.from("affiliates").update({ status: "active" }).eq("id", id);
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: "active" } : a));
    toast.success("Afiliat aprobat");
  };

  const reject = async () => {
    if (!rejectDialog) return;
    await supabase.from("affiliates").update({ status: "rejected", rejection_reason: rejectReason }).eq("id", rejectDialog);
    setAffiliates(prev => prev.map(a => a.id === rejectDialog ? { ...a, status: "rejected", rejection_reason: rejectReason } : a));
    setRejectDialog(null); setRejectReason("");
    toast.success("Cerere respinsă");
  };

  const suspend = async (id: string) => {
    await supabase.from("affiliates").update({ status: "suspended" }).eq("id", id);
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: "suspended" } : a));
    toast.success("Afiliat suspendat");
  };

  const updateCommission = async () => {
    if (!editAff) return;
    await supabase.from("affiliates").update({ commission_rate: editAff.commission_rate, discount_code: editAff.discount_code, discount_percent: editAff.discount_percent }).eq("id", editAff.id);
    setAffiliates(prev => prev.map(a => a.id === editAff.id ? { ...a, ...editAff } : a));
    setEditAff(null);
    toast.success("Actualizat");
  };

  const markPaid = async () => {
    if (!payRefDialog) return;
    await supabase.from("affiliate_payout_requests").update({ status: "paid", reference_number: payRef, processed_at: new Date().toISOString() }).eq("id", payRefDialog);
    setPayouts(prev => prev.map(p => p.id === payRefDialog ? { ...p, status: "paid", reference_number: payRef } : p));
    setPayRefDialog(null); setPayRef("");
    toast.success("Plată marcată");
  };

  const rejectPayout = async (id: string) => {
    await supabase.from("affiliate_payout_requests").update({ status: "rejected" }).eq("id", id);
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" } : p));
    toast.success("Plată respinsă");
  };

  const uploadMaterial = async () => {
    if (!matFile || !matTitle) return;
    const path = `materials/${Date.now()}_${matFile.name}`;
    const { error } = await supabase.storage.from("affiliate-materials").upload(path, matFile);
    if (error) { toast.error("Eroare upload"); return; }
    const { data: { publicUrl } } = supabase.storage.from("affiliate-materials").getPublicUrl(path);
    await supabase.from("affiliate_materials").insert({ title: matTitle, file_url: publicUrl, file_type: matFile.type.startsWith("image") ? "image" : "file" });
    setMatTitle(""); setMatFile(null);
    toast.success("Material încărcat");
    fetchAll();
  };

  const deleteMaterial = async (id: string) => {
    await supabase.from("affiliate_materials").delete().eq("id", id);
    setMaterials(prev => prev.filter(m => m.id !== id));
    toast.success("Material șters");
  };

  const pending = affiliates.filter(a => a.status === "pending");
  const active = affiliates.filter(a => a.status === "active");
  const totalEarnings = affiliates.reduce((s, a) => s + (a.total_earnings || 0), 0);
  const totalClicks = affiliates.reduce((s, a) => s + (a.total_clicks || 0), 0);

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      active: { label: "Activ", variant: "default" }, pending: { label: "În așteptare", variant: "secondary" },
      rejected: { label: "Respins", variant: "destructive" }, suspended: { label: "Suspendat", variant: "outline" },
    };
    const m = map[s] || { label: s, variant: "outline" as const };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  if (loading) return <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Program Afiliere</h1>
          <p className="text-sm text-muted-foreground">Gestionează afiliați, comisioane, plăți și materiale promoționale</p>
        </div>
        <Button variant="outline" onClick={fetchAll}><RefreshCw className="w-4 h-4 mr-2" /> Reîncarcă</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Afiliați activi</p><p className="text-2xl font-bold">{active.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" /><div><p className="text-sm text-muted-foreground">Comisioane totale</p><p className="text-2xl font-bold">{totalEarnings.toFixed(2)} RON</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-2"><MousePointerClick className="w-5 h-5 text-blue-500" /><div><p className="text-sm text-muted-foreground">Clickuri totale</p><p className="text-2xl font-bold">{totalClicks}</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /><div><p className="text-sm text-muted-foreground">Cereri noi</p><p className="text-2xl font-bold text-orange-500">{pending.length}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="affiliates">
        <TabsList>
          <TabsTrigger value="affiliates">Afiliați</TabsTrigger>
          <TabsTrigger value="requests">Cereri {pending.length > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1">{pending.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="payouts">Plăți</TabsTrigger>
          <TabsTrigger value="materials">Materiale</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" /> Setări</TabsTrigger>
        </TabsList>

        {/* AFFILIATES TAB */}
        <TabsContent value="affiliates">
          <Card><CardContent className="pt-6">
            {active.length === 0 ? <p className="text-center py-8 text-muted-foreground">Niciun afiliat activ.</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nume</TableHead><TableHead>Cod</TableHead><TableHead>Comision</TableHead>
                  <TableHead>Clickuri</TableHead><TableHead>Comenzi</TableHead><TableHead>Câștiguri</TableHead>
                  <TableHead>Sold disponibil</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {affiliates.filter(a => a.status !== "pending").map(a => (
                    <TableRow key={a.id}>
                      <TableCell><div><p className="font-medium">{a.full_name || "—"}</p><p className="text-xs text-muted-foreground">{a.email}</p></div></TableCell>
                      <TableCell className="font-mono text-xs">{a.affiliate_code}</TableCell>
                      <TableCell>{a.commission_rate}%</TableCell>
                      <TableCell>{a.total_clicks || 0}</TableCell>
                      <TableCell>{a.total_orders || 0}</TableCell>
                      <TableCell className="font-mono">{(a.total_earnings || 0).toFixed(2)} RON</TableCell>
                      <TableCell className="font-mono">{(a.available_balance || 0).toFixed(2)} RON</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditAff(a)}><Edit2 className="w-3 h-3" /></Button>
                          {a.status === "active" && <Button size="sm" variant="ghost" onClick={() => suspend(a.id)}><Ban className="w-3 h-3" /></Button>}
                          {a.status === "suspended" && <Button size="sm" variant="ghost" onClick={() => approve(a.id)}><Check className="w-3 h-3" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* REQUESTS TAB */}
        <TabsContent value="requests">
          <Card><CardContent className="pt-6">
            {pending.length === 0 ? <p className="text-center py-8 text-muted-foreground">Nicio cerere nouă.</p> : (
              <div className="space-y-4">
                {pending.map(a => (
                  <Card key={a.id} className="border-orange-200">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{a.full_name || "Necunoscut"}</p>
                          <p className="text-sm text-muted-foreground">{a.email}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("ro-RO")}</p>
                      </div>
                      {a.website && <p className="text-sm"><span className="font-medium">Website:</span> {a.website}</p>}
                      {a.promotion_plan && <p className="text-sm"><span className="font-medium">Plan promovare:</span> {a.promotion_plan}</p>}
                      {a.tax_id && <p className="text-sm"><span className="font-medium">CNP/CUI:</span> {a.tax_id}</p>}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => approve(a.id)}><Check className="w-4 h-4 mr-1" /> Aprobă</Button>
                        <Button size="sm" variant="destructive" onClick={() => setRejectDialog(a.id)}><X className="w-4 h-4 mr-1" /> Respinge</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* PAYOUTS TAB */}
        <TabsContent value="payouts">
          <Card><CardContent className="pt-6">
            {payouts.length === 0 ? <p className="text-center py-8 text-muted-foreground">Nicio cerere de plată.</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Afiliat</TableHead><TableHead>Sumă</TableHead><TableHead>Metodă</TableHead>
                  <TableHead>Data cererii</TableHead><TableHead>Status</TableHead><TableHead>Referință</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {payouts.map(p => {
                    const aff = affiliates.find(a => a.id === p.affiliate_id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{aff?.full_name || aff?.affiliate_code || "—"}</TableCell>
                        <TableCell className="font-mono font-bold">{p.amount.toFixed(2)} RON</TableCell>
                        <TableCell>{p.payment_method === "bank_transfer" ? "Transfer bancar" : "PayPal"}</TableCell>
                        <TableCell>{new Date(p.created_at).toLocaleDateString("ro-RO")}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "paid" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
                            {p.status === "paid" ? "Plătit" : p.status === "rejected" ? "Respins" : "În așteptare"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.reference_number || "—"}</TableCell>
                        <TableCell>
                          {p.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => { setPayRefDialog(p.id); setPayRef(""); }}><Check className="w-3 h-3 mr-1" /> Plătit</Button>
                              <Button size="sm" variant="ghost" onClick={() => rejectPayout(p.id)}><X className="w-3 h-3" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* MATERIALS TAB */}
        <TabsContent value="materials">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Label>Titlu material</Label><Input value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="Banner promoțional 728x90" /></div>
              <div><Label>Fișier</Label><Input type="file" accept="image/*,.pdf,.zip" onChange={e => setMatFile(e.target.files?.[0] || null)} /></div>
              <Button onClick={uploadMaterial} disabled={!matTitle || !matFile}><Upload className="w-4 h-4 mr-1" /> Încarcă</Button>
            </div>
            {materials.length === 0 ? <p className="text-center py-8 text-muted-foreground">Niciun material încărcat.</p> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {materials.map(m => (
                  <Card key={m.id}>
                    <CardContent className="p-3 space-y-2">
                      {m.file_type === "image" ? <img src={m.file_url} alt={m.title} className="w-full h-24 object-cover rounded" /> : <div className="w-full h-24 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">Fișier</div>}
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <Button size="sm" variant="ghost" className="w-full" onClick={() => deleteMaterial(m.id)}><Trash2 className="w-3 h-3 mr-1" /> Șterge</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings">
          <Card><CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between"><Label>Program activ</Label><Switch checked={settings.enabled} onCheckedChange={v => setSettings(s => ({ ...s, enabled: v }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Comision implicit (%)</Label><Input type="number" value={settings.default_commission} onChange={e => setSettings(s => ({ ...s, default_commission: Number(e.target.value) }))} /></div>
              <div><Label>Durată cookie (zile)</Label><Input type="number" value={settings.cookie_duration} onChange={e => setSettings(s => ({ ...s, cookie_duration: Number(e.target.value) }))} /></div>
              <div><Label>Plată minimă (RON)</Label><Input type="number" value={settings.min_payout} onChange={e => setSettings(s => ({ ...s, min_payout: Number(e.target.value) }))} /></div>
              <div><Label>Discount afiliat pentru clienți (%)</Label><Input type="number" value={settings.affiliate_discount_percent} onChange={e => setSettings(s => ({ ...s, affiliate_discount_percent: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Descriere program</Label><Textarea value={settings.program_description} onChange={e => setSettings(s => ({ ...s, program_description: e.target.value }))} rows={3} /></div>
            <Button onClick={saveSettings}>Salvează setări</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle>Respinge cererea</DialogTitle></DialogHeader>
          <div><Label>Motiv (opțional)</Label><Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setRejectDialog(null)}>Anulează</Button><Button variant="destructive" onClick={reject}>Respinge</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit affiliate dialog */}
      <Dialog open={!!editAff} onOpenChange={() => setEditAff(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editare afiliat — {editAff?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Comision (%)</Label><Input type="number" value={editAff?.commission_rate || 0} onChange={e => setEditAff(prev => prev ? { ...prev, commission_rate: Number(e.target.value) } : null)} /></div>
            <div><Label>Cod discount (opțional)</Label><Input value={editAff?.discount_code || ""} onChange={e => setEditAff(prev => prev ? { ...prev, discount_code: e.target.value } : null)} /></div>
            <div><Label>Discount clienți (%)</Label><Input type="number" value={editAff?.discount_percent || 0} onChange={e => setEditAff(prev => prev ? { ...prev, discount_percent: Number(e.target.value) } : null)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditAff(null)}>Anulează</Button><Button onClick={updateCommission}>Salvează</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark paid dialog */}
      <Dialog open={!!payRefDialog} onOpenChange={() => setPayRefDialog(null)}>
        <DialogContent><DialogHeader><DialogTitle>Marchează ca plătit</DialogTitle></DialogHeader>
          <div><Label>Număr referință / tranzacție</Label><Input value={payRef} onChange={e => setPayRef(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setPayRefDialog(null)}>Anulează</Button><Button onClick={markPaid}>Confirmă plata</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
