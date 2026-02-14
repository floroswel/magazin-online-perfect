import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Eye, Clock, User, ArrowRight, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const actionColors: Record<string, string> = {
  create: "bg-green-500/15 text-green-500 border-green-500/30",
  update: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  delete: "bg-red-500/15 text-red-500 border-red-500/30",
  login: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  export: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
};

const actionLabels: Record<string, string> = {
  create: "Creare",
  update: "Actualizare",
  delete: "Ștergere",
  login: "Autentificare",
  export: "Export",
};

export default function AdminAuditLog() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [detail, setDetail] = useState<any>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const entityTypes = [...new Set(logs.map((l: any) => l.entity_type))].sort();
  const actionTypes = [...new Set(logs.map((l: any) => l.action))].sort();

  const filtered = logs.filter((l: any) => {
    if (filterAction !== "all" && l.action !== filterAction) return false;
    if (filterEntity !== "all" && l.entity_type !== filterEntity) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.entity_type.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.actor_user_id.toLowerCase().includes(q) ||
        (l.entity_id || "").toLowerCase().includes(q) ||
        JSON.stringify(l.after_json || {}).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    if (!filtered.length) { toast.error("Nicio înregistrare"); return; }
    const rows = [
      ["Timestamp", "Utilizator", "Acțiune", "Entitate", "ID Entitate", "IP"],
      ...filtered.map((l: any) => [
        format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
        l.actor_user_id,
        l.action,
        l.entity_type,
        l.entity_id || "",
        l.ip_address || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} înregistrări exportate`);
  };

  const renderJsonDiff = (before: any, after: any) => {
    if (!before && !after) return <p className="text-sm text-muted-foreground">Fără date</p>;

    const allKeys = [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])].sort();

    return (
      <div className="space-y-1 font-mono text-xs">
        {allKeys.map((key) => {
          const bVal = before?.[key];
          const aVal = after?.[key];
          const bStr = bVal !== undefined ? JSON.stringify(bVal) : undefined;
          const aStr = aVal !== undefined ? JSON.stringify(aVal) : undefined;
          const changed = bStr !== aStr;

          if (!changed) {
            return (
              <div key={key} className="flex gap-2 px-2 py-0.5 text-muted-foreground">
                <span className="w-1 shrink-0" />
                <span className="min-w-[120px] font-medium">{key}:</span>
                <span className="break-all">{aStr}</span>
              </div>
            );
          }

          return (
            <div key={key} className="space-y-0.5">
              {bStr !== undefined && (
                <div className="flex gap-2 px-2 py-0.5 bg-red-500/10 rounded">
                  <span className="w-1 shrink-0 bg-red-500 rounded" />
                  <span className="min-w-[120px] font-medium text-red-400">{key}:</span>
                  <span className="text-red-400 break-all">{bStr}</span>
                </div>
              )}
              {aStr !== undefined && (
                <div className="flex gap-2 px-2 py-0.5 bg-green-500/10 rounded">
                  <span className="w-1 shrink-0 bg-green-500 rounded" />
                  <span className="min-w-[120px] font-medium text-green-400">{key}:</span>
                  <span className="text-green-400 break-all">{aStr}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Istoric complet: cine a schimbat ce, când și ce valori</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total acțiuni</p>
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Creări</p>
          <p className="text-2xl font-bold text-green-500">{logs.filter((l: any) => l.action === "create").length}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Actualizări</p>
          <p className="text-2xl font-bold text-blue-500">{logs.filter((l: any) => l.action === "update").length}</p>
        </CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Ștergeri</p>
          <p className="text-2xl font-bold text-red-500">{logs.filter((l: any) => l.action === "delete").length}</p>
        </CardContent></Card>
      </div>

      {/* Filters & Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <CardTitle className="text-foreground">Înregistrări ({filtered.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Caută..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-52" />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-40"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate acțiunile</SelectItem>
                  {actionTypes.map((a) => <SelectItem key={a} value={a}>{actionLabels[a] || a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate entitățile</SelectItem>
                  {entityTypes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Utilizator</TableHead>
                  <TableHead>Acțiune</TableHead>
                  <TableHead>Entitate</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Detalii</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log: any) => (
                  <TableRow key={log.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss", { locale: ro })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono text-xs text-muted-foreground">{log.actor_user_id.slice(0, 8)}…</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs border", actionColors[log.action] || "bg-muted text-muted-foreground")}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{log.entity_type}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.entity_id?.slice(0, 8) || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetail(log)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Nicio înregistrare găsită.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("border", actionColors[detail.action] || "")}>
                    {actionLabels[detail.action] || detail.action}
                  </Badge>
                  <span>{detail.entity_type}</span>
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(detail.created_at), "dd MMMM yyyy, HH:mm:ss", { locale: ro })}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Utilizator</p>
                  <p className="font-mono text-xs text-foreground break-all">{detail.actor_user_id}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">ID Entitate</p>
                  <p className="font-mono text-xs text-foreground break-all">{detail.entity_id || "—"}</p>
                </div>
                {detail.ip_address && (
                  <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                    <p className="font-mono text-xs text-foreground">{detail.ip_address}</p>
                  </div>
                )}
              </div>

              {/* Before / After Diff */}
              <div className="flex-1 min-h-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-foreground">Modificări</span>
                  {detail.before_json && <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">Înainte</Badge>}
                  {detail.before_json && detail.after_json && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  {detail.after_json && <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">După</Badge>}
                </div>
                <ScrollArea className="h-[300px] rounded-lg border border-border bg-muted/20 p-3">
                  {renderJsonDiff(detail.before_json, detail.after_json)}
                </ScrollArea>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
