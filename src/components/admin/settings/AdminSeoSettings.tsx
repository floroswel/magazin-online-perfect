import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, Upload, ExternalLink, Search, Globe, FileText, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export default function AdminSeoSettings() {
  const [tab, setTab] = useState("general");
  const [settings, setSettings] = useState({
    site_title: "",
    site_description: "",
    meta_title_template: "{product_name} | {store_name}",
    og_image: "",
    robots_txt: "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /cart\nSitemap: /sitemap.xml",
    canonical_url: "",
    google_verification: "",
    bing_verification: "",
    schema_org_type: "Store",
    ga_id: "",
  });
  const [saving, setSaving] = useState(false);

  // Redirects
  const [redirects, setRedirects] = useState<any[]>([]);
  const [rdOpen, setRdOpen] = useState(false);
  const [rdForm, setRdForm] = useState({ source_url: "", target_url: "", redirect_type: "301", notes: "" });
  const [rdSearch, setRdSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "seo_settings").maybeSingle()
      .then(({ data }) => { if (data?.value_json) setSettings(s => ({ ...s, ...(data.value_json as any) })); });
    loadRedirects();
  }, []);

  const loadRedirects = async () => {
    const { data } = await (supabase as any).from("seo_redirects").select("*").order("created_at", { ascending: false });
    setRedirects(data || []);
  };

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert({ key: "seo_settings", value_json: settings as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    toast.success("Setări SEO salvate");
    setSaving(false);
  };

  const saveRedirect = async () => {
    if (!rdForm.source_url || !rdForm.target_url) { toast.error("Completează ambele URL-uri"); return; }
    await (supabase as any).from("seo_redirects").insert({
      source_url: rdForm.source_url.startsWith("/") ? rdForm.source_url : "/" + rdForm.source_url,
      target_url: rdForm.target_url,
      redirect_type: Number(rdForm.redirect_type),
      notes: rdForm.notes || null,
    });
    toast.success("Redirect adăugat");
    setRdOpen(false);
    setRdForm({ source_url: "", target_url: "", redirect_type: "301", notes: "" });
    loadRedirects();
  };

  const deleteRedirect = async (id: string) => {
    if (!confirm("Șterge redirectul?")) return;
    await (supabase as any).from("seo_redirects").delete().eq("id", id);
    loadRedirects();
  };

  const importRedirects = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1).filter(l => l.trim());
    let count = 0;
    for (const line of lines) {
      const [source, target, type] = line.split(",").map(s => s.trim());
      if (source && target) {
        await (supabase as any).from("seo_redirects").upsert(
          { source_url: source, target_url: target, redirect_type: Number(type) || 301 },
          { onConflict: "source_url" }
        );
        count++;
      }
    }
    toast.success(`${count} redirect-uri importate`);
    loadRedirects();
    if (fileRef.current) fileRef.current.value = "";
  };

  const filteredRedirects = redirects.filter((r: any) =>
    !rdSearch || r.source_url.includes(rdSearch) || r.target_url.includes(rdSearch)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5" /> SEO Global</h1>
          <p className="text-sm text-muted-foreground">Meta defaults, verificări, robots.txt, redirect-uri.</p>
        </div>
        <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="general"><FileText className="w-4 h-4 mr-1" />General</TabsTrigger>
          <TabsTrigger value="redirects"><ArrowRightLeft className="w-4 h-4 mr-1" />Redirect-uri ({redirects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Meta Defaults</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Titlu site</Label><Input value={settings.site_title} onChange={e => setSettings(s => ({ ...s, site_title: e.target.value }))} placeholder="Magazinul Meu Online" /></div>
                <div><Label>URL Canonic (baza)</Label><Input value={settings.canonical_url} onChange={e => setSettings(s => ({ ...s, canonical_url: e.target.value }))} placeholder="https://magazin.ro" /></div>
              </div>
              <div><Label>Template meta title produs</Label><Input value={settings.meta_title_template} onChange={e => setSettings(s => ({ ...s, meta_title_template: e.target.value }))} placeholder="{product_name} | {store_name}" /><p className="text-[10px] text-muted-foreground mt-1">Variabile: {"{product_name}"}, {"{category_name}"}, {"{store_name}"}</p></div>
              <div><Label>Descriere site (meta description fallback)</Label><Textarea value={settings.site_description} onChange={e => setSettings(s => ({ ...s, site_description: e.target.value }))} rows={2} /></div>
              <div><Label>OG Image default</Label><Input value={settings.og_image} onChange={e => setSettings(s => ({ ...s, og_image: e.target.value }))} placeholder="https://..." /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Verificări & Tracking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Google Search Console</Label><Input value={settings.google_verification} onChange={e => setSettings(s => ({ ...s, google_verification: e.target.value }))} placeholder="google-site-verification=..." /></div>
                <div><Label>Bing Webmaster</Label><Input value={settings.bing_verification} onChange={e => setSettings(s => ({ ...s, bing_verification: e.target.value }))} placeholder="msvalidate.01=..." /></div>
              </div>
              <div><Label>Google Analytics ID (fără GTM)</Label><Input value={settings.ga_id} onChange={e => setSettings(s => ({ ...s, ga_id: e.target.value }))} placeholder="G-XXXXXXXXXX" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">robots.txt</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={settings.robots_txt} onChange={e => setSettings(s => ({ ...s, robots_txt: e.target.value }))} rows={6} className="font-mono text-xs" />
              <p className="text-[10px] text-muted-foreground mt-1">Linia Sitemap va fi generată automat dacă nu este inclusă.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redirects" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={rdSearch} onChange={e => setRdSearch(e.target.value)} placeholder="Caută redirect..." className="pl-8" />
            </div>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-1" /> Import CSV</Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importRedirects} />
            <Button size="sm" onClick={() => setRdOpen(true)}><Plus className="w-4 h-4 mr-1" /> Redirect nou</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>URL sursă</TableHead><TableHead>URL destinație</TableHead><TableHead>Tip</TableHead><TableHead>Accesări</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredRedirects.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Niciun redirect.</TableCell></TableRow>
                  ) : filteredRedirects.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-mono">{r.source_url}</TableCell>
                      <TableCell className="text-sm font-mono">{r.target_url}</TableCell>
                      <TableCell><Badge variant={r.redirect_type === 301 ? "default" : "secondary"}>{r.redirect_type}</Badge></TableCell>
                      <TableCell className="text-sm">{r.hit_count || 0}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteRedirect(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Redirect dialog */}
      <Dialog open={rdOpen} onOpenChange={setRdOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redirect nou</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">URL sursă (vechi)</Label><Input value={rdForm.source_url} onChange={e => setRdForm({ ...rdForm, source_url: e.target.value })} placeholder="/old-page" /></div>
            <div><Label className="text-xs">URL destinație (nou)</Label><Input value={rdForm.target_url} onChange={e => setRdForm({ ...rdForm, target_url: e.target.value })} placeholder="/new-page" /></div>
            <div>
              <Label className="text-xs">Tip redirect</Label>
              <Select value={rdForm.redirect_type} onValueChange={v => setRdForm({ ...rdForm, redirect_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 — Permanent</SelectItem>
                  <SelectItem value="302">302 — Temporar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Note (opțional)</Label><Input value={rdForm.notes} onChange={e => setRdForm({ ...rdForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={saveRedirect}>Adaugă redirect</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
