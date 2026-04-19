import { useState, useEffect, useMemo } from "react";
import { useThemeText } from "@/hooks/useThemeText";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Type, Save, Search, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface FieldDef {
  key: string;          // fără prefix
  label: string;
  fallback: string;
  multiline?: boolean;
  placeholder?: string;
}

interface Section {
  id: string;
  title: string;
  emoji: string;
  description: string;
  fields: FieldDef[];
}

/* ─────────────────────────────────────────────────────────────
   DEFINIȚIA TUTUROR TEXTELOR EDITABILE DIN TEMĂ
   ───────────────────────────────────────────────────────────── */
const SECTIONS: Section[] = [
  {
    id: "hero",
    title: "Hero (banner principal)",
    emoji: "🎯",
    description: "Banda de sus de pe homepage — titlu, subtitlu, butoane, statistici.",
    fields: [
      { key: "hero_eyebrow", label: "Mini-tag (deasupra titlului)", fallback: "Atelierul Mama Lucica · est. 2020" },
      { key: "hero_title_pre", label: "Titlu — partea 1", fallback: "Lumânări turnate" },
      { key: "hero_title_accent", label: "Titlu — cuvânt evidențiat", fallback: "cu suflet" },
      { key: "hero_title_post", label: "Titlu — partea 3 (după virgulă)", fallback: "niciodată în serie." },
      { key: "hero_subtitle", label: "Subtitlu / descriere", fallback: "Ceară de soia 100% naturală. Parfumuri compuse manual. Fiecare lumânare poartă numele unui artizan și data turnării.", multiline: true },
      { key: "hero_cta_primary", label: "Buton principal", fallback: "Descoperă colecția" },
      { key: "hero_cta_secondary", label: "Buton secundar", fallback: "Povestea noastră" },
    ],
  },
  {
    id: "hero_stats",
    title: "Hero — Statistici (12k+, 4.9, 100%)",
    emoji: "📊",
    description: "Cele 3 statistici de încredere de sub butoanele hero.",
    fields: [
      { key: "hero_stat1_value", label: "Statistică 1 — valoare", fallback: "12k+" },
      { key: "hero_stat1_label", label: "Statistică 1 — etichetă", fallback: "Clienți fericiți" },
      { key: "hero_stat2_value", label: "Statistică 2 — valoare", fallback: "4.9" },
      { key: "hero_stat2_label", label: "Statistică 2 — etichetă", fallback: "Recenzii verificate" },
      { key: "hero_stat3_value", label: "Statistică 3 — valoare", fallback: "100%" },
      { key: "hero_stat3_label", label: "Statistică 3 — etichetă", fallback: "Handmade RO" },
    ],
  },
  {
    id: "hero_visual",
    title: "Hero — Card vizual (lumânarea lunii)",
    emoji: "🕯️",
    description: "Cardul cu lumânarea recomandată din colțul vizualului.",
    fields: [
      { key: "hero_badge_corner", label: "Badge colț (sus dreapta)", fallback: "Editorial · 2025" },
      { key: "hero_card_eyebrow", label: "Eyebrow card", fallback: "Lumânarea lunii" },
      { key: "hero_card_title", label: "Titlu card (numele lumânării)", fallback: "Tămâie & Mosc Auriu" },
      { key: "hero_card_meta", label: "Meta info (durată, ediție)", fallback: "45h ardere · Limited" },
      { key: "hero_card_price", label: "Preț afișat", fallback: "189 lei" },
      { key: "hero_award_label", label: "Badge plutitor — etichetă", fallback: "Premiu" },
      { key: "hero_award_title", label: "Badge plutitor — titlu", fallback: "Best Artisan 2024" },
    ],
  },
  {
    id: "values",
    title: "Bandă valori (4 piloni sub hero)",
    emoji: "✨",
    description: "Banda neagră cu cele 4 valori (Ceară de soia, Ardere curată, etc.)",
    fields: [
      { key: "values_1_title", label: "Pilon 1 — titlu", fallback: "Ceară de soia" },
      { key: "values_1_sub", label: "Pilon 1 — subtitlu", fallback: "100% naturală, vegan" },
      { key: "values_2_title", label: "Pilon 2 — titlu", fallback: "Ardere curată" },
      { key: "values_2_sub", label: "Pilon 2 — subtitlu", fallback: "Până la 60h, fără fum" },
      { key: "values_3_title", label: "Pilon 3 — titlu", fallback: "Certificat handmade" },
      { key: "values_3_sub", label: "Pilon 3 — subtitlu", fallback: "Lot & artizan" },
      { key: "values_4_title", label: "Pilon 4 — titlu", fallback: "Parfumuri compuse" },
      { key: "values_4_sub", label: "Pilon 4 — subtitlu", fallback: "Note premium IFRA" },
    ],
  },
  {
    id: "seo",
    title: "SEO Homepage",
    emoji: "🔍",
    description: "Titlul și descrierea pentru Google / share-uri sociale.",
    fields: [
      { key: "seo_home_title", label: "Meta title (max 60 caractere)", fallback: "Mama Lucica · Lumânări handmade din ceară de soia | Made in Romania" },
      { key: "seo_home_description", label: "Meta description (max 160 caractere)", fallback: "Lumânări parfumate 100% handmade, turnate manual din ceară de soia. Calculator durată ardere, certificat de autenticitate, livrare 24-48h.", multiline: true },
    ],
  },
];

