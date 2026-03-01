import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldBan, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BlacklistEntry {
  id: string;
  email: string | null;
  phone: string | null;
  ip_address: string | null;
  reason: string;
  blocked_actions: string[];
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export default function AdminBlacklist() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: "", phone: "", ip_address: "", reason: "" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("customer_blacklist").select("*").order("created_at", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const add = async () => {
    if (!form.reason.trim()) { toast.error("Motivul este obligatoriu"); return; }
    if (!form.email && !form.phone && !form.ip_address) { toast.error("Completează cel puțin email, telefon sau IP"); return; }
    setAdding(true);
    const { error } = await supabase.from("customer_blacklist").insert({
      email: form.email || null,
      phone: form.phone || null,
      ip_address: form.ip_address || null,
      reason: form.reason,
    });
    if (error) { toast.error(error.message); }
    else {
      toast.success("Adăugat în blacklist");
      setForm({ email: "", phone: "", ip_address: "", reason: "" });
      fetch();
    }
    setAdding(false);
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("customer_blacklist").update({ is_active }).eq("id", id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_active } : e));
    toast.success(is_active ? "Blocat" : "Deblocat");
  };

  const remove = async (id: string) => {
    await supabase.from("customer_blacklist").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success("Șters din blacklist");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldBan className="w-6 h-6 text-destructive" />
          Blacklist Clienți
        </h1>
        <p className="text-sm text-muted-foreground">Blochează accesul clienților problematici la plasarea de comenzi</p>
      </div>

      <Card className="border-border">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Adaugă în blacklist</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@email.com" /></div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+40 7xx xxx xxx" /></div>
            <div><Label>Adresă IP</Label><Input value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} placeholder="192.168.1.1" /></div>
          </div>
          <div><Label>Motiv blocare *</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Ex: Comenzi multiple cu ramburs refuzat" /></div>
          <Button onClick={add} disabled={adding}>
            {adding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se adaugă...</> : <><Plus className="w-4 h-4 mr-2" /> Adaugă</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
          ) : entries.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Lista de blacklist este goală.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email / Telefon / IP</TableHead>
                  <TableHead>Motiv</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="space-y-0.5 text-sm">
                        {e.email && <p>{e.email}</p>}
                        {e.phone && <p className="text-muted-foreground">{e.phone}</p>}
                        {e.ip_address && <p className="text-muted-foreground font-mono text-xs">{e.ip_address}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{e.reason}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(e.created_at).toLocaleDateString("ro-RO")}</TableCell>
                    <TableCell>
                      <Switch checked={e.is_active} onCheckedChange={v => toggle(e.id, v)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => remove(e.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
