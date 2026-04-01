import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface EditorField {
  key: string;
  label: string;
  type: "text" | "textarea" | "color" | "url" | "switch";
  placeholder?: string;
}

/** Define which fields are editable per element_key */
const ELEMENT_FIELDS: Record<string, EditorField[]> = {
  free_shipping_bar: [
    { key: "text_below", label: "Text (sub prag)", type: "text", placeholder: "Livrare gratuită peste 200 lei" },
    { key: "text_above", label: "Text (peste prag)", type: "text", placeholder: "🎉 Transport gratuit!" },
    { key: "threshold", label: "Prag (RON)", type: "text", placeholder: "200" },
    { key: "bg_color", label: "Culoare fundal", type: "color" },
    { key: "text_color", label: "Culoare text", type: "color" },
  ],
  hero_image: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Titlu hero" },
    { key: "subtitle", label: "Subtitlu", type: "text", placeholder: "Subtitlu hero" },
    { key: "cta_text", label: "Text buton", type: "text", placeholder: "Explorează" },
    { key: "cta_link", label: "Link buton", type: "url", placeholder: "/catalog" },
    { key: "image_url", label: "URL imagine fundal", type: "url", placeholder: "https://..." },
  ],
  hero_headline: [
    { key: "text", label: "Titlu Hero", type: "text", placeholder: "Titlul principal" },
    { key: "font_size", label: "Mărime font (px)", type: "text", placeholder: "48" },
    { key: "text_color", label: "Culoare text", type: "color" },
  ],
  hero_subtitle: [
    { key: "text", label: "Subtitlu", type: "text", placeholder: "Subtitlul hero" },
    { key: "text_color", label: "Culoare text", type: "color" },
  ],
  hero_cta: [
    { key: "primary_text", label: "Text buton principal", type: "text", placeholder: "Cumpără acum" },
    { key: "primary_link", label: "Link buton principal", type: "url", placeholder: "/catalog" },
    { key: "secondary_text", label: "Text buton secundar", type: "text", placeholder: "Află mai mult" },
    { key: "secondary_link", label: "Link buton secundar", type: "url", placeholder: "/povestea-noastra" },
  ],
  header_logo: [
    { key: "logo_url", label: "URL logo (imagine)", type: "url", placeholder: "https://..." },
    { key: "logo_text", label: "Text logo (dacă nu e imagine)", type: "text", placeholder: "MamaLucica" },
    { key: "bg_color", label: "Culoare fundal header", type: "color" },
    { key: "icon_color", label: "Culoare iconițe", type: "color" },
  ],
  header_search: [
    { key: "placeholder", label: "Placeholder căutare", type: "text", placeholder: "Caută lumânări, arome..." },
    { key: "bg_color", label: "Culoare fundal input", type: "color" },
  ],
  popup_welcome: [
    { key: "title", label: "Titlu popup", type: "text", placeholder: "Bun venit!" },
    { key: "message", label: "Mesaj", type: "textarea", placeholder: "Bucură-te de 10% reducere..." },
    { key: "cta_text", label: "Text buton", type: "text", placeholder: "Obține reducerea" },
    { key: "cta_link", label: "Link buton", type: "url", placeholder: "/catalog" },
    { key: "delay_seconds", label: "Delay (secunde)", type: "text", placeholder: "5" },
  ],
  popup_newsletter: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Abonează-te!" },
    { key: "message", label: "Mesaj", type: "textarea", placeholder: "Primește oferte exclusive..." },
    { key: "discount_code", label: "Cod reducere", type: "text", placeholder: "WELCOME10" },
    { key: "bg_color", label: "Culoare fundal", type: "color" },
  ],
  popup_exit_intent: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Așteaptă!" },
    { key: "message", label: "Mesaj", type: "textarea", placeholder: "Nu pleca fără reducerea ta..." },
    { key: "discount_code", label: "Cod reducere", type: "text", placeholder: "STAY10" },
  ],
  section_personalizare: [
    { key: "title", label: "Titlu secțiune", type: "text", placeholder: "Personalizare" },
    { key: "subtitle", label: "Subtitlu", type: "text", placeholder: "Creăm lumânări unice" },
    { key: "cta_text", label: "Text buton", type: "text", placeholder: "Personalizează" },
    { key: "cta_link", label: "Link buton", type: "url", placeholder: "/personalizare" },
  ],
  section_featured: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Produse Recomandate" },
    { key: "subtitle", label: "Subtitlu", type: "text", placeholder: "Selecția noastră" },
    { key: "max_products", label: "Nr. produse afișate", type: "text", placeholder: "8" },
  ],
  section_bestsellers: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Cele Mai Vândute" },
    { key: "max_products", label: "Nr. produse afișate", type: "text", placeholder: "8" },
  ],
  section_why_mamalucica: [
    { key: "title", label: "Titlu secțiune", type: "text", placeholder: "Mai mult decât o lumânare" },
    { key: "reason_1_title", label: "Motiv 1 — Titlu", type: "text", placeholder: "Ceară 100% Naturală" },
    { key: "reason_1_desc", label: "Motiv 1 — Descriere", type: "text", placeholder: "Ceară de soia premium..." },
    { key: "reason_2_title", label: "Motiv 2 — Titlu", type: "text", placeholder: "Handmade în România" },
    { key: "reason_2_desc", label: "Motiv 2 — Descriere", type: "text", placeholder: "Fiecare lumânare..." },
    { key: "reason_3_title", label: "Motiv 3 — Titlu", type: "text", placeholder: "Personalizare Completă" },
    { key: "reason_3_desc", label: "Motiv 3 — Descriere", type: "text", placeholder: "Alege aroma, culoarea..." },
    { key: "reason_4_title", label: "Motiv 4 — Titlu", type: "text", placeholder: "Livrare Rapidă" },
    { key: "reason_4_desc", label: "Motiv 4 — Descriere", type: "text", placeholder: "Comenzile peste 200 RON..." },
  ],
  section_process: [
    { key: "title", label: "Titlu secțiune", type: "text", placeholder: "Cum creăm lumânările" },
  ],
  section_testimonials: [
    { key: "title", label: "Titlu secțiune", type: "text", placeholder: "Ce spun clienții" },
  ],
  section_quiz: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Descoperă aroma ta" },
    { key: "subtitle", label: "Subtitlu", type: "text", placeholder: "Răspunde la câteva întrebări..." },
    { key: "cta_text", label: "Text buton", type: "text", placeholder: "Începe quiz-ul" },
  ],
  footer_columns: [
    { key: "col1_title", label: "Coloana 1 — Titlu", type: "text", placeholder: "MamaLucica" },
    { key: "col1_description", label: "Coloana 1 — Descriere", type: "textarea", placeholder: "Magazinul tău..." },
  ],
  footer_social: [
    { key: "facebook_url", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/..." },
    { key: "instagram_url", label: "Instagram URL", type: "url", placeholder: "https://instagram.com/..." },
    { key: "tiktok_url", label: "TikTok URL", type: "url", placeholder: "https://tiktok.com/..." },
    { key: "youtube_url", label: "YouTube URL", type: "url", placeholder: "https://youtube.com/..." },
  ],
  notification_social_proof: [
    { key: "message_template", label: "Șablon mesaj", type: "text", placeholder: "{name} din {city} a cumpărat {product}" },
    { key: "display_duration", label: "Durata afișare (s)", type: "text", placeholder: "5" },
    { key: "interval", label: "Interval (s)", type: "text", placeholder: "30" },
  ],
  promo_badges: [
    { key: "sale_text", label: "Text reducere", type: "text", placeholder: "REDUCERE" },
    { key: "new_text", label: "Text nou", type: "text", placeholder: "NOU" },
    { key: "badge_color", label: "Culoare badge", type: "color" },
  ],
  promo_countdown: [
    { key: "end_date", label: "Data expirare", type: "text", placeholder: "2026-12-31T23:59" },
    { key: "title", label: "Titlu countdown", type: "text", placeholder: "Oferta expiră în:" },
    { key: "bg_color", label: "Culoare fundal", type: "color" },
  ],
  widget_chat: [
    { key: "greeting", label: "Mesaj de întâmpinare", type: "text", placeholder: "Bună! Cu ce te putem ajuta?" },
    { key: "position", label: "Poziție (left/right)", type: "text", placeholder: "right" },
  ],
  instagram_feed: [
    { key: "title", label: "Titlu secțiune", type: "text", placeholder: "Urmărește-ne pe Instagram" },
    { key: "handle", label: "Handle Instagram", type: "text", placeholder: "@mamalucica" },
  ],
  brand_logos: [
    { key: "title", label: "Titlu secțiune", type: "text", placeholder: "Branduri partenere" },
  ],
  coupon_collector: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Cupoane disponibile" },
  ],
  quick_filters: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Filtre rapide" },
  ],
  top_vendors: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Top Artizani" },
  ],
  buy_again: [
    { key: "title", label: "Titlu", type: "text", placeholder: "Cumpără din nou" },
  ],
};

