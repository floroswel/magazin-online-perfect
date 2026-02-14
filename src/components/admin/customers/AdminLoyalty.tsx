import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star, Trophy, TrendingUp, Users, Plus, Pencil, Trash2,
  Award, Gift, Search, Download, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  name: "",
  min_points: 0,
  discount_percentage: 0,
  color: "#CD7F32",
  icon: "🥉",
  benefits: [],
};

export default function AdminLoyalty() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("levels");
  const [editLevel, setEditLevel] = useState<Partial<LoyaltyLevel> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [benefitInput, setBenefitInput] = useState("");
  const [searchPoints, setSearchPoints] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  // ── Queries ──
  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin-loyalty-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_levels")
        .select("*")
        .order("min_points", { ascending: true });
      if (error) throw error;
      return data as LoyaltyLevel[];
    },
  });

  const { data: points = [], isLoading: pointsLoading } = useQuery({
    queryKey: ["admin-loyalty-points"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as LoyaltyPoint[];
    },
  });

  // ── Aggregates ──
  const totalPointsIssued = points.reduce((s, p) => s + (p.points > 0 ? p.points : 0), 0);
  const totalPointsRedeemed = points.reduce((s, p) => s + (p.points < 0 ? Math.abs(p.points) : 0), 0);
  const uniqueUsers = new Set(points.map((p) => p.user_id)).size;
  const actionTypes = [...new Set(points.map((p) => p.action))].sort();

  // ── Level Mutations ──
  const saveLevelMut = useMutation({
    mutationFn: async (level: Partial<LoyaltyLevel>) => {
      const payload = {
        name: level.name!,
        min_points: level.min_points || 0,
        discount_percentage: level.discount_percentage || 0,
        color: level.color || "#CD7F32",
        icon: level.icon || "🥉",
        benefits: level.benefits || [],
      };
      if (level.id) {
        const { error } = await supabase.from("loyalty_levels").update(payload).eq("id", level.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("loyalty_levels").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-loyalty-levels"] });
      toast.success(isNew ? "Nivel creat" : "Nivel actualizat");
      setEditLevel(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLevelMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loyalty_levels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-loyalty-levels"] });
      toast.success("Nivel șters");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Filtered points ──
  const filteredPoints = points.filter((p) => {
    if (filterAction !== "all" && p.action !== filterAction) return false;
    if (searchPoints) {
      const q = searchPoints.toLowerCase();
      return (
        p.user_id.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        p.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Benefits helpers ──
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
      ...filteredPoints.map((p) => [
        format(new Date(p.created_at), "yyyy-MM-dd HH:mm"),
        p.user_id,
        String(p.points),
        p.action,
        p.description || "",
        p.order_id || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loyalty-points-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredPoints.length} înregistrări exportate`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Puncte Fidelitate</h1>
        <p className="text-sm text-muted-foreground">Administrare program loyalty: niveluri, puncte și membri</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Niveluri</p>
                <p className="text-2xl font-bold text-foreground">{levels.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-secondary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Puncte emise</p>
                <p className="text-2xl font-bold text-green-500">{totalPointsIssued.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Puncte folosite</p>
                <p className="text-2xl font-bold text-primary">{totalPointsRedeemed.toLocaleString()}</p>
              </div>
              <Gift className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Membri activi</p>
                <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="levels" className="gap-1.5"><Trophy className="w-4 h-4" /> Niveluri</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><ArrowUpDown className="w-4 h-4" /> Istoric puncte</TabsTrigger>
        </TabsList>

        {/* ── Levels Tab ── */}
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditLevel({ ...level }); setIsNew(false); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteLevelMut.mutate(level.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono-cyber text-foreground">{level.min_points.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">puncte min</span>
                    </div>
                    {(level.discount_percentage ?? 0) > 0 && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        -{level.discount_percentage}% discount
                      </Badge>
                    )}
                    {level.benefits && level.benefits.length > 0 && (
                      <ul className="space-y-1">
                        {level.benefits.map((b, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <Star className="w-3 h-3 text-secondary mt-0.5 shrink-0" />
                            {b}
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

        {/* ── Points History Tab ── */}
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
                  <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
                    <Download className="w-4 h-4" /> Export
                  </Button>
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
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(p.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.user_id.slice(0, 8)}…</TableCell>
                        <TableCell>
                          <span className={cn("font-bold font-mono-cyber", p.points > 0 ? "text-green-500" : "text-destructive")}>
                            {p.points > 0 ? "+" : ""}{p.points}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-muted/50">{p.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{p.description || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.order_id ? `#${p.order_id.slice(0, 8)}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredPoints.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Nicio înregistrare găsită.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit/Create Level Dialog ── */}
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
                  <div>
                    <Label>Nume nivel</Label>
                    <Input value={editLevel.name || ""} onChange={(e) => setEditLevel({ ...editLevel, name: e.target.value })} placeholder="ex: Gold" />
                  </div>
                  <div>
                    <Label>Icon (emoji)</Label>
                    <Input value={editLevel.icon || ""} onChange={(e) => setEditLevel({ ...editLevel, icon: e.target.value })} placeholder="🏆" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Puncte minime</Label>
                    <Input type="number" value={editLevel.min_points || 0} onChange={(e) => setEditLevel({ ...editLevel, min_points: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Discount (%)</Label>
                    <Input type="number" value={editLevel.discount_percentage || 0} onChange={(e) => setEditLevel({ ...editLevel, discount_percentage: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Culoare</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={editLevel.color || "#CD7F32"} onChange={(e) => setEditLevel({ ...editLevel, color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                      <Input value={editLevel.color || "#CD7F32"} onChange={(e) => setEditLevel({ ...editLevel, color: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <Label>Beneficii</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="ex: Transport gratuit"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {(editLevel.benefits || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(editLevel.benefits || []).map((b, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 pr-1">
                          {b}
                          <button onClick={() => removeBenefit(i)} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview */}
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
                  <Button onClick={() => saveLevelMut.mutate(editLevel)} disabled={!editLevel.name?.trim()}>
                    {isNew ? "Creează" : "Salvează"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
