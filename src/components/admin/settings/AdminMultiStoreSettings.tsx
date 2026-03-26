import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Globe, Plus, Trash2, Languages } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS = {
  multi_store_enabled: false,
  multi_language_enabled: true,
  default_language: "ro",
  default_currency: "RON",
  auto_detect_language: true,
  auto_detect_currency: false,
};

export default function AdminMultiStoreSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [stores, setStores] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([
    { code: "ro", name: "Română", active: true, default: true },
    { code: "en", name: "English", active: true, default: false },
    { code: "hu", name: "Magyar", active: false, default: false },
    { code: "de", name: "Deutsch", active: false, default: false },
  ]);
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: "", domain: "", language: "ro", currency: "RON" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "multi_store_settings").maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) {
          const d = data.value_json as any;
          if (d.settings) setSettings(s => ({ ...s, ...d.settings }));
          if (d.stores) setStores(d.stores);
          if (d.languages) setLanguages(d.languages);
        }
      });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({
      key: "multi_store_settings",
      value_json: { settings, stores, languages } as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    toast.success("Setări Multi-Store salvate!");
    setSaving(false);
  };

  const addStore = () => {
    if (!storeForm.name.trim()) return;
    setStores(s => [...s, { ...storeForm, id: crypto.randomUUID(), active: true }]);
    setStoreForm({ name: "", domain: "", language: "ro", currency: "RON" });
    setStoreDialogOpen(false);
  };

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));
  const toggleLang = (code: string) => setLanguages(l => l.map(x => x.code === code ? { ...x, active: !x.active } : x));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5" /> Multi-Store & Multi-Language</h1>
          <p className="text-sm text-muted-foreground">Gestionează mai multe magazine, limbi și monede dintr-un singur panou.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" /> Multi-Store</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Activare Multi-Store</Label><Switch checked={settings.multi_store_enabled} onCheckedChange={v => set("multi_store_enabled", v)} /></div>
            {settings.multi_store_enabled && (
              <>
                <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
                  <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Magazin nou</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adaugă magazin</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Nume magazin</Label><Input value={storeForm.name} onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div><Label>Domeniu</Label><Input value={storeForm.domain} onChange={e => setStoreForm(f => ({ ...f, domain: e.target.value }))} placeholder="shop.exemplu.ro" /></div>
                      <div><Label>Limba</Label><Input value={storeForm.language} onChange={e => setStoreForm(f => ({ ...f, language: e.target.value }))} /></div>
                      <div><Label>Moneda</Label><Input value={storeForm.currency} onChange={e => setStoreForm(f => ({ ...f, currency: e.target.value }))} /></div>
                    </div>
                    <DialogFooter><Button onClick={addStore}>Adaugă</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                {stores.length > 0 && (
                  <Table>
                    <TableHeader><TableRow><TableHead>Magazin</TableHead><TableHead>Domeniu</TableHead><TableHead>Limbă</TableHead><TableHead>Monedă</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {stores.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-sm font-mono">{s.domain || "—"}</TableCell>
                          <TableCell>{s.language}</TableCell>
                          <TableCell>{s.currency}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setStores(st => st.filter(x => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Languages className="w-4 h-4" /> Limbi & Localizare</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Multi-Language activ</Label><Switch checked={settings.multi_language_enabled} onCheckedChange={v => set("multi_language_enabled", v)} /></div>
            <div>
              <Label>Limba implicită</Label>
              <Select value={settings.default_language} onValueChange={v => set("default_language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ro">Română</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hu">Magyar</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><Label>Detectare automată limbă</Label><Switch checked={settings.auto_detect_language} onCheckedChange={v => set("auto_detect_language", v)} /></div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Limbi disponibile</Label>
              {languages.map(lang => (
                <div key={lang.code} className="flex items-center justify-between py-1">
                  <span className="text-sm">{lang.name} ({lang.code})</span>
                  <div className="flex items-center gap-2">
                    {lang.default && <Badge variant="default" className="text-xs">Implicit</Badge>}
                    <Switch checked={lang.active} onCheckedChange={() => toggleLang(lang.code)} disabled={lang.default} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
