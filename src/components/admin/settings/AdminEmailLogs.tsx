import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Mail, RefreshCw } from "lucide-react";

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const typeLabels: Record<string, string> = {
    order_placed: "Confirmare comandă",
    order_status: "Status comandă",
    shipping_update: "Expediere",
    welcome: "Bun venit",
    return_status: "Status retur",
    test: "Test",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Log-uri Email</h1>
          <p className="text-sm text-muted-foreground">Istoric email-uri tranzacționale trimise.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Niciun email trimis încă.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tip</TableHead>
                  <TableHead>Destinatar</TableHead>
                  <TableHead>Subiect</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[log.type] || log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.to_email}</TableCell>
                    <TableCell className="text-sm max-w-[250px] truncate">{log.subject}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={log.status === "sent"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-red-100 text-red-800 border-red-300"}
                      >
                        {log.status === "sent" ? "Trimis" : "Eroare"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd MMM HH:mm", { locale: ro })}
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
