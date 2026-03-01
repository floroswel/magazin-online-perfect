import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, FileText, Search, Loader2, Save, Globe, Code, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  body_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const PRESET_PAGES = [
  { title: "Despre noi", slug: "despre-noi" },
  { title: "Contact", slug: "contact" },
  { title: "Termeni și Condiții", slug: "termeni-si-conditii" },
  { title: "Politica de Confidențialitate", slug: "politica-de-confidentialitate" },
  { title: "Politica Cookie", slug: "politica-cookie" },
  { title: "Livrare", slug: "livrare" },
  { title: "Returnare", slug: "returnare" },
  { title: "Garanție", slug: "garantie" },
  { title: "FAQ", slug: "faq" },
  { title: "GDPR", slug: "gdpr" },
];

const EMPTY_FORM = {
  title: "", slug: "", body_html: "", meta_title: "", meta_description: "", published: false,
};

export default function AdminCmsPages({ filterLegal }: { filterLegal?: boolean }) {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<"visual" | "html">("visual");
  const editorRef = useRef<HTMLDivElement>(null);

  const LEGAL_SLUGS = ["termeni-si-conditii", "politica-de-confidentialitate", "politica-cookie", "gdpr", "livrare", "returnare", "garantie", "faq"];

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    setLoading(true);
    const { data } = await supabase.from("cms_pages").select("*").order("title");
    setPages(data || []);
    setLoading(false);
  };

  const filteredPages = pages.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    if (filterLegal) return matchSearch && LEGAL_SLUGS.includes(p.slug);
    return matchSearch;
  });

  const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openCreate = (preset?: typeof PRESET_PAGES[0]) => {
    setEditing(null);
    setForm(preset ? { ...EMPTY_FORM, title: preset.title, slug: preset.slug } : EMPTY_FORM);
    setEditorTab("visual");
    setShowEditor(true);
  };

  const openEdit = (page: CmsPage) => {
    setEditing(page);
    setForm({
      title: page.title,
      slug: page.slug,
      body_html: page.body_html || "",
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      published: page.published,
    });
    setEditorTab("visual");
    setShowEditor(true);
  };

  const syncEditorContent = () => {
    if (editorTab === "visual" && editorRef.current) {
      setForm(f => ({ ...f, body_html: editorRef.current!.innerHTML }));
    }
  };

  const handleSave = async () => {
    syncEditorContent();
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Titlu și slug sunt obligatorii");
      return;
    }
    setSaving(true);

    const bodyHtml = editorTab === "visual" && editorRef.current ? editorRef.current.innerHTML : form.body_html;

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      body_html: bodyHtml,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      published: form.published,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("cms_pages").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("cms_pages").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editing ? "Pagină actualizată!" : "Pagină creată!");
      setShowEditor(false);
      loadPages();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("cms_pages").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success("Pagină ștearsă!"); loadPages(); }
    setDeleteId(null);
  };

  const createMissingPresets = async () => {
    const existingSlugs = pages.map(p => p.slug);
    const presets = filterLegal
      ? PRESET_PAGES.filter(p => LEGAL_SLUGS.includes(p.slug))
      : PRESET_PAGES;
    const missing = presets.filter(p => !existingSlugs.includes(p.slug));
    if (missing.length === 0) {
      toast.info("Toate paginile predefinite există deja");
      return;
    }
    const { error } = await supabase.from("cms_pages").insert(
      missing.map(p => ({ title: p.title, slug: p.slug, body_html: `<h1>${p.title}</h1><p>Conținut de completat.</p>`, published: false }))
    );
    if (error) toast.error(error.message);
    else { toast.success(`${missing.length} pagini create!`); loadPages(); }
  };

  const execCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  if (showEditor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Înapoi
          </Button>
          <h1 className="text-lg font-bold text-foreground">{editing ? "Editare pagină" : "Pagină nouă"}</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Main editor */}
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Titlu pagină</Label>
                    <Input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value, slug: !editing ? slugify(e.target.value) : f.slug })); }} placeholder="Ex: Despre noi" />
                  </div>
                  <div>
                    <Label className="text-xs">Slug (URL)</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">/</span>
                      <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="despre-noi" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Conținut</CardTitle>
                  <Tabs value={editorTab} onValueChange={v => {
                    if (editorTab === "visual" && editorRef.current) {
                      setForm(f => ({ ...f, body_html: editorRef.current!.innerHTML }));
                    }
                    setEditorTab(v as any);
                  }}>
                    <TabsList className="h-7">
                      <TabsTrigger value="visual" className="text-xs px-2 h-6"><Eye className="w-3 h-3 mr-1" />Vizual</TabsTrigger>
                      <TabsTrigger value="html" className="text-xs px-2 h-6"><Code className="w-3 h-3 mr-1" />HTML</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {editorTab === "visual" ? (
                  <div className="space-y-2">
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-1 p-1 border border-border rounded-md bg-muted/30">
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("bold")}><strong>B</strong></Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("italic")}><em>I</em></Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("underline")}><u>U</u></Button>
                      <span className="w-px bg-border mx-0.5" />
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("formatBlock", "h1")}>H1</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("formatBlock", "h2")}>H2</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("formatBlock", "h3")}>H3</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("formatBlock", "p")}>P</Button>
                      <span className="w-px bg-border mx-0.5" />
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("insertUnorderedList")}>• List</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("insertOrderedList")}>1. List</Button>
                      <span className="w-px bg-border mx-0.5" />
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                        const url = prompt("URL link:");
                        if (url) execCommand("createLink", url);
                      }}>🔗</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                        const url = prompt("URL imagine:");
                        if (url) execCommand("insertImage", url);
                      }}>🖼</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => execCommand("removeFormat")}>✕</Button>
                    </div>
                    {/* Editable area */}
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="min-h-[350px] max-h-[600px] overflow-auto p-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: form.body_html }}
                    />
                  </div>
                ) : (
                  <Textarea
                    value={form.body_html}
                    onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
                    className="min-h-[400px] font-mono text-xs"
                    placeholder="<h1>Titlu</h1><p>Conținut...</p>"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Publicare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Meta Title</Label>
                  <Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="Titlu pentru motoarele de căutare" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{form.meta_title.length}/60 caractere</p>
                </div>
                <div>
                  <Label className="text-xs">Meta Description</Label>
                  <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Descriere pentru Google" rows={3} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{form.meta_description.length}/160 caractere</p>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Preview URL</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-xs text-muted-foreground break-all">/{form.slug || "slug-pagina"}</code>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">{filterLegal ? "Termeni & Politici" : "Pagini (CMS)"}</h1>
          <p className="text-xs text-muted-foreground">
            {filterLegal ? "Editare termeni și condiții, politici de confidențialitate, cookie, GDPR etc." : "Editor pagini statice: Despre noi, Contact, politici și altele."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={createMissingPresets}>
            <FileText className="w-3.5 h-3.5 mr-1" /> Creează pagini lipsă
          </Button>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Pagină nouă
          </Button>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută pagini..." className="pl-8 h-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Se încarcă...</div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Nu există pagini{search ? " care se potrivesc" : ""}.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={createMissingPresets}>
              Creează paginile predefinite
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Titlu</TableHead>
                <TableHead className="text-xs">Slug</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actualizat</TableHead>
                <TableHead className="text-xs text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map(page => (
                <TableRow key={page.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(page)}>
                  <TableCell className="text-xs font-medium">{page.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">/{page.slug}</TableCell>
                  <TableCell>
                    <Badge variant={page.published ? "default" : "secondary"} className="text-[10px]">
                      {page.published ? "Publicată" : "Ciornă"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(page.updated_at).toLocaleDateString("ro-RO")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(page)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(page.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmă ștergerea</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Ești sigur că vrei să ștergi această pagină? Acțiunea este ireversibilă.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Anulează</Button>
            <Button variant="destructive" onClick={handleDelete}>Șterge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
