
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Code, Plus, Trash2, Loader2, Save, Copy, Pencil, AlertTriangle,
  GripVertical, Search, FileCode, X, ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

/* ─── types ─── */
interface Script {
  id: string;
  internal_reference: string;
  script_type: string;        // inline | external
  inline_content: string | null;
  external_url: string | null;
  external_async: boolean;
  external_defer: boolean;
  external_type: string;
  external_crossorigin: string | null;
  external_custom_attributes: any;
  location: string;            // header | body | footer
  pages: string[];
  is_active: boolean;
  internal_note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  consent_category: string;   // necessary | analytics | marketing
  /* legacy compat */
  name?: string;
  content?: string;
}

interface AuditEntry {
  id: string;
  script_id: string | null;
  action: string;
  admin_user_id: string | null;
  changes: any;
  created_at: string;
}

const PAGES_OPTIONS = [
  { value: "all_pages", label: "Toate paginile site-ului" },
  { value: "homepage", label: "Pagina principală" },
  { value: "product", label: "Pagini produse" },
  { value: "category", label: "Pagini categorii" },
  { value: "cart", label: "Pagina coș de cumpărături" },
  { value: "checkout", label: "Checkout" },
  { value: "after_checkout", label: "After checkout (confirmare)" },
  { value: "auth", label: "Autentificare / Înregistrare" },
  { value: "account", label: "Contul clientului" },
  { value: "search", label: "Pagina de căutare" },
  { value: "not_found", label: "Pagina 404" },
  { value: "blog", label: "Blog / articole" },
  { value: "static", label: "Pagini statice" },
];

const LOCATION_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  header: { label: "Header", variant: "default" },
  body: { label: "Body", variant: "secondary" },
  footer: { label: "Footer", variant: "outline" },
};

const TEMPLATES = [
  {
    name: "Google Analytics 4",
    description: "Tracking-ul standard GA4. Înlocuiește GA_MEASUREMENT_ID cu ID-ul tău.",
    type: "inline" as const,
    location: "header",
    pages: ["all_pages"],
    content: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>`,
  },
  {
    name: "Google Tag Manager",
    description: "Container GTM. Înlocuiește GTM-XXXX cu ID-ul tău GTM.",
    type: "inline" as const,
    location: "header",
    pages: ["all_pages"],
    content: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXX');</script>
<!-- End Google Tag Manager -->`,
  },
  {
    name: "Facebook / Meta Pixel",
    description: "Pixel Meta standard. Înlocuiește PIXEL_ID cu ID-ul tău.",
    type: "inline" as const,
    location: "header",
    pages: ["all_pages"],
    content: `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=PIXEL_ID&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->`,
  },
  {
    name: "TikTok Pixel",
    description: "TikTok Pixel standard. Înlocuiește TIKTOK_PIXEL_ID.",
    type: "inline" as const,
    location: "header",
    pages: ["all_pages"],
    content: `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('TIKTOK_PIXEL_ID');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`,
  },
  {
    name: "Hotjar",
    description: "Heatmaps & Recordings. Înlocuiește HOTJAR_ID.",
    type: "inline" as const,
    location: "header",
    pages: ["all_pages"],
    content: `<!-- Hotjar Tracking Code -->
<script>
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:HOTJAR_ID,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`,
  },
  {
    name: "Custom CSS",
    description: "Inserează reguli CSS personalizate.",
    type: "inline" as const,
    location: "header",
    pages: ["all_pages"],
    content: `<style>
/* Adaugă regulile CSS personalizate aici */
/* Exemplu: */
/* .my-class { color: red; } */
</style>`,
  },
];

const emptyForm = (): Partial<Script> => ({
  internal_reference: "",
  script_type: "inline",
  inline_content: "",
  external_url: "",
  external_async: false,
  external_defer: false,
  external_type: "text/javascript",
  external_crossorigin: null,
  external_custom_attributes: null,
  location: "header",
  pages: ["all_pages"],
  is_active: true,
  internal_note: "",
  sort_order: 0,
  consent_category: "necessary",
});

