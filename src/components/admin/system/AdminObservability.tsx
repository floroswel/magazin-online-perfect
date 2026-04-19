import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { withRetry } from "@/lib/retry";

interface ErrorRow {
  id: string;
  created_at: string;
  level: string;
  message: string;
  url: string | null;
  fingerprint: string | null;
  resolved: boolean;
}

interface UptimeRow {
  id: string;
  created_at: string;
  endpoint: string;
  is_healthy: boolean;
  response_time_ms: number | null;
  status_code: number | null;
}

interface HealthRow {
  id: string;
  created_at: string;
  check_name: string;
  status: string;
  duration_ms: number | null;
  details_json: any;
}

export default function AdminObservability() {
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [uptime, setUptime] = useState<UptimeRow[]>([]);
  const [health, setHealth] = useState<HealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const [eRes, uRes, hRes] = await Promise.all([
      supabase.from("error_log").select("id,created_at,level,message,url,fingerprint,resolved")
        .order("created_at", { ascending: false }).limit(50),
      supabase.from("uptime_log").select("id,created_at,endpoint,is_healthy,response_time_ms,status_code")
        .order("created_at", { ascending: false }).limit(20),
      supabase.from("health_check_results").select("id,created_at,check_name,status,duration_ms,details_json")
        .order("created_at", { ascending: false }).limit(30),
    ]);
    setErrors((eRes.data as ErrorRow[]) ?? []);
    setUptime((uRes.data as UptimeRow[]) ?? []);
    setHealth((hRes.data as HealthRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runHealthCheck = async () => {
    setRunning(true);
    try {
      await withRetry(async () => {
        const { error } = await supabase.functions.invoke("health-check");
        if (error) throw error;
      }, { attempts: 2, timeoutMs: 15000 });
      await load();
    } finally {
      setRunning(false);
    }
  };

  const markResolved = async (id: string) => {
    await supabase.from("error_log").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
    await load();
  };

  const errorCount24h = errors.filter((e) => Date.now() - new Date(e.created_at).getTime() < 86_400_000).length;
  const lastUptime = uptime[0];
  const uptimePct = uptime.length ? Math.round((uptime.filter((u) => u.is_healthy).length / uptime.length) * 100) : 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Observabilitate</h1>
          <p className="text-sm text-muted-foreground">Monitorizare erori, uptime și health checks</p>
        </div>
        <Button onClick={runHealthCheck} disabled={running} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
          Rulează health check
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertCircle className="h-4 w-4" />Erori 24h</div>
          <div className="text-3xl font-bold mt-2">{errorCount24h}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="h-4 w-4" />Uptime (ultimele {uptime.length})</div>
          <div className="text-3xl font-bold mt-2">{uptimePct}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" />Status curent</div>
          <div className="text-3xl font-bold mt-2">
            {lastUptime ? (
              lastUptime.is_healthy ? <Badge variant="default" className="bg-success text-success-foreground">OK</Badge>
              : <Badge variant="destructive">DOWN</Badge>
            ) : <Badge variant="secondary">N/A</Badge>}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Erori recente</h2>
        {loading ? <div className="text-sm text-muted-foreground">Se încarcă…</div> :
         errors.length === 0 ? <div className="text-sm text-muted-foreground">Nicio eroare înregistrată ✓</div> :
         <div className="divide-y divide-border max-h-96 overflow-y-auto">
           {errors.map((e) => (
             <div key={e.id} className="py-2 flex items-start gap-3">
               <Badge variant={e.level === "fatal" || e.level === "error" ? "destructive" : "secondary"}>
                 {e.level}
               </Badge>
               <div className="flex-1 min-w-0">
                 <div className="text-sm font-medium truncate">{e.message}</div>
                 <div className="text-xs text-muted-foreground">
                   {new Date(e.created_at).toLocaleString("ro-RO")} · {e.url ?? "-"}
                 </div>
               </div>
               {!e.resolved && (
                 <Button size="sm" variant="outline" onClick={() => markResolved(e.id)}>Rezolvat</Button>
               )}
             </div>
           ))}
         </div>}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Health checks (ultimele 30)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          {health.slice(0, 9).map((h) => (
            <div key={h.id} className="flex items-center justify-between p-2 rounded border border-border">
              <div>
                <div className="font-medium">{h.check_name}</div>
                <div className="text-xs text-muted-foreground">{h.duration_ms}ms · {new Date(h.created_at).toLocaleTimeString("ro-RO")}</div>
              </div>
              <Badge variant={h.status === "ok" ? "default" : h.status === "degraded" ? "secondary" : "destructive"}
                className={h.status === "ok" ? "bg-success text-success-foreground" : ""}>
                {h.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
