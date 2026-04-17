import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Download, Users, Zap } from "lucide-react";

interface Member {
  user_id: string;
  added_at: string;
  email?: string;
  full_name?: string;
  total_spent?: number;
}

export default function AdminCustomerGroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    const load = async () => {
      const { data: g } = await supabase.from("customer_groups").select("*").eq("id", groupId).maybeSingle();
      setGroup(g);

      const { data: mems } = await supabase.from("customer_group_members").select("*").eq("group_id", groupId).order("added_at", { ascending: false });

      if (mems && mems.length > 0) {
        const userIds = mems.map(m => m.user_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

        // Get order totals
        const { data: orders } = await supabase.from("orders").select("user_id, total").in("user_id", userIds);
        const spentMap = new Map<string, number>();
        orders?.forEach(o => spentMap.set(o.user_id, (spentMap.get(o.user_id) || 0) + Number(o.total)));

        setMembers(mems.map(m => ({
          ...m,
          full_name: profileMap.get(m.user_id)?.full_name || "-",
          total_spent: spentMap.get(m.user_id) || 0,
        })));
      }
      setLoading(false);
    };
    load();
  }, [groupId]);

  const exportCSV = () => {
    if (!members.length) return;
    const header = "Nume,Email,Total cheltuit,Data adăugare\n";
    const rows = members.map(m => `"${m.full_name}","${m.email || ""}",${m.total_spent || 0},${m.added_at}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grup-${group?.slug || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportat");
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>;
  if (!group) return <div className="text-center py-12 text-muted-foreground">Grupul nu a fost găsit.</div>;

  const rules = Array.isArray(group.rules) ? group.rules : [];
  const benefits = group.benefits && typeof group.benefits === "object" ? group.benefits : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/customers/groups")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <Badge className={group.color || ""}>{group.type === "dynamic" ? "Dinamic" : "Manual"}</Badge>
          </div>
          {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Membri</p>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </CardContent></Card>
        <Card className="border-border bg-card"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Discount</p>
          <p className="text-2xl font-bold text-foreground">{group.discount_percentage || 0}%</p>
        </CardContent></Card>
        <Card className="border-border bg-card"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Venituri grup</p>
          <p className="text-2xl font-bold text-foreground">{members.reduce((s, m) => s + (m.total_spent || 0), 0).toLocaleString("ro-RO")} lei</p>
        </CardContent></Card>
        <Card className="border-border bg-card"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Ultima sincronizare</p>
          <p className="text-sm font-medium text-foreground">{group.last_sync_at ? new Date(group.last_sync_at).toLocaleString("ro-RO") : "N/A"}</p>
        </CardContent></Card>
      </div>

      {/* Rules (for dynamic) */}
      {group.type === "dynamic" && rules.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" /> Reguli dinamice</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rules.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-2 rounded">
                  <Badge variant="outline">{r.field}</Badge>
                  <span className="text-muted-foreground">= {r.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      {(group.discount_percentage > 0 || benefits.free_shipping || benefits.welcome_message) && (
        <Card className="border-border bg-card">
          <CardHeader><CardTitle>Beneficii grup</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {group.discount_percentage > 0 && <p>✅ Discount automat: <strong>{group.discount_percentage}%</strong></p>}
            {benefits.free_shipping && <p>✅ Transport gratuit</p>}
            {benefits.early_access_hours > 0 && <p>✅ Acces anticipat: {benefits.early_access_hours} ore</p>}
            {benefits.welcome_message && <p>✅ Mesaj: „{benefits.welcome_message}"</p>}
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Membri ({members.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1" /> Export CSV</Button>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Niciun membru în acest grup.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Nume</TableHead>
                  <TableHead className="text-right">Total cheltuit</TableHead>
                  <TableHead className="text-right">Data adăugare</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.user_id} className="border-border">
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="text-right font-mono">{(m.total_spent || 0).toLocaleString("ro-RO")} lei</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{m.added_at ? new Date(m.added_at).toLocaleDateString("ro-RO") : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/customers/detail/${m.user_id}`)}>Fișă</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