/* ─── warnings helper ─── */
function getWarnings(form: Partial<Script>): string[] {
  const w: string[] = [];
  const code = form.inline_content || "";
  if (form.script_type === "inline") {
    if (code.includes("document.cookie")) w.push("Atenție: Scriptul accesează cookie-uri. Asigurați-vă că respectați GDPR.");
    if (code.includes("eval(")) w.push("Atenție: Utilizarea eval() prezintă riscuri de securitate.");
    if (code.length > 100000) w.push("Scriptul este mare (>100KB) și poate încetini încărcarea paginii.");
  }
  if (form.script_type === "external") {
    const url = form.external_url || "";
    if (url && url.startsWith("http://")) w.push("Atenție: URL-ul nu este securizat (HTTPS). Folosiți HTTPS pentru securitate maximă.");
  }
  if ((form.pages || []).includes("checkout")) {
    w.push("Scripturile pe pagina de checkout pot afecta procesul de plată. Testați cu atenție.");
  }
  return w;
}

export default function AdminCustomScripts() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // filters
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Script>>(emptyForm());

  // templates
  const [showTemplates, setShowTemplates] = useState(false);

  // audit
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const [auditScriptId, setAuditScriptId] = useState<string | null>(null);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ─── fetch ─── */
  const fetchScripts = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("custom_scripts").select("*").order("sort_order") as any);
    setScripts((data || []).map((s: any) => ({
      ...s,
      internal_reference: s.internal_reference || s.name || "",
      pages: Array.isArray(s.pages) ? s.pages : ["all_pages"],
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  /* ─── audit log ─── */
  const logAudit = async (scriptId: string, action: string, changes?: any) => {
    await (supabase.from("custom_scripts_audit_log") as any).insert({
      script_id: scriptId,
      action,
      admin_user_id: user?.id || null,
      changes,
    });
  };

  /* ─── CRUD ─── */
  const handleSave = async () => {
    if (!form.internal_reference?.trim()) { toast.error("Completează referința internă"); return; }
    if (form.script_type === "inline" && !form.inline_content?.trim()) { toast.error("Completează conținutul scriptului"); return; }
    if (form.script_type === "external" && !form.external_url?.trim()) { toast.error("Completează URL-ul extern"); return; }
    if (!(form.pages || []).length) { toast.error("Selectează cel puțin o pagină"); return; }

    setSaving(true);
    const payload: any = {
      internal_reference: form.internal_reference,
      name: form.internal_reference,
      script_type: form.script_type,
      inline_content: form.script_type === "inline" ? form.inline_content : null,
      content: form.script_type === "inline" ? form.inline_content : form.external_url,
      external_url: form.script_type === "external" ? form.external_url : null,
      external_async: form.external_async || false,
      external_defer: form.external_defer || false,
      external_type: form.external_type || "text/javascript",
      external_crossorigin: form.external_crossorigin || null,
      external_custom_attributes: form.external_custom_attributes || null,
      location: form.location,
      pages: form.pages,
      is_active: form.is_active ?? true,
      internal_note: form.internal_note || null,
      sort_order: form.sort_order ?? 0,
      consent_category: form.consent_category || "necessary",
    };

    if (editId) {
      const { error } = await (supabase.from("custom_scripts").update(payload).eq("id", editId) as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await logAudit(editId, "updated", payload);
      toast.success("Script actualizat!");
    } else {
      payload.created_by_admin_id = user?.id || null;
      const { data, error } = await (supabase.from("custom_scripts").insert(payload).select("id").single() as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      if (data) await logAudit(data.id, "created", payload);
      toast.success("Script adăugat!");
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
    fetchScripts();
  };

  const toggleStatus = async (id: string, active: boolean) => {
    await (supabase.from("custom_scripts").update({ is_active: active }).eq("id", id) as any);
    await logAudit(id, "status_changed", { is_active: active });
    setScripts(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
    toast.success(active ? "Script activat" : "Script dezactivat");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await logAudit(deleteId, "deleted");
    await (supabase.from("custom_scripts").delete().eq("id", deleteId) as any);
    setScripts(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
    toast.success("Script șters");
  };

  const handleDuplicate = async (s: Script) => {
    const payload: any = {
      internal_reference: s.internal_reference + " (copie)",
      name: s.internal_reference + " (copie)",
      script_type: s.script_type,
      inline_content: s.inline_content,
      content: s.script_type === "inline" ? s.inline_content : s.external_url,
      external_url: s.external_url,
      external_async: s.external_async,
      external_defer: s.external_defer,
      external_type: s.external_type,
      external_crossorigin: s.external_crossorigin,
      external_custom_attributes: s.external_custom_attributes,
      location: s.location,
      pages: s.pages,
      is_active: false,
      internal_note: s.internal_note,
      sort_order: (s.sort_order || 0) + 1,
      created_by_admin_id: user?.id || null,
    };
    const { data, error } = await (supabase.from("custom_scripts").insert(payload).select("id").single() as any);
    if (error) { toast.error(error.message); return; }
    if (data) await logAudit(data.id, "created", { ...payload, duplicated_from: s.id });
    toast.success("Script duplicat!");
    fetchScripts();
  };

  const openEdit = (s: Script) => {
    setForm({
      internal_reference: s.internal_reference || s.name,
      script_type: s.script_type,
      inline_content: s.inline_content || s.content || "",
      external_url: s.external_url || "",
      external_async: s.external_async,
      external_defer: s.external_defer,
      external_type: s.external_type || "text/javascript",
      external_crossorigin: s.external_crossorigin,
      external_custom_attributes: s.external_custom_attributes,
      location: s.location,
      pages: s.pages,
      is_active: s.is_active,
      internal_note: s.internal_note || "",
      sort_order: s.sort_order,
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const openNew = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setForm(prev => ({
      ...prev,
      internal_reference: t.name,
      script_type: t.type,
      inline_content: t.content,
      location: t.location,
      pages: t.pages,
    }));
    setShowTemplates(false);
    if (!showForm) setShowForm(true);
  };

  const openAuditForScript = async (scriptId: string) => {
    setAuditScriptId(scriptId);
    setShowAudit(true);
    const { data } = await (supabase.from("custom_scripts_audit_log") as any)
      .select("*")
      .eq("script_id", scriptId)
      .order("created_at", { ascending: false })
      .limit(50);
    setAuditEntries(data || []);
  };

  /* ─── page toggle helpers ─── */
  const togglePage = (page: string) => {
    setForm(prev => {
      const current = prev.pages || [];
      if (page === "all_pages") return { ...prev, pages: current.includes("all_pages") ? [] : ["all_pages"] };
      const without = current.filter(p => p !== "all_pages" && p !== page);
      if (current.includes(page)) return { ...prev, pages: without };
      return { ...prev, pages: [...without, page] };
    });
  };

  /* ─── filter ─── */
  const filtered = scripts.filter(s => {
    if (filterLocation !== "all" && s.location !== filterLocation) return false;
    if (filterStatus === "active" && !s.is_active) return false;
    if (filterStatus === "inactive" && s.is_active) return false;
    if (searchQ && !(s.internal_reference || s.name || "").toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const warnings = getWarnings(form);

  /* ─── rendering ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Code className="w-6 h-6 text-primary" /> Script Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Adaugă scripturi JavaScript, HTML sau CSS în paginile magazinului
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            <FileCode className="w-4 h-4 mr-1" /> Template-uri
          </Button>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Adaugă script nou</Button>
        </div>
      </div>

      {/* Security warning */}
      <div className="bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3 flex items-start gap-2 text-sm text-destructive">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Scripturile adăugate aici sunt executate pe paginile magazinului. Adăugați doar cod din surse de încredere.</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input placeholder="Caută după nume..." className="pl-8 w-56" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        <Select value={filterLocation} onValueChange={setFilterLocation}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Locație" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate locațiile</SelectItem>
            <SelectItem value="header">Header</SelectItem>
            <SelectItem value="body">Body</SelectItem>
            <SelectItem value="footer">Footer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listing */}
      {loading ? (
        <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <FileCode className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {scripts.length === 0 ? "Nu ai adăugat niciun script" : "Niciun script nu corespunde filtrelor"}
            </p>
            {scripts.length === 0 && (
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Adaugă primul script</Button>
                <Button size="sm" variant="outline" onClick={() => setShowTemplates(true)}>
                  <FileCode className="w-4 h-4 mr-1" /> Alege din template-uri
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Referință internă</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Locație</TableHead>
                <TableHead>Pagini</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultima modificare</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => {
                const locBadge = LOCATION_BADGES[s.location] || { label: s.location, variant: "outline" as const };
                const pagesLabels = (s.pages || []).map(p => PAGES_OPTIONS.find(o => o.value === p)?.label || p);
                const domain = s.external_url ? new URL(s.external_url).hostname : null;
                return (
                  <TableRow key={s.id}>
                    <TableCell><GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" /></TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{s.internal_reference || s.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {s.script_type === "external" ? domain : (s.inline_content || s.content || "").substring(0, 60) + "…"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.script_type === "external" ? "Extern" : "Inline"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={locBadge.variant}>{locBadge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pagesLabels.slice(0, 3).map(p => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                        {pagesLabels.length > 3 && <Badge variant="secondary" className="text-xs">+{pagesLabels.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={s.is_active} onCheckedChange={v => toggleStatus(s.id, v)} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.updated_at).toLocaleDateString("ro-RO")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)} title="Editează">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(s)} title="Duplică">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openAuditForScript(s.id)} title="Istoric">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(s.id)} title="Șterge">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ═══════════ FORM DIALOG ═══════════ */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); setEditId(null); setForm(emptyForm()); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              {editId ? "Editează script" : "Adaugă script nou"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <div key={i} className="bg-destructive/5 border border-destructive/20 rounded px-3 py-2 text-xs text-destructive flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{w}
                  </div>
                ))}
              </div>
            )}

            {/* Reference */}
            <div>
              <Label>Referință internă *</Label>
              <Input maxLength={100} value={form.internal_reference || ""} onChange={e => setForm(f => ({ ...f, internal_reference: e.target.value }))} placeholder="Ex: Google Analytics GA4" />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Tip script *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="stype" checked={form.script_type === "inline"} onChange={() => setForm(f => ({ ...f, script_type: "inline" }))} className="accent-primary" />
                  <span className="text-sm">Snippet JavaScript/HTML inline</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="stype" checked={form.script_type === "external"} onChange={() => setForm(f => ({ ...f, script_type: "external" }))} className="accent-primary" />
                  <span className="text-sm">Script extern</span>
                </label>
              </div>
            </div>

            {/* Content / URL */}
            {form.script_type === "inline" ? (
              <div>
                <Label>Conținut script *</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Copiază și inserează codul HTML/Javascript. Asigură-te că ai încadrat snippet-urile JavaScript cu {"<script></script>"}.
                </p>
                <Textarea
                  rows={12}
                  value={form.inline_content || ""}
                  onChange={e => setForm(f => ({ ...f, inline_content: e.target.value }))}
                  className="font-mono text-xs leading-5"
                  placeholder="<script>\n  // codul tău aici\n</script>"
                />
                <p className="text-xs text-muted-foreground mt-1">{(form.inline_content || "").length} caractere</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>URL script extern *</Label>
                  <Input value={form.external_url || ""} onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))} placeholder="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.external_async || false} onCheckedChange={v => setForm(f => ({ ...f, external_async: !!v }))} />
                    async
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.external_defer || false} onCheckedChange={v => setForm(f => ({ ...f, external_defer: !!v }))} />
                    defer
                  </label>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Input value={form.external_type || "text/javascript"} onChange={e => setForm(f => ({ ...f, external_type: e.target.value }))} className="text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Crossorigin</Label>
                    <Select value={form.external_crossorigin || "none"} onValueChange={v => setForm(f => ({ ...f, external_crossorigin: v === "none" ? null : v }))}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Niciunul</SelectItem>
                        <SelectItem value="anonymous">anonymous</SelectItem>
                        <SelectItem value="use-credentials">use-credentials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="space-y-2">
              <Label>Locație *</Label>
              <div className="flex gap-4">
                {(["header", "body", "footer"] as const).map(loc => (
                  <label key={loc} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="sloc" checked={form.location === loc} onChange={() => setForm(f => ({ ...f, location: loc }))} className="accent-primary" />
                    <span className="text-sm">{loc === "header" ? "Header (<head>)" : loc === "body" ? "Body (după <body>)" : "Footer (înainte de </body>)"}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pages */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pagini site *</Label>
                <div className="flex gap-2 text-xs">
                  <button type="button" className="text-primary underline" onClick={() => setForm(f => ({ ...f, pages: ["all_pages"] }))}>Selectează toate</button>
                  <button type="button" className="text-primary underline" onClick={() => setForm(f => ({ ...f, pages: [] }))}>Deselectează toate</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAGES_OPTIONS.map(p => {
                  const isAllSelected = (form.pages || []).includes("all_pages");
                  const isChecked = p.value === "all_pages" ? isAllSelected : (form.pages || []).includes(p.value);
                  const isDisabled = p.value !== "all_pages" && isAllSelected;
                  return (
                    <label key={p.value} className={`flex items-center gap-2 text-sm ${isDisabled ? "opacity-50" : "cursor-pointer"}`}>
                      <Checkbox checked={isChecked} disabled={isDisabled} onCheckedChange={() => togglePage(p.value)} />
                      {p.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <span className="text-sm text-muted-foreground">{form.is_active ? "Activ" : "Inactiv"}</span>
            </div>

            {/* GDPR Consent Category */}
            <div>
              <Label>Categorie GDPR consimțământ</Label>
              <Select value={form.consent_category || "necessary"} onValueChange={v => setForm(f => ({ ...f, consent_category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="necessary">🔒 Necesare (se încarcă mereu)</SelectItem>
                  <SelectItem value="analytics">📊 Analitice (necesită consimțământ analytics)</SelectItem>
                  <SelectItem value="marketing">📣 Marketing (necesită consimțământ marketing)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">Scripturile de tip analytics/marketing se vor încărca DOAR dacă utilizatorul a acceptat categoria respectivă în bannerul de cookie-uri (GDPR).</p>
            </div>

            {/* Note */}
            <div>
              <Label>Notă internă (opțional)</Label>
              <Textarea rows={2} value={form.internal_note || ""} onChange={e => setForm(f => ({ ...f, internal_note: e.target.value }))} placeholder="Notițe pentru echipă..." />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm()); }}>Anulează</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se salvează...</> : <><Save className="w-4 h-4 mr-2" /> {editId ? "Salvează modificările" : "Adaugă script"}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ TEMPLATES DIALOG ═══════════ */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Alege din template-uri</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {TEMPLATES.map((t, i) => (
              <Card key={i} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => applyTemplate(t)}>Folosește</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ AUDIT DIALOG ═══════════ */}
      <Dialog open={showAudit} onOpenChange={v => { setShowAudit(v); if (!v) setAuditEntries([]); }}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Istoric modificări</DialogTitle></DialogHeader>
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nicio intrare în istoric.</p>
          ) : (
            <div className="space-y-2">
              {auditEntries.map(a => (
                <div key={a.id} className="border border-border rounded-md px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <Badge variant="outline" className="text-xs">{a.action}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("ro-RO")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════ DELETE CONFIRM ═══════════ */}
      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmă ștergerea</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Ești sigur că vrei să ștergi acest script? Acțiunea este ireversibilă.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Anulează</Button>
            <Button variant="destructive" onClick={handleDelete}>Șterge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
