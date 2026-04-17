import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Gift, TrendingUp } from "lucide-react";

export default function AdminReferrals() {
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["admin-referrals"],
    queryFn: async () => {
      const { data } = await supabase.from("referrals").select("*").order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const completed = referrals.filter((r: any) => r.status === "completed");
  const pending = referrals.filter((r: any) => r.status === "pending");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Program de Recomandare</h1>
        <p className="text-sm text-muted-foreground">Recomandă un prieten — ambii primesc recompensă.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{referrals.length}</p><p className="text-xs text-muted-foreground">Total recomandări</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Gift className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-muted-foreground">Completate</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="w-8 h-8 text-amber-500" /><div><p className="text-2xl font-bold">{pending.length}</p><p className="text-xs text-muted-foreground">În așteptare</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toate recomandările</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cod</TableHead>
                <TableHead>Email recomandat</TableHead>
                <TableHead>Recompensă referrer</TableHead>
                <TableHead>Recompensă referit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : referrals.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nicio recomandare încă.</TableCell></TableRow>
              ) : referrals.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.referral_code}</TableCell>
                  <TableCell>{r.referred_email || "—"}</TableCell>
                  <TableCell>{r.referrer_reward_value}{r.referrer_reward_type === "percentage" ? "%" : " RON"}</TableCell>
                  <TableCell>{r.referred_reward_value}{r.referred_reward_type === "percentage" ? "%" : " RON"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                      {r.status === "completed" ? "Completat" : r.status === "pending" ? "În așteptare" : r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
