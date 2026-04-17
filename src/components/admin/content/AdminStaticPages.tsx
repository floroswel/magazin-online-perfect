import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Plus, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface FaqItem { q: string; a: string; }
interface FaqSection { title: string; items: FaqItem[]; }
interface ContentSection { icon: string; title: string; content: string; }
interface PovesteaSection { label: string; title: string; text: string; }

const KEYS = {
  faq: "static_page_faq",
  povestea: "static_page_povestea",
  ingrijire: "static_page_ingrijire",
};

export default function AdminStaticPages() {
  const [faqSections, setFaqSections] = useState<FaqSection[]>([]);
  const [povesteaSections, setPovesteaSections] = useState<PovesteaSection[]>([]);
  const [ingrijireSections, setIngrijireSections] = useState<ContentSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("app_settings").select("value_json").eq("key", KEYS.faq).maybeSingle(),
      supabase.from("app_settings").select("value_json").eq("key", KEYS.povestea).maybeSingle(),
      supabase.from("app_settings").select("value_json").eq("key", KEYS.ingrijire).maybeSingle(),
    ]).then(([faq, povestea, ingrijire]) => {
      if (faq.data?.value_json) setFaqSections(faq.data.value_json as unknown as FaqSection[]);
      if (povestea.data?.value_json) setPovesteaSections(povestea.data.value_json as unknown as PovesteaSection[]);
      if (ingrijire.data?.value_json) setIngrijireSections(ingrijire.data.value_json as unknown as ContentSection[]);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const results = await Promise.all([
      supabase.from("app_settings").upsert({ key: KEYS.faq, value_json: faqSections as any, description: "FAQ page content" }, { onConflict: "key" }),
      supabase.from("app_settings").upsert({ key: KEYS.povestea, value_json: povesteaSections as any, description: "Povestea Noastra content" }, { onConflict: "key" }),
      supabase.from("app_settings").upsert({ key: KEYS.ingrijire, value_json: ingrijireSections as any, description: "Ingrijire Lumanari content" }, { onConflict: "key" }),
    ]);
    if (results.some(r => r.error)) toast.error("Eroare la salvare");
    else toast.success("Pagini salvate!");
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Pagini Statice
          </h1>
          <p className="text-sm text-muted-foreground">Editează conținutul paginilor FAQ, Povestea Noastră și Îngrijire</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvează Toate
        </Button>
      </div>

      <Tabs defaultValue="faq">
        <TabsList>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="povestea">Povestea Noastră</TabsTrigger>
          <TabsTrigger value="ingrijire">Îngrijire Lumânări</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Button variant="outline" onClick={() => setFaqSections(s => [...s, { title: "Secțiune Nouă", items: [{ q: "", a: "" }] }])}><Plus className="w-4 h-4 mr-2" />Adaugă Secțiune</Button>
          {faqSections.map((sec, si) => (
            <Card key={si}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1"><Label>Titlu Secțiune</Label><Input value={sec.title} onChange={e => { const arr = [...faqSections]; arr[si] = { ...arr[si], title: e.target.value }; setFaqSections(arr); }} /></div>
                  <Button variant="ghost" size="icon" className="text-destructive h-9 w-9" onClick={() => setFaqSections(s => s.filter((_, i) => i !== si))}><Trash2 className="w-4 h-4" /></Button>
                </div>
                {sec.items.map((item, ii) => (
                  <div key={ii} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <div><Label className="text-xs">Întrebare</Label><Input value={item.q} onChange={e => { const arr = [...faqSections]; arr[si].items[ii] = { ...arr[si].items[ii], q: e.target.value }; setFaqSections([...arr]); }} /></div>
                    <div><Label className="text-xs">Răspuns</Label><Textarea value={item.a} rows={2} onChange={e => { const arr = [...faqSections]; arr[si].items[ii] = { ...arr[si].items[ii], a: e.target.value }; setFaqSections([...arr]); }} /></div>
                    <Button variant="ghost" size="icon" className="text-destructive h-9 w-9 mt-5" onClick={() => { const arr = [...faqSections]; arr[si].items = arr[si].items.filter((_, i) => i !== ii); setFaqSections([...arr]); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => { const arr = [...faqSections]; arr[si].items.push({ q: "", a: "" }); setFaqSections([...arr]); }}><Plus className="w-3 h-3 mr-1" />Adaugă Întrebare</Button>
              </CardContent>
            </Card>
          ))}
          {faqSections.length === 0 && <p className="text-sm text-muted-foreground">Nicio secțiune FAQ. Se vor folosi datele implicite.</p>}
        </TabsContent>

        <TabsContent value="povestea" className="space-y-4">
          <Button variant="outline" onClick={() => setPovesteaSections(s => [...s, { label: "", title: "", text: "" }])}><Plus className="w-4 h-4 mr-2" />Adaugă Secțiune</Button>
          {povesteaSections.map((sec, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Etichetă</Label><Input value={sec.label} onChange={e => { const arr = [...povesteaSections]; arr[i] = { ...arr[i], label: e.target.value }; setPovesteaSections(arr); }} /></div>
                  <div><Label>Titlu</Label><Input value={sec.title} onChange={e => { const arr = [...povesteaSections]; arr[i] = { ...arr[i], title: e.target.value }; setPovesteaSections(arr); }} /></div>
                </div>
                <div><Label>Text</Label><Textarea value={sec.text} rows={4} onChange={e => { const arr = [...povesteaSections]; arr[i] = { ...arr[i], text: e.target.value }; setPovesteaSections(arr); }} /></div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPovesteaSections(s => s.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3 mr-1" />Șterge</Button>
              </CardContent>
            </Card>
          ))}
          {povesteaSections.length === 0 && <p className="text-sm text-muted-foreground">Nicio secțiune. Se vor folosi datele implicite.</p>}
        </TabsContent>

        <TabsContent value="ingrijire" className="space-y-4">
          <Button variant="outline" onClick={() => setIngrijireSections(s => [...s, { icon: "🕯️", title: "", content: "" }])}><Plus className="w-4 h-4 mr-2" />Adaugă Secțiune</Button>
          {ingrijireSections.map((sec, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-[60px_1fr] gap-3">
                  <div><Label>Icon</Label><Input value={sec.icon} onChange={e => { const arr = [...ingrijireSections]; arr[i] = { ...arr[i], icon: e.target.value }; setIngrijireSections(arr); }} /></div>
                  <div><Label>Titlu</Label><Input value={sec.title} onChange={e => { const arr = [...ingrijireSections]; arr[i] = { ...arr[i], title: e.target.value }; setIngrijireSections(arr); }} /></div>
                </div>
                <div><Label>Conținut</Label><Textarea value={sec.content} rows={3} onChange={e => { const arr = [...ingrijireSections]; arr[i] = { ...arr[i], content: e.target.value }; setIngrijireSections(arr); }} /></div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setIngrijireSections(s => s.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3 mr-1" />Șterge</Button>
              </CardContent>
            </Card>
          ))}
          {ingrijireSections.length === 0 && <p className="text-sm text-muted-foreground">Nicio secțiune. Se vor folosi datele implicite.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