interface Props {
  elementKey: string;
  onClose: () => void;
}

export default function ControlElementEditor({ elementKey, onClose }: Props) {
  const fields = ELEMENT_FIELDS[elementKey];
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const settingKey = `element_config_${elementKey}`;

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", settingKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && typeof data.value_json === "object" && !Array.isArray(data.value_json)) {
          setValues(data.value_json as Record<string, string>);
        }
        setLoading(false);
      });
  }, [settingKey]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: settingKey, value_json: values as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      toast.error("Eroare la salvare");
    } else {
      toast.success("Configurare salvată!");
    }
    setSaving(false);
  };

  if (!fields || fields.length === 0) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-border mt-2">
        <p className="text-xs text-muted-foreground">Acest element nu are opțiuni de editare disponibile încă.</p>
        <Button size="sm" variant="ghost" onClick={onClose} className="mt-2"><X className="w-3 h-3 mr-1" /> Închide</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-border mt-2 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs text-muted-foreground">Se încarcă...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-primary/20 mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Editare configurare</h4>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
            <Label className="text-xs mb-1 block">{field.label}</Label>
            {field.type === "textarea" ? (
              <Textarea
                className="text-xs min-h-[60px]"
                placeholder={field.placeholder}
                value={values[field.key] || ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
            ) : field.type === "color" ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-10 rounded border border-border cursor-pointer"
                  value={values[field.key] || "#000000"}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                />
                <Input
                  className="h-8 text-xs flex-1"
                  placeholder={field.placeholder || "#000000"}
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                />
              </div>
            ) : field.type === "switch" ? (
              <Switch
                checked={values[field.key] === "true"}
                onCheckedChange={(c) => setValues({ ...values, [field.key]: String(c) })}
              />
            ) : (
              <Input
                className="h-8 text-xs"
                type={field.type === "url" ? "url" : "text"}
                placeholder={field.placeholder}
                value={values[field.key] || ""}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Se salvează..." : "Salvează"}
        </Button>
      </div>
    </div>
  );
}
