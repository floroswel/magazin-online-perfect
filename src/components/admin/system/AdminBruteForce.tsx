import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Trash2, RefreshCw } from "lucide-react";

export default function AdminBruteForce() {
  const qc = useQueryClient();

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["admin-login-attempts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("login_attempts")
        .select("*")
        .order("attempted_at", { ascending: false })
        .limit(200);
      return (data as any[]) || [];
    },
  });

  // Group by IP to find blocked IPs
  const ipGroups = attempts.reduce((acc: Record<string, any[]>, a: any) => {
    if (!acc[a.ip_address]) acc[a.ip_address] = [];
    acc[a.ip_address].push(a);
    return acc;
  }, {});

  const blockedIPs = Object.entries(ipGroups).filter(([, attempts]) => {
    const recent = (attempts as any[]).filter(
      (a: any) => !a.success && new Date(a.attempted_at).getTime() > Date.now() - 15 * 60 * 1000
    );
    return recent.length >= 5;
  });

  const clearIP = useMutation({
    mutationFn: async (ip: string) => {
      await supabase.from("login_attempts").delete().eq("ip_address", ip);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-login-attempts"] });
      toast.success("IP deblocat");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5" /> Protecție Brute Force</h1>
          <p className="text-sm text-muted-foreground">Monitorizare încercări de autentificare și IP-uri blocate</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin-login-attempts"] })}>
          <RefreshCw className="w-4 h-4 mr-1" /> Reîmprospătează
        </Button>
      </div>

      {/* Blocked IPs */}
      <Card>
        <CardHeader><CardTitle className="text-base">IP-uri blocate ({blockedIPs.length})</CardTitle></CardHeader>
        <CardContent>
          {blockedIPs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Niciun IP blocat momentan.</p>
          ) : (
            <div className="space-y-2">
              {blockedIPs.map(([ip]) => (
                <div key={ip} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                  <div>
                    <span className="font-mono text-sm">{ip}</span>
                    <Badge variant="destructive" className="ml-2">Blocat</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => clearIP.mutate(ip)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Deblochează
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent attempts */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ultimele încercări de autentificare</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Se încarcă...</p> : (
            <div className="border rounded overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">IP</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Data/Ora</th>
                    <th className="p-2 text-left">Rezultat</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.slice(0, 50).map((a: any) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-2 font-mono">{a.ip_address}</td>
                      <td className="p-2">{a.email || "—"}</td>
                      <td className="p-2">{new Date(a.attempted_at).toLocaleString("ro-RO")}</td>
                      <td className="p-2">
                        <Badge variant={a.success ? "default" : "destructive"}>
                          {a.success ? "✅ Succes" : "❌ Eșuat"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
