import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Star, Trophy, TrendingUp, Users, Plus, Pencil, Trash2,
  Award, Gift, Search, Download, ArrowUpDown, Settings, Save,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { LoyaltyConfig } from "@/hooks/useLoyalty";

interface LoyaltyLevel {
  id: string;
  name: string;
  min_points: number;
  discount_percentage: number | null;
  color: string | null;
  icon: string | null;
  benefits: string[] | null;
}

interface LoyaltyPoint {
  id: string;
  user_id: string;
  points: number;
  action: string;
  description: string | null;
  order_id: string | null;
  created_at: string;
}

const defaultLevel: Partial<LoyaltyLevel> = {
  name: "", min_points: 0, discount_percentage: 0, color: "#CD7F32", icon: "🥉", benefits: [],
};

const DEFAULT_CONFIG: LoyaltyConfig = {
  program_enabled: true, program_name: "Puncte Fidelitate",
  earn_rate_points: 1, earn_rate_per_amount: 10,
  redeem_rate_points: 100, redeem_rate_value: 5,
  min_points_redeem: 50, max_redeem_percent: 30, expiry_months: 0,
  bonus_registration: 0, bonus_first_order: 0, bonus_birthday: 0,
  bonus_review: 10, bonus_referral: 50,
  weekend_multiplier: 2, weekend_enabled: false,
  triple_product_ids: [], bonus_category_id: "", bonus_category_points: 0,
};

