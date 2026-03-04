import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("health_logs").select("*").order("created_at", { ascending: false }).limit(100);
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const levelColor: Record<string, string> = {
    info: "bg-blue-100 text-blue-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Logs & Health</h1>
          <p className="text-sm text-muted-foreground">Logs integrare, diagnosticare erori.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Niciun log înregistrat.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><Badge variant="outline" className={levelColor[log.level] || ""}>{log.level}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{log.scope}</TableCell>
                    <TableCell className="text-sm max-w-md truncate">{log.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(log.created_at), "dd MMM HH:mm", { locale: ro })}</TableCell>
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
