import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Download, Sparkles, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminAIUsageStats() {
  const { data: logs = [] } = useQuery({
    queryKey: ["ai-usage-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_generator_log")
        .select("id, action_type, status, created_at, products(name)")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
  });

  const now = new Date();
  const thisMonth = logs.filter((l: any) => new Date(l.created_at).getMonth() === now.getMonth() && new Date(l.created_at).getFullYear() === now.getFullYear());
  const totalAll = logs.length;
  const totalMonth = thisMonth.length;
  const approved = logs.filter((l: any) => l.status === "approved" || l.status === "auto-saved").length;
  const rejected = logs.filter((l: any) => l.status === "rejected").length;
  const pending = logs.filter((l: any) => l.status === "pending").length;

  const exportCSV = () => {
    const headers = ["Data", "Produs", "Tip", "Status"];
    const rows = logs.map((l: any) => [
      new Date(l.created_at).toISOString(),
      (l.products as any)?.name || "",
      l.action_type,
      l.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: string) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Raport CSV exportat!");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Utilizare AI Generator
          </h2>
          <p className="text-sm text-muted-foreground">Statistici de utilizare — fără limită lunară</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <Sparkles className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalMonth}</p>
            <p className="text-xs text-muted-foreground">Generări luna aceasta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <BarChart3 className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalAll}</p>
            <p className="text-xs text-muted-foreground">Total all-time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{approved}</p>
            <p className="text-xs text-muted-foreground">Aprobate / salvate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{rejected}</p>
            <p className="text-xs text-muted-foreground">Respinse</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{pending}</p>
            <p className="text-xs text-muted-foreground">În așteptare</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Jurnal Generări Recente</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nicio generare înregistrată.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produs</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 100).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(l.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{(l.products as any)?.name || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{l.action_type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={l.status === "approved" || l.status === "auto-saved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                          {l.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium">ℹ️ Fără limite</p>
        <p>Generatorul AI nu are limită lunară de utilizări. Contorul este afișat doar informativ.</p>
      </div>
    </div>
  );
}