export default function AdminLoyalty() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("settings");
  const [editLevel, setEditLevel] = useState<Partial<LoyaltyLevel> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [benefitInput, setBenefitInput] = useState("");
  const [searchPoints, setSearchPoints] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [config, setConfig] = useState<LoyaltyConfig>(DEFAULT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  // Load config
  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "loyalty_config").maybeSingle().then(({ data }) => {
      if (data?.value_json && typeof data.value_json === "object" && !Array.isArray(data.value_json)) {
        setConfig({ ...DEFAULT_CONFIG, ...(data.value_json as Record<string, unknown>) } as LoyaltyConfig);
      }
    });
  }, []);

  const saveConfig = async () => {
    setSavingConfig(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "loyalty_config", value_json: config as any, description: "Loyalty program configuration" },
      { onConflict: "key" }
    );
    if (error) toast.error(error.message); else toast.success("Configurare salvată");
    setSavingConfig(false);
  };

  const setC = (k: keyof LoyaltyConfig, v: any) => setConfig(prev => ({ ...prev, [k]: v }));

  // Queries
  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin-loyalty-levels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("loyalty_levels").select("*").order("min_points", { ascending: true });
      if (error) throw error;
      return data as LoyaltyLevel[];
    },
  });

  const { data: points = [], isLoading: pointsLoading } = useQuery({
    queryKey: ["admin-loyalty-points"],
    queryFn: async () => {
      const { data, error } = await supabase.from("loyalty_points").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as LoyaltyPoint[];
    },
  });

  const totalPointsIssued = points.reduce((s, p) => s + (p.points > 0 ? p.points : 0), 0);
  const totalPointsRedeemed = points.reduce((s, p) => s + (p.points < 0 ? Math.abs(p.points) : 0), 0);
  const uniqueUsers = new Set(points.map((p) => p.user_id)).size;
  const outstandingLiability = (totalPointsIssued - totalPointsRedeemed) * (config.redeem_rate_value / config.redeem_rate_points);
  const actionTypes = [...new Set(points.map((p) => p.action))].sort();

  // Level Mutations
  const saveLevelMut = useMutation({
    mutationFn: async (level: Partial<LoyaltyLevel>) => {
      const payload = {
        name: level.name!, min_points: level.min_points || 0,
        discount_percentage: level.discount_percentage || 0,
        color: level.color || "#CD7F32", icon: level.icon || "🥉", benefits: level.benefits || [],
      };
      if (level.id) {
        const { error } = await supabase.from("loyalty_levels").update(payload).eq("id", level.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("loyalty_levels").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-loyalty-levels"] }); toast.success(isNew ? "Nivel creat" : "Nivel actualizat"); setEditLevel(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLevelMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loyalty_levels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-loyalty-levels"] }); toast.success("Nivel șters"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredPoints = points.filter((p) => {
    if (filterAction !== "all" && p.action !== filterAction) return false;
    if (searchPoints) {
      const q = searchPoints.toLowerCase();
      return p.user_id.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) || p.action.toLowerCase().includes(q);
    }
    return true;
  });

  const addBenefit = () => {
    if (!benefitInput.trim() || !editLevel) return;
    setEditLevel({ ...editLevel, benefits: [...(editLevel.benefits || []), benefitInput.trim()] });
    setBenefitInput("");
  };
  const removeBenefit = (idx: number) => {
    if (!editLevel) return;
    setEditLevel({ ...editLevel, benefits: (editLevel.benefits || []).filter((_, i) => i !== idx) });
  };

  const exportCSV = () => {
    if (!filteredPoints.length) { toast.error("Nicio înregistrare"); return; }
    const rows = [
      ["Data", "User ID", "Puncte", "Acțiune", "Descriere", "Comandă"],
      ...filteredPoints.map((p) => [format(new Date(p.created_at), "yyyy-MM-dd HH:mm"), p.user_id, String(p.points), p.action, p.description || "", p.order_id || ""]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `loyalty-points-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredPoints.length} înregistrări exportate`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Program Fidelitate</h1>
        <p className="text-sm text-muted-foreground">Configurare completă: setări, niveluri, puncte, bonus events & rapoarte</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Niveluri</p>
          <p className="text-2xl font-bold text-foreground">{levels.length}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Puncte emise</p>
          <p className="text-2xl font-bold text-foreground">{totalPointsIssued.toLocaleString()}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Puncte folosite</p>
          <p className="text-2xl font-bold text-foreground">{totalPointsRedeemed.toLocaleString()}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Membri activi</p>
          <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Pasiv (lei)</p>
          <p className="text-2xl font-bold text-foreground">{outstandingLiability.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" /> Setări</TabsTrigger>
          <TabsTrigger value="levels" className="gap-1.5"><Trophy className="w-4 h-4" /> Niveluri</TabsTrigger>
          <TabsTrigger value="bonus" className="gap-1.5"><Gift className="w-4 h-4" /> Bonus Events</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><ArrowUpDown className="w-4 h-4" /> Istoric</TabsTrigger>
        </TabsList>

        {/* ── SETTINGS TAB ── */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Configurare Program</CardTitle>
              <Button onClick={saveConfig} disabled={savingConfig} size="sm"><Save className="h-4 w-4 mr-1" /> Salvează</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Program activ</Label>
                  <p className="text-xs text-muted-foreground">Activează/dezactivează întregul program de fidelitate</p>
                </div>
                <Switch checked={config.program_enabled} onCheckedChange={v => setC("program_enabled", v)} />
              </div>

              <div>
                <Label>Nume program</Label>
                <Input value={config.program_name} onChange={e => setC("program_name", e.target.value)} placeholder="Puncte Fidelitate" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Câștig: puncte per</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={1} className="w-20" value={config.earn_rate_points} onChange={e => setC("earn_rate_points", Number(e.target.value))} />
                    <span className="text-sm text-muted-foreground">puncte la fiecare</span>
                    <Input type="number" min={1} className="w-20" value={config.earn_rate_per_amount} onChange={e => setC("earn_rate_per_amount", Number(e.target.value))} />
                    <span className="text-sm text-muted-foreground">lei</span>
                  </div>
                </div>
                <div>
                  <Label>Răscumpărare: puncte → lei</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={1} className="w-20" value={config.redeem_rate_points} onChange={e => setC("redeem_rate_points", Number(e.target.value))} />
                    <span className="text-sm text-muted-foreground">puncte =</span>
                    <Input type="number" min={0} className="w-20" value={config.redeem_rate_value} onChange={e => setC("redeem_rate_value", Number(e.target.value))} />
                    <span className="text-sm text-muted-foreground">lei</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Minim puncte pentru răscumpărare</Label>
                  <Input type="number" min={0} value={config.min_points_redeem} onChange={e => setC("min_points_redeem", Number(e.target.value))} />
                </div>
                <div>
                  <Label>Max % din comandă plătibil cu puncte</Label>
                  <Input type="number" min={0} max={100} value={config.max_redeem_percent} onChange={e => setC("max_redeem_percent", Number(e.target.value))} />
                </div>
                <div>
                  <Label>Expirare puncte (luni, 0=niciodată)</Label>
                  <Input type="number" min={0} value={config.expiry_months} onChange={e => setC("expiry_months", Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BONUS EVENTS TAB ── */}
        <TabsContent value="bonus" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Evenimente Bonus</CardTitle>
              <Button onClick={saveConfig} disabled={savingConfig} size="sm"><Save className="h-4 w-4 mr-1" /> Salvează</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["bonus_registration", "Înregistrare cont nou"],
                ["bonus_first_order", "Prima comandă"],
                ["bonus_birthday", "Zi de naștere"],
                ["bonus_review", "Scriere recenzie verificată"],
                ["bonus_referral", "Referral (prieten înregistrat)"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">Puncte bonus acordate automat</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">+</span>
                    <Input type="number" min={0} className="w-24" value={(config as any)[key] || 0} onChange={e => setC(key as any, Number(e.target.value))} />
                    <span className="text-xs text-muted-foreground">puncte</span>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Puncte duble în weekend</p>
                    <p className="text-xs text-muted-foreground">Multiplicator sâmbătă + duminică</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{config.weekend_multiplier}x</span>
                    <Switch checked={config.weekend_enabled} onCheckedChange={v => setC("weekend_enabled", v)} />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Puncte bonus per categorie</p>
                    <p className="text-xs text-muted-foreground">Puncte extra pentru achiziții din categorie specifică</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">+</span>
                    <Input type="number" min={0} className="w-20" value={config.bonus_category_points} onChange={e => setC("bonus_category_points", Number(e.target.value))} />
                    <span className="text-xs text-muted-foreground">puncte</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LEVELS TAB ── */}
        <TabsContent value="levels" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-2" onClick={() => { setEditLevel({ ...defaultLevel }); setIsNew(true); }}>
              <Plus className="w-4 h-4" /> Adaugă nivel
            </Button>
          </div>

          {levelsLoading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : levels.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nu există niveluri. Creează primul nivel de fidelitate.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {levels.map((level) => (
                <Card key={level.id} className="bg-card border-border relative group overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: level.color || "#CD7F32" }} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{level.icon || "🏆"}</span>
                        <CardTitle className="text-lg text-foreground">{level.name}</CardTitle>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditLevel({ ...level }); setIsNew(false); }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteLevelMut.mutate(level.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-foreground">{level.min_points.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">puncte min</span>
                    </div>
                    {(level.discount_percentage ?? 0) > 0 && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">-{level.discount_percentage}% discount</Badge>
                    )}
                    {level.benefits && level.benefits.length > 0 && (
                      <ul className="space-y-1">
                        {level.benefits.map((b, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <Star className="w-3 h-3 text-primary mt-0.5 shrink-0" /> {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── HISTORY TAB ── */}
        <TabsContent value="history" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                <CardTitle className="text-foreground">Istoric Puncte ({filteredPoints.length})</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Caută user/acțiune..." value={searchPoints} onChange={(e) => setSearchPoints(e.target.value)} className="pl-9 w-52" />
                  </div>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate acțiunile</SelectItem>
                      {actionTypes.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5"><Download className="w-4 h-4" /> Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pointsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Utilizator</TableHead>
                      <TableHead>Puncte</TableHead>
                      <TableHead>Acțiune</TableHead>
                      <TableHead>Descriere</TableHead>
                      <TableHead>Comandă</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPoints.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(p.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.user_id.slice(0, 8)}…</TableCell>
                        <TableCell>
                          <span className={cn("font-bold font-mono", p.points > 0 ? "text-green-600" : "text-destructive")}>{p.points > 0 ? "+" : ""}{p.points}</span>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs bg-muted/50">{p.action}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{p.description || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.order_id ? `#${p.order_id.slice(0, 8)}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredPoints.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Nicio înregistrare.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Level Dialog */}
      <Dialog open={!!editLevel} onOpenChange={(open) => !open && setEditLevel(null)}>
        <DialogContent className="max-w-lg">
          {editLevel && (
            <>
              <DialogHeader>
                <DialogTitle>{isNew ? "Nivel nou de fidelitate" : `Editare: ${editLevel.name}`}</DialogTitle>
                <DialogDescription>Configurare nivel, puncte minime și beneficii</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nume nivel</Label><Input value={editLevel.name || ""} onChange={(e) => setEditLevel({ ...editLevel, name: e.target.value })} placeholder="ex: Gold" /></div>
                  <div><Label>Icon (emoji)</Label><Input value={editLevel.icon || ""} onChange={(e) => setEditLevel({ ...editLevel, icon: e.target.value })} placeholder="🏆" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Puncte minime</Label><Input type="number" value={editLevel.min_points || 0} onChange={(e) => setEditLevel({ ...editLevel, min_points: Number(e.target.value) })} /></div>
                  <div><Label>Discount (%)</Label><Input type="number" value={editLevel.discount_percentage || 0} onChange={(e) => setEditLevel({ ...editLevel, discount_percentage: Number(e.target.value) })} /></div>
                  <div>
                    <Label>Culoare</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={editLevel.color || "#CD7F32"} onChange={(e) => setEditLevel({ ...editLevel, color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={editLevel.color || "#CD7F32"} onChange={(e) => setEditLevel({ ...editLevel, color: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Beneficii</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={benefitInput} onChange={(e) => setBenefitInput(e.target.value)} placeholder="ex: Transport gratuit" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())} />
                    <Button type="button" variant="outline" size="sm" onClick={addBenefit}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {(editLevel.benefits || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(editLevel.benefits || []).map((b, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 pr-1">{b}<button onClick={() => removeBenefit(i)} className="ml-1 hover:text-destructive">×</button></Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{editLevel.icon || "🏆"}</span>
                    <div>
                      <p className="font-bold text-foreground">{editLevel.name || "Nivel"}</p>
                      <p className="text-xs text-muted-foreground">{(editLevel.min_points || 0).toLocaleString()} puncte · {editLevel.discount_percentage || 0}% discount</p>
                    </div>
                    <div className="w-4 h-4 rounded-full ml-auto" style={{ backgroundColor: editLevel.color || "#CD7F32" }} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditLevel(null)}>Anulează</Button>
                  <Button onClick={() => saveLevelMut.mutate(editLevel)} disabled={!editLevel.name?.trim()}>{isNew ? "Creează" : "Salvează"}</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