function FieldRow({ field, value, dirty, onChange }: {
  field: FieldDef;
  value: string;
  dirty: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={field.key} className="text-xs font-medium text-foreground">
          {field.label}
        </Label>
        <div className="flex items-center gap-2">
          {dirty && <Badge variant="outline" className="text-[10px] py-0 h-4 border-amber-400 text-amber-700 bg-amber-50">modificat</Badge>}
          <code className="text-[10px] text-muted-foreground font-mono">theme_text_{field.key}</code>
        </div>
      </div>
      {field.multiline ? (
        <Textarea
          id={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? field.fallback}
          rows={3}
          className="text-sm"
        />
      ) : (
        <Input
          id={field.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? field.fallback}
          className="text-sm"
        />
      )}
    </div>
  );
}

export default function AdminThemeTexts() {
  const { texts, setText, loading } = useThemeText();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Hidratează draft-ul din texte / fallback
  useEffect(() => {
    const d: Record<string, string> = {};
    SECTIONS.forEach((s) => {
      s.fields.forEach((f) => {
        const fullKey = `theme_text_${f.key}`;
        d[f.key] = texts[fullKey] ?? f.fallback;
      });
    });
    setDraft(d);
  }, [texts]);

  const dirtyKeys = useMemo(() => {
    const set = new Set<string>();
    SECTIONS.forEach((s) => s.fields.forEach((f) => {
      const cur = draft[f.key] ?? "";
      const original = texts[`theme_text_${f.key}`] ?? f.fallback;
      if (cur !== original) set.add(f.key);
    }));
    return set;
  }, [draft, texts]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.map((s) => ({
      ...s,
      fields: s.fields.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.fallback.toLowerCase().includes(q) ||
          f.key.toLowerCase().includes(q) ||
          (draft[f.key] ?? "").toLowerCase().includes(q)
      ),
    })).filter((s) => s.fields.length > 0);
  }, [search, draft]);

  const saveAll = async () => {
    if (dirtyKeys.size === 0) {
      toast.info("Nimic de salvat");
      return;
    }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const key of dirtyKeys) {
      const success = await setText(key, draft[key] ?? "");
      success ? ok++ : fail++;
    }
    setSaving(false);
    if (fail === 0) toast.success(`✅ ${ok} text${ok === 1 ? "" : "e"} salvat${ok === 1 ? "" : "e"}. Apare instant pe site.`);
    else toast.error(`Salvate ${ok}, eșuate ${fail}`);
  };

  const resetField = (key: string, fallback: string) => {
    setDraft((p) => ({ ...p, [key]: fallback }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Type className="w-6 h-6 text-primary" /> Texte Temă
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Editează toate textele și statisticile vizibile pe site. Modificările apar <strong className="text-foreground">instant</strong> pentru toți vizitatorii (Realtime sync).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Caută text…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={saveAll} disabled={saving || dirtyKeys.size === 0} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Se salvează..." : `Salvează ${dirtyKeys.size > 0 ? `(${dirtyKeys.size})` : ""}`}
          </Button>
        </div>
      </div>

      {/* Tip / hint */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80">
            <strong>Sincronizare în timp real:</strong> orice modificare salvată aici se aplică automat pe storefront fără refresh.
            Pentru imagini, butoane sau culori folosește <strong>Layout Homepage</strong> sau <strong>Temă & Culori</strong>.
          </div>
        </CardContent>
      </Card>

      {loading && Object.keys(draft).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Se încarcă textele…</div>
      ) : (
        <Accordion type="multiple" defaultValue={SECTIONS.map((s) => s.id)} className="space-y-3">
          {filteredSections.map((section) => {
            const sectionDirty = section.fields.filter((f) => dirtyKeys.has(f.key)).length;
            return (
              <AccordionItem key={section.id} value={section.id} className="border border-border rounded-lg bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{section.emoji}</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{section.fields.length} câmpuri</Badge>
                      {sectionDirty > 0 && (
                        <Badge className="text-[10px] bg-amber-500 hover:bg-amber-500">{sectionDirty} mod.</Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((f) => (
                      <div key={f.key} className="relative group">
                        <FieldRow
                          field={f}
                          value={draft[f.key] ?? ""}
                          dirty={dirtyKeys.has(f.key)}
                          onChange={(v) => setDraft((p) => ({ ...p, [f.key]: v }))}
                        />
                        {(draft[f.key] ?? "") !== f.fallback && (
                          <button
                            type="button"
                            onClick={() => resetField(f.key, f.fallback)}
                            className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                            title={`Resetează la: ${f.fallback}`}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {filteredSections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Niciun text nu corespunde căutării <strong>"{search}"</strong>.
          </CardContent>
        </Card>
      )}

      {/* Sticky save bar pentru mobil */}
      {dirtyKeys.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden">
          <Button onClick={saveAll} disabled={saving} size="lg" className="shadow-2xl gap-2">
            <Save className="w-4 h-4" />
            Salvează {dirtyKeys.size} modificări
          </Button>
        </div>
      )}
    </div>
  );
}
