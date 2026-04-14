import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, RefreshCw, User, Settings, ShoppingCart, Shield } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const actionIcons: Record<string, any> = {
  order_status_changed: ShoppingCart,
  settings_changed: Settings,
  role_granted: Shield,
  role_revoked: Shield,
  gdpr_data_deleted: User,
};

const actionLabels: Record<string, string> = {
  order_status_changed: "Status comandă modificat",
  settings_changed: "Setare modificată",
  role_granted: "Rol acordat",
  role_revoked: "Rol revocat",
  gdpr_data_deleted: "Date GDPR șterse",
};

export default function AdminAuditTimeline() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const load = async () => {
    setLoading(true);
    let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    if (filterType !== "all") query = query.eq("action", filterType);
    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><History className="w-5 h-5" /> Timeline Activitate Admin</h1>
          <p className="text-sm text-muted-foreground">Cine a modificat ce și când — vizualizare cronologică.</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtru acțiune" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate acțiunile</SelectItem>
              <SelectItem value="order_status_changed">Statusuri comenzi</SelectItem>
              <SelectItem value="settings_changed">Setări</SelectItem>
              <SelectItem value="role_granted">Roluri</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Niciun log înregistrat.</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {logs.map((log, i) => {
                const Icon = actionIcons[log.action] || Settings;
                return (
                  <div key={log.id} className="flex gap-3 pb-4 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      {i < logs.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{actionLabels[log.action] || log.action}</Badge>
                        <span className="text-xs text-muted-foreground">{log.entity_type} {log.entity_id ? `#${log.entity_id.slice(0, 8)}` : ""}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss", { locale: ro })}
                        {" · Actor: "}{log.actor_user_id?.slice(0, 8) || "sistem"}
                      </p>
                      {(log.before_json || log.after_json) && (
                        <div className="mt-1 text-xs bg-muted/50 rounded p-2 font-mono overflow-auto max-h-20">
                          {log.before_json && <span className="text-red-500">- {JSON.stringify(log.before_json)}</span>}
                          {log.before_json && log.after_json && <br />}
                          {log.after_json && <span className="text-green-500">+ {JSON.stringify(log.after_json)}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
