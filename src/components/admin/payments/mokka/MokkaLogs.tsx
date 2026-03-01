import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const PAGE_SIZE = 10;

const methodLabels: Record<string, string> = {
  register: "Register",
  checkout: "Checkout",
  finish: "Finish",
  cancel: "Cancel",
  return: "Return",
  callback: "Callback",
};

export default function MokkaLogs() {
  const [page, setPage] = useState(0);
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchOrderId, setSearchOrderId] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["mokka-logs", page, methodFilter, statusFilter, searchOrderId],
    queryFn: async () => {
      let query = supabase
        .from("mokka_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (methodFilter !== "all") query = query.eq("method", methodFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (searchOrderId) query = query.ilike("order_id", `%${searchOrderId}%`);

      const { data: logs, count, error } = await query;
      if (error) throw error;
      return { logs: logs || [], total: count || 0 };
    },
  });

  const logs = data?.logs || [];
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const statusColor = (status: string) => {
    if (status === "success") return "text-green-600 bg-green-50 border-green-200";
    if (status === "error") return "text-red-600 bg-red-50 border-red-200";
    return "text-yellow-600 bg-yellow-50 border-yellow-200";
  };

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ["Data", "Tip", "Status", "Order ID", "Eroare"];
    const rows = logs.map((l: any) => [
      format(new Date(l.created_at), "dd.MM.yyyy HH:mm:ss"),
      l.method,
      l.status,
      l.order_id || "",
      l.error_message || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mokka-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Log-uri Integrare Mokka</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" /> Exportă CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchOrderId}
              onChange={(e) => { setSearchOrderId(e.target.value); setPage(0); }}
              placeholder="Caută Order ID..."
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[130px] h-8 text-sm"><SelectValue placeholder="Tip" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              {Object.entries(methodLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[120px] h-8 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="success">Succes</SelectItem>
              <SelectItem value="error">Eroare</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Data/Ora</TableHead>
              <TableHead className="text-xs">Tip</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Order ID</TableHead>
              <TableHead className="text-xs text-right">Detalii</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Se încarcă...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Niciun log găsit.</TableCell></TableRow>
            ) : (
              logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">{format(new Date(log.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {methodLabels[log.method] || log.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColor(log.status)}`}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{log.order_id || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedLog(log)}>
                      ▶ Vezi
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterioare
            </Button>
            <span className="text-xs text-muted-foreground">Pagina {page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              Următoare <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* Detail modal */}
      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Detalii Request</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedLog.created_at), "dd.MM.yyyy HH:mm:ss")}
              </p>
              <div>
                <p className="font-semibold text-xs mb-1">REQUEST:</p>
                <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-40 font-mono">
                  {JSON.stringify(selectedLog.request_data, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-semibold text-xs mb-1">RESPONSE:</p>
                <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-40 font-mono">
                  {JSON.stringify(selectedLog.response_data, null, 2)}
                </pre>
              </div>
              {selectedLog.error_message && (
                <div>
                  <p className="font-semibold text-xs mb-1 text-red-600">EROARE:</p>
                  <p className="text-xs text-red-600">{selectedLog.error_message}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify({ request: selectedLog.request_data, response: selectedLog.response_data }, null, 2));
                    toast({ title: "JSON copiat" });
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copiază JSON
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
