import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Save, Loader2, Plus, Trash2, Megaphone, Navigation, Layers,
  Award, Sparkles, Shield as ShieldIcon, Search, Eye,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EDITABLE_DEFAULTS, type EditableContent } from "@/hooks/useEditableContent";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY_MAP: Record<keyof EditableContent, string> = {
  announcement: "editable_announcement",
  header_topbar: "editable_header_topbar",
  header_nav: "editable_header_nav",
  mobile_categories: "editable_mobile_categories",
  why_section: "editable_why_section",
  process_section: "editable_process_section",
  scent_promos: "editable_scent_promos",
  trust_strip: "editable_trust_strip",
  social_proof_static: "editable_social_proof_static",
};

function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 pb-1 px-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AdminEditableContent() {
  const [content, setContent] = useState<EditableContent>(EDITABLE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", Object.values(KEY_MAP))
      .then(({ data }) => {
        if (data && data.length > 0) {
          const updated = { ...EDITABLE_DEFAULTS };
          const reverseMap: Record<string, keyof EditableContent> = {};
          Object.entries(KEY_MAP).forEach(([k, v]) => { reverseMap[v] = k as keyof EditableContent; });
          data.forEach((row: any) => {
            const field = reverseMap[row.key];
            if (field && row.value_json != null) {
              (updated as any)[field] = row.value_json;
            }
          });
          setContent(updated);
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const promises = Object.entries(KEY_MAP).map(([field, dbKey]) =>
      supabase.from("app_settings").upsert(
        { key: dbKey, value_json: (content as any)[field] as any, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )
    );
    await Promise.all(promises);
    setSaving(false);
    toast.success("Salvat! Schimbările apar pe site în câteva secunde.");
  };

  const set = <K extends keyof EditableContent>(key: K, val: EditableContent[K]) =>
    setContent(c => ({ ...c, [key]: val }));

  // Search filter - highlight matching tabs
  const searchLower = search.toLowerCase();
  const matchesSearch = (text: string) => !search || text.toLowerCase().includes(searchLower);

  const tabVisibility = useMemo(() => ({
    header: !search || ["telefon", "livrare", "locatie", "navigare", "link", "categorii", "mobile", "header", "topbar", "phone"].some(k => matchesSearch(k)),
    promo: !search || ["anunt", "countdown", "prag", "banner", "promo", "scent"].some(k => matchesSearch(k)),
    sections: !search || ["why", "proces", "section", "de ce", "step"].some(k => matchesSearch(k)),
    trust: !search || ["trust", "social", "proof", "badge", "livrare", "retur", "plata"].some(k => matchesSearch(k)),
  }), [search]);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Se încarcă...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Editor Conținut Site
          </h1>
          <p className="text-sm text-muted-foreground">Editează orice text, link sau componentă de pe site – salvat în timp real</p>
        </div>
        <Button onClick={save} disabled={saving} size="sm" className="shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Salvează Tot
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută setare..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          {tabVisibility.header && <TabsTrigger value="header" className="text-xs sm:text-sm"><Navigation className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Header & Nav</TabsTrigger>}
          {tabVisibility.promo && <TabsTrigger value="promo" className="text-xs sm:text-sm"><Megaphone className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Promoții</TabsTrigger>}
          {tabVisibility.sections && <TabsTrigger value="sections" className="text-xs sm:text-sm"><Layers className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Secțiuni</TabsTrigger>}
          {tabVisibility.trust && <TabsTrigger value="trust" className="text-xs sm:text-sm"><ShieldIcon className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Trust</TabsTrigger>}
        </TabsList>

        {/* ═══ HEADER & NAVIGATION ═══ */}
        <TabsContent value="header" className="space-y-3 mt-4">
          <Section title="Bara Superioară (Topbar)" icon={Navigation} defaultOpen>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label>Telefon</Label><Input value={content.header_topbar.phone} onChange={e => set("header_topbar", { ...content.header_topbar, phone: e.target.value })} /></div>
              <div><Label>Text Livrare</Label><Input value={content.header_topbar.shipping_text} onChange={e => set("header_topbar", { ...content.header_topbar, shipping_text: e.target.value })} /></div>
              <div><Label>Locație</Label><Input value={content.header_topbar.location} onChange={e => set("header_topbar", { ...content.header_topbar, location: e.target.value })} /></div>
            </div>
          </Section>

          <Section title="Link-uri Navigare" icon={Navigation}>
            <div className="space-y-2">
              {content.header_nav.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={link.label} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], label: e.target.value }; set("header_nav", nav); }} placeholder="Label" className="flex-1" />
                  <Input value={link.to} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], to: e.target.value }; set("header_nav", nav); }} placeholder="URL" className="flex-1" />
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap"><input type="checkbox" checked={!!link.highlight} onChange={e => { const nav = [...content.header_nav]; nav[i] = { ...nav[i], highlight: e.target.checked }; set("header_nav", nav); }} /> Evidențiat</label>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => set("header_nav", content.header_nav.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("header_nav", [...content.header_nav, { to: "/", label: "Nou", highlight: false }])}><Plus className="w-3 h-3 mr-1" /> Adaugă Link</Button>
            </div>
          </Section>

          <Section title="Categorii Mobile" icon={Layers}>
            <div className="space-y-2">
              {content.mobile_categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={cat.icon} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], icon: e.target.value }; set("mobile_categories", cats); }} className="w-14" placeholder="🔥" />
                  <Input value={cat.name} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], name: e.target.value }; set("mobile_categories", cats); }} placeholder="Nume" className="flex-1" />
                  <Input value={cat.slug} onChange={e => { const cats = [...content.mobile_categories]; cats[i] = { ...cats[i], slug: e.target.value }; set("mobile_categories", cats); }} placeholder="Slug" className="flex-1" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => set("mobile_categories", content.mobile_categories.filter((_, idx) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("mobile_categories", [...content.mobile_categories, { name: "Nou", slug: "nou", icon: "📦" }])}><Plus className="w-3 h-3 mr-1" /> Adaugă</Button>
            </div>
          </Section>
        </TabsContent>

        {/* ═══ PROMOȚII & ANUNȚURI ═══ */}
        <TabsContent value="promo" className="space-y-3 mt-4">
          <Section title="Bara de Anunțuri (Countdown)" icon={Megaphone} defaultOpen>
            <div className="space-y-3">
              <div><Label>Text Desktop</Label><Input value={content.announcement.text_desktop} onChange={e => set("announcement", { ...content.announcement, text_desktop: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Folosește {"{threshold}"} pentru pragul în lei</p></div>
              <div><Label>Text Mobil</Label><Input value={content.announcement.text_mobile} onChange={e => set("announcement", { ...content.announcement, text_mobile: e.target.value })} /></div>
              <div className="max-w-[200px]"><Label>Prag Livrare Gratuită (lei)</Label><Input type="number" value={content.announcement.threshold} onChange={e => set("announcement", { ...content.announcement, threshold: Number(e.target.value) })} /></div>
            </div>
          </Section>

          <Section title="Bannere Promo (Scent Guide)" icon={Sparkles}>
            <div className="space-y-3">
              {content.scent_promos.map((promo, i) => (
                <Card key={i} className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Titlu</Label><Input value={promo.title} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], title: e.target.value }; set("scent_promos", p); }} /></div>
                    <div><Label className="text-xs">Subtitlu</Label><Input value={promo.subtitle} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], subtitle: e.target.value }; set("scent_promos", p); }} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">CTA text</Label><Input value={promo.cta} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], cta: e.target.value }; set("scent_promos", p); }} /></div>
                    <div><Label className="text-xs">Link</Label><Input value={promo.link} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], link: e.target.value }; set("scent_promos", p); }} /></div>
                    <div><Label className="text-xs">Imagine URL</Label><Input value={promo.image} onChange={e => { const p = [...content.scent_promos]; p[i] = { ...p[i], image: e.target.value }; set("scent_promos", p); }} /></div>
                  </div>
                </Card>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("scent_promos", [...content.scent_promos, { title: "Nou", subtitle: "", cta: "Vezi", link: "/", image: "" }])}><Plus className="w-3 h-3 mr-1" /> Adaugă Banner</Button>
            </div>
          </Section>
        </TabsContent>

        {/* ═══ SECȚIUNI HOMEPAGE ═══ */}
        <TabsContent value="sections" className="space-y-3 mt-4">
          <Section title='Secțiunea "De Ce Noi"' icon={Sparkles} defaultOpen>
            <div className="space-y-3">
              <div><Label>Titlu secțiune</Label><Input value={content.why_section.title} onChange={e => set("why_section", { ...content.why_section, title: e.target.value })} /></div>
              {content.why_section.items.map((item, i) => (
                <Card key={i} className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Icon (Leaf/Hand/Palette/Truck)</Label><Input value={item.icon} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], icon: e.target.value }; set("why_section", { ...content.why_section, items }); }} /></div>
                    <div><Label className="text-xs">Titlu</Label><Input value={item.title} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], title: e.target.value }; set("why_section", { ...content.why_section, items }); }} /></div>
                  </div>
                  <div className="mt-2"><Label className="text-xs">Descriere</Label><Input value={item.desc} onChange={e => { const items = [...content.why_section.items]; items[i] = { ...items[i], desc: e.target.value }; set("why_section", { ...content.why_section, items }); }} /></div>
                </Card>
              ))}
            </div>
          </Section>

          <Section title="Secțiunea Proces (3 Pași)" icon={Layers}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subtitlu</Label><Input value={content.process_section.subtitle} onChange={e => set("process_section", { ...content.process_section, subtitle: e.target.value })} /></div>
                <div><Label>Titlu</Label><Input value={content.process_section.title} onChange={e => set("process_section", { ...content.process_section, title: e.target.value })} /></div>
              </div>
              {content.process_section.steps.map((step, i) => (
                <Card key={i} className="p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">Nr.</Label><Input value={step.number} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], number: e.target.value }; set("process_section", { ...content.process_section, steps }); }} /></div>
                    <div className="col-span-2"><Label className="text-xs">Titlu</Label><Input value={step.title} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], title: e.target.value }; set("process_section", { ...content.process_section, steps }); }} /></div>
                  </div>
                  <div className="mt-2"><Label className="text-xs">Descriere</Label><Input value={step.desc} onChange={e => { const steps = [...content.process_section.steps]; steps[i] = { ...steps[i], desc: e.target.value }; set("process_section", { ...content.process_section, steps }); }} /></div>
                </Card>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* ═══ TRUST & SOCIAL PROOF ═══ */}
        <TabsContent value="trust" className="space-y-3 mt-4">
          <Section title="Trust Footer Strip (4 Badge-uri)" icon={ShieldIcon} defaultOpen>
            <div className="space-y-2">
              {content.trust_strip.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={item.icon} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], icon: e.target.value }; set("trust_strip", t); }} className="w-28" placeholder="Icon" />
                  <Input value={item.title} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], title: e.target.value }; set("trust_strip", t); }} placeholder="Titlu" className="flex-1" />
                  <Input value={item.desc} onChange={e => { const t = [...content.trust_strip]; t[i] = { ...t[i], desc: e.target.value }; set("trust_strip", t); }} placeholder="Descriere" className="flex-1" />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Social Proof (Static)" icon={Award}>
            <div className="space-y-2">
              {content.social_proof_static.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={item.icon} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], icon: e.target.value }; set("social_proof_static", s); }} className="w-28" placeholder="Icon" />
                  <Input value={item.label} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], label: e.target.value }; set("social_proof_static", s); }} placeholder="Label" className="flex-1" />
                  <Input value={item.desc} onChange={e => { const s = [...content.social_proof_static]; s[i] = { ...s[i], desc: e.target.value }; set("social_proof_static", s); }} placeholder="Descriere" className="flex-1" />
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
