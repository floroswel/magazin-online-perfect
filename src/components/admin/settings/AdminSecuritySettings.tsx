import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Save, Shield, Globe, Trash2, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSecuritySettings() {
  const [settings, setSettings] = useState({
    min_password_length: 8, require_uppercase: true, require_numbers: true,
    max_login_attempts: 5, lockout_duration_minutes: 30,
    enable_recaptcha: false, recaptcha_site_key: "",
    session_timeout_hours: 24, force_https: true,
    enable_rate_limiting: false, rate_limit_requests: 100, rate_limit_window_seconds: 60,
  });
  const [saving, setSaving] = useState(false);

  // IP Whitelist
  const [ipDialogOpen, setIpDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newIpLabel, setNewIpLabel] = useState("");
  const [ipList, setIpList] = useState<{ ip: string; label: string; added: string }[]>([]);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "security_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings(s => ({ ...s, ...(data.value_json as any) })); });
    supabase.from("app_settings").select("value_json").eq("key", "ip_whitelist").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setIpList((data.value_json as any) || []); });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "security_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast.success("Setări securitate salvate");
    setSaving(false);
  };

  const saveIpList = async (list: typeof ipList) => {
    setIpList(list);
    await supabase.from("app_settings").upsert({ key: "ip_whitelist", value_json: list as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
  };

  const addIp = () => {
    if (!newIp.trim()) return;
    const updated = [...ipList, { ip: newIp.trim(), label: newIpLabel.trim(), added: new Date().toISOString() }];
    saveIpList(updated);
    setNewIp(""); setNewIpLabel(""); setIpDialogOpen(false);
    toast.success("IP adăugat!");
  };

  const removeIp = (ip: string) => {
    saveIpList(ipList.filter(i => i.ip !== ip));
    toast.success("IP eliminat!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Securitate</h1>
          <p className="text-sm text-muted-foreground">Parolă, blocare, rate limiting, IP whitelist, reCAPTCHA.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <Tabs defaultValue="passwords">
        <TabsList><TabsTrigger value="passwords">Parole & Sesiuni</TabsTrigger><TabsTrigger value="ratelimit">Rate Limiting</TabsTrigger><TabsTrigger value="ipwhitelist">IP Whitelist</TabsTrigger><TabsTrigger value="recaptcha">reCAPTCHA</TabsTrigger></TabsList>

        <TabsContent value="passwords" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Politici parole</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Lungime minimă parolă</Label><Input type="number" value={settings.min_password_length} onChange={e => setSettings(s => ({ ...s, min_password_length: +e.target.value }))} /></div>
                <div><Label>Încercări max. login</Label><Input type="number" value={settings.max_login_attempts} onChange={e => setSettings(s => ({ ...s, max_login_attempts: +e.target.value }))} /></div>
              </div>
              <div className="flex items-center justify-between"><Label>Literă mare obligatorie</Label><Switch checked={settings.require_uppercase} onCheckedChange={v => setSettings(s => ({ ...s, require_uppercase: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Cifre obligatorii</Label><Switch checked={settings.require_numbers} onCheckedChange={v => setSettings(s => ({ ...s, require_numbers: v }))} /></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Blocare cont (minute)</Label><Input type="number" value={settings.lockout_duration_minutes} onChange={e => setSettings(s => ({ ...s, lockout_duration_minutes: +e.target.value }))} /></div>
                <div><Label>Timeout sesiune (ore)</Label><Input type="number" value={settings.session_timeout_hours} onChange={e => setSettings(s => ({ ...s, session_timeout_hours: +e.target.value }))} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratelimit" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Rate Limiting</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Activare rate limiting</Label><Switch checked={settings.enable_rate_limiting} onCheckedChange={v => setSettings(s => ({ ...s, enable_rate_limiting: v }))} /></div>
              {settings.enable_rate_limiting && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label>Cereri maxime</Label><Input type="number" value={settings.rate_limit_requests} onChange={e => setSettings(s => ({ ...s, rate_limit_requests: +e.target.value }))} /></div>
                  <div><Label>Fereastră de timp (secunde)</Label><Input type="number" value={settings.rate_limit_window_seconds} onChange={e => setSettings(s => ({ ...s, rate_limit_window_seconds: +e.target.value }))} /></div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Limitează numărul de cereri per IP pentru a preveni abuzurile.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ipwhitelist" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" />IP Whitelist Admin</CardTitle>
              <Dialog open={ipDialogOpen} onOpenChange={setIpDialogOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă IP</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adaugă IP în whitelist</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Adresă IP</Label><Input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="Ex: 192.168.1.1" /></div>
                    <div><Label>Etichetă (opțional)</Label><Input value={newIpLabel} onChange={e => setNewIpLabel(e.target.value)} placeholder="Ex: Birou central" /></div>
                  </div>
                  <DialogFooter><Button onClick={addIp} disabled={!newIp.trim()}>Adaugă</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {ipList.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Niciun IP în whitelist. Toate IP-urile au acces.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>IP</TableHead><TableHead>Etichetă</TableHead><TableHead>Adăugat</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ipList.map(ip => (
                      <TableRow key={ip.ip}>
                        <TableCell className="font-mono text-sm">{ip.ip}</TableCell>
                        <TableCell className="text-sm">{ip.label || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(ip.added).toLocaleDateString("ro-RO")}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeIp(ip.ip)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recaptcha" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">reCAPTCHA</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Activare reCAPTCHA</Label><Switch checked={settings.enable_recaptcha} onCheckedChange={v => setSettings(s => ({ ...s, enable_recaptcha: v }))} /></div>
              {settings.enable_recaptcha && <div><Label>Site Key</Label><Input value={settings.recaptcha_site_key} onChange={e => setSettings(s => ({ ...s, recaptcha_site_key: e.target.value }))} /></div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
