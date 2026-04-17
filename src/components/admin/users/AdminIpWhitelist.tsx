import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminIpWhitelist() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [ips, setIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "ip_whitelist").maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) {
          const v = data.value_json as any;
          setEnabled(v.enabled || false);
          setIps(v.ips || []);
        }
      });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "ip_whitelist", value_json: { enabled, ips } as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast({ title: "IP Whitelist salvat" });
    setSaving(false);
  };

  const addIp = () => {
    if (newIp && !ips.includes(newIp)) {
      setIps([...ips, newIp]);
      setNewIp("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">IP Whitelist</h1>
          <p className="text-sm text-muted-foreground">Restricționare acces admin pe IP-uri specifice.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Shield className="w-4 h-4" />Activare IP Whitelist</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex gap-2">
            <Input placeholder="192.168.1.1" value={newIp} onChange={(e) => setNewIp(e.target.value)} className="max-w-xs" />
            <Button variant="outline" onClick={addIp}><Plus className="w-4 h-4 mr-1" /> Adaugă</Button>
          </div>
          <div className="space-y-2">
            {ips.map((ip, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded border bg-muted/30">
                <span className="font-mono text-sm">{ip}</span>
                <Button variant="ghost" size="sm" className="text-destructive h-6" onClick={() => setIps(ips.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
            {ips.length === 0 && <p className="text-sm text-muted-foreground">Niciun IP adăugat. Accesul este deschis.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
