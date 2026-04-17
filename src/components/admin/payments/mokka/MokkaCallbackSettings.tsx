import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mokka-checkout`;

export default function MokkaCallbackSettings() {
  const [showAll, setShowAll] = useState(false);

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["mokka-callback-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mokka_logs")
        .select("*")
        .eq("method", "callback")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const copyUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    toast({ title: "URL copiat în clipboard" });
  };

  const statusColor = (status: string) => {
    if (status === "success") return "text-green-600 bg-green-50 border-green-200";
    if (status === "error") return "text-red-600 bg-red-50 border-red-200";
    return "text-yellow-600 bg-yellow-50 border-yellow-200";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Setare Callback (Webhook)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            URL-ul de notificare care trebuie configurat în platforma Mokka:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded border font-mono break-all">
              {callbackUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copyUrl}>
              <Copy className="w-3.5 h-3.5 mr-1" /> Copiază
            </Button>
          </div>
        </div>

        {recentLogs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Ultimele notificări recepționate</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Order ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{format(new Date(log.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColor(log.status)}`}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{log.order_id || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
