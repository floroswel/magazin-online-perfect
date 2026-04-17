import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Rocket, Plus, Loader2, Pencil, Trash2, ArrowLeft, Save, Eye, Globe, Code } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  hero_image: string;
  published: boolean;
  visits: number;
  conversions: number;
  created_at: string;
}

const EMPTY_FORM = {
  name: "", slug: "", content: "", meta_title: "", meta_description: "", hero_image: "", published: false,
};

export default function AdminLandingPages() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<"visual" | "html">("visual");
  const editorRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("landing_pages").select("*").order("created_at", { ascending: false });
    setPages((data || []) as unknown as LandingPage[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalVisits = pages.reduce((s, p) => s + (p.visits || 0), 0);
  const totalConversions = pages.reduce((s, p) => s + (p.conversions || 0), 0);
  const conversionRate = totalVisits > 0 ? ((totalConversions / totalVisits) * 100).toFixed(1) : "0";

  const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorTab("visual");
    setShowEditor(true);
  };

  const openEdit = (p: LandingPage) => {
    setEditingId(p.id);
    setForm({
      name: p.name, slug: p.slug, content: p.content || "",
      meta_title: p.meta_title || "", meta_description: p.meta_description || "",
      hero_image: p.hero_image || "", published: p.published,
    });
    setEditorTab("visual");
    setShowEditor(true);
  };

  const syncEditorContent = () => {
    if (editorTab === "visual" && editorRef.current) {
      setForm(f => ({ ...f, content: editorRef.current!.innerHTML }));
    }
  };

  const handleSave = async () => {
    syncEditorContent();
    if (!form.name || !form.slug) return;
    setSaving(true);

    const bodyHtml = editorTab === "visual" && editorRef.current ? editorRef.current.innerHTML : form.content;
    const payload = {
      name: form.name, slug: form.slug, content: bodyHtml,
      meta_title: form.meta_title, meta_description: form.meta_description,
      hero_image: form.hero_image, published: form.published,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("landing_pages").update(payload as any).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("landing_pages").insert(payload as any));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Pagină actualizată" : "Landing page creată" });
      setShowEditor(false);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ștergi această landing page?")) return;
    await supabase.from("landing_pages").delete().eq("id", id);
    toast({ title: "Pagină ștearsă" });
    load();
  };

  const togglePublished = async (id: string, published: boolean) => {
    await supabase.from("landing_pages").update({ published } as any).eq("id", id);
    setPages(p => p.map(x => x.id === id ? { ...x, published } : x));
  };

  const execCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  // ═══ Editor view ═══
  if (showEditor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Înapoi
          </Button>
          <h1 className="text-lg font-bold text-foreground">{editingId ? "Editare Landing Page" : "Landing Page Nouă"}</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Titlu pagină</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: !editingId ? slugify(e.target.value) : f.slug }))} placeholder="Ex: Promoție Vară 2025" />
                  </div>
                  <div>
                    <Label className="text-xs">Slug (URL)</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">/lp/</span>
                      <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))} placeholder="promotie-vara" />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Imagine Hero (URL)</Label>
                  <Input value={form.hero_image} onChange={e => setForm(f => ({ ...f, hero_image: e.target.value }))} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Conținut</Label>
                  <Tabs value={editorTab} onValueChange={v => {
                    if (editorTab === "visual" && editorRef.current) setForm(f => ({ ...f, content: editorRef.current!.innerHTML }));
                    setEditorTab(v as any);
                  }}>
                    <TabsList className="h-7">
                      <TabsTrigger value="visual" className="text-xs px-2 h-6"><Eye className="w-3 h-3 mr-1" />Vizual</TabsTrigger>
                      <TabsTrigger value="html" className="text-xs px-2 h-6"><Code className="w-3 h-3 mr-1" />HTML</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {editorTab === "visual" ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1 p-1 border border-border rounded-md bg-muted/30">
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("bold")}><strong>B</strong></Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("italic")}><em>I</em></Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("underline")}><u>U</u></Button>
                      <span className="w-px bg-border mx-0.5" />
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("formatBlock", "h1")}>H1</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("formatBlock", "h2")}>H2</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("formatBlock", "p")}>P</Button>
                      <span className="w-px bg-border mx-0.5" />
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("insertUnorderedList")}>• List</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                        const url = prompt("URL link:");
                        if (url) execCommand("createLink", url);
                      }}>🔗</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                        const url = prompt("URL imagine:");
                        if (url) execCommand("insertImage", url);
                      }}>🖼</Button>
                    </div>
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="min-h-[300px] max-h-[500px] overflow-auto p-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: form.content }}
                    />
                  </div>
                ) : (
                  <Textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    className="min-h-[350px] font-mono text-xs"
                    placeholder="<h1>Titlu</h1><p>Conținut...</p>"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Publicată</Label>
                  <Switch checked={form.published} onCheckedChange={v => setForm(f => ({ ...f, published: v }))} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {saving ? "Se salvează..." : "Salvează"}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-1 text-sm font-semibold"><Globe className="w-3.5 h-3.5" /> SEO</div>
                <div>
                  <Label className="text-xs">Meta Title</Label>
                  <Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="Titlu SEO" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{form.meta_title.length}/60</p>
                </div>
                <div>
                  <Label className="text-xs">Meta Description</Label>
                  <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Descriere SEO" rows={3} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{form.meta_description.length}/160</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Preview URL:</p>
                <code className="text-xs break-all">/lp/{form.slug || "..."}</code>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ═══ List view ═══
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Rocket className="w-5 h-5" /> Landing Pages</h1>
          <p className="text-sm text-muted-foreground">Pagini de campanie cu editor conținut și tracking conversii.</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Landing page nouă</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{pages.filter(p => p.published).length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalVisits}</p><p className="text-xs text-muted-foreground">Vizite totale</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Rată conversie</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Vizite</TableHead>
                  <TableHead>Conversii</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nu există landing pages.</TableCell></TableRow>
                ) : pages.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">/lp/{p.slug}</TableCell>
                    <TableCell>{p.visits}</TableCell>
                    <TableCell>{p.conversions}</TableCell>
                    <TableCell><Switch checked={p.published} onCheckedChange={c => togglePublished(p.id, c)} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
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
