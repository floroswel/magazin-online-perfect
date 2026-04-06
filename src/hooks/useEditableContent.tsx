import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// All editable content keys and their defaults
export interface EditableContent {
  announcement: {
    text_desktop: string;
    text_mobile: string;
    threshold: number;
    emoji: string;
    bg_color: string;
    text_color: string;
    marquee: boolean;
    marquee_mobile: boolean;
    enabled: boolean;
    show_countdown: boolean;
    fallback_text: string;
  };
  header_topbar: {
    phone: string;
    shipping_text: string;
    location: string;
  };
  header_nav: Array<{ to: string; label: string; highlight?: boolean }>;
  mobile_categories: Array<{ name: string; slug: string; icon: string }>;
  why_section: {
    title: string;
    items: Array<{ icon: string; title: string; desc: string }>;
  };
  process_section: {
    subtitle: string;
    title: string;
    steps: Array<{ number: string; title: string; desc: string }>;
  };
  scent_promos: Array<{ title: string; subtitle: string; cta: string; link: string; image: string }>;
  trust_strip: Array<{ icon: string; title: string; desc: string }>;
  social_proof_static: Array<{ icon: string; label: string; desc: string }>;
}

const DEFAULTS: EditableContent = {
  announcement: {
    text_desktop: "🕯️ Livrare GRATUITĂ la comenzi peste {threshold} lei | Oferta expiră în ",
    text_mobile: "🕯️ Livrare GRATUITĂ — ",
    threshold: 200,
    emoji: "🕯️",
    bg_color: "",
    text_color: "",
    marquee: false,
    marquee_mobile: false,
    enabled: true,
    show_countdown: true,
    fallback_text: "",
  },
  header_topbar: {
    phone: "📞 0800-123-456",
    shipping_text: "🚚 Livrare GRATUITĂ la comenzi peste 150 lei",
    location: "📍 București, România",
  },
  header_nav: [
    { to: "/catalog?badge=deals", label: "Oferte MamaLucica", highlight: true },
    { to: "/catalog", label: "Catalog" },
    { to: "/despre-noi", label: "Despre Noi" },
    { to: "/blog", label: "Blog" },
    { to: "/contact", label: "Contact" },
  ],
  mobile_categories: [],
  why_section: {
    title: "Mai mult decât o lumânare",
    items: [
      { icon: "Leaf", title: "Ceară 100% Naturală", desc: "Ceară de soia premium, fără parafină sau aditivi chimici. Arde curat." },
      { icon: "Hand", title: "Handmade în România", desc: "Fiecare lumânare e turnată manual, cu atenție, în atelierul nostru." },
      { icon: "Palette", title: "Personalizare Completă", desc: "Alege aroma, culoarea, mesajul. Creăm lumânări unice pentru tine." },
      { icon: "Truck", title: "Livrare Rapidă & Gratuită", desc: "Comenzile peste 200 RON cu livrare gratuită. Ambalaj premium." },
    ],
  },
  process_section: {
    subtitle: "Procesul Nostru",
    title: "De la Mâinile Noastre la Casa Ta",
    steps: [
      { number: "01", title: "Ingrediente Selectate", desc: "Ceară de soia 100%, uleiuri esențiale premium și fitiluri din bumbac natural" },
      { number: "02", title: "Preparare Manuală", desc: "Fiecare lumânare este turnată și parfumată manual de echipa noastră" },
      { number: "03", title: "Ambalare cu Grijă", desc: "Împachetată cu atenție în materiale sustenabile, gata să ajungă la tine" },
    ],
  },
  scent_promos: [
    { title: "Lumânări de Sezon", subtitle: "Arome noi de toamnă", cta: "Descoperă Colecția", link: "/catalog?category=colectii-sezoniere", image: "https://images.unsplash.com/photo-1605651531144-51381895e23a?w=600&h=300&fit=crop" },
    { title: "Personalizează-ți Lumânarea", subtitle: "Gravură, arome, culori la alegere", cta: "Creează Acum", link: "/personalizare", image: "https://images.unsplash.com/photo-1608181831718-3b43e628bba2?w=600&h=300&fit=crop" },
  ],
  trust_strip: [
    { icon: "Truck", title: "Livrare 24-48h", desc: "La nivel national" },
    { icon: "RotateCcw", title: "Retur 30 zile", desc: "Fara intrebari" },
    { icon: "ShieldCheck", title: "Plata Securizata", desc: "Criptare SSL" },
    { icon: "Headphones", title: "Support 9-17", desc: "Luni - Vineri" },
  ],
  social_proof_static: [
    { icon: "Truck", label: "Livrare Gratuită", desc: "La comenzi peste 200 lei" },
    { icon: "Shield", label: "Plată Securizată", desc: "100% protejat" },
    { icon: "RotateCcw", label: "Retur Gratuit", desc: "30 zile garanție" },
  ],
};

const CONTENT_KEYS = [
  "editable_announcement",
  "editable_header_topbar",
  "editable_header_nav",
  "editable_mobile_categories",
  "editable_why_section",
  "editable_process_section",
  "editable_scent_promos",
  "editable_trust_strip",
  "editable_social_proof_static",
];

const EditableContentContext = createContext<EditableContent>(DEFAULTS);

export function EditableContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<EditableContent>(DEFAULTS);

  const fetchContent = useCallback(async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", CONTENT_KEYS);

    if (!data || data.length === 0) return;

    const updated = { ...DEFAULTS };
    const keyMap: Record<string, keyof EditableContent> = {
      editable_announcement: "announcement",
      editable_header_topbar: "header_topbar",
      editable_header_nav: "header_nav",
      editable_mobile_categories: "mobile_categories",
      editable_why_section: "why_section",
      editable_process_section: "process_section",
      editable_scent_promos: "scent_promos",
      editable_trust_strip: "trust_strip",
      editable_social_proof_static: "social_proof_static",
    };

    data.forEach((row: any) => {
      const field = keyMap[row.key];
      if (field && row.value_json != null) {
        (updated as any)[field] = row.value_json;
      }
    });

    setContent(updated);
  }, []);

  useEffect(() => {
    fetchContent();

    const channel = supabase
      .channel("editable-content-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "app_settings",
      }, (payload: any) => {
        if (CONTENT_KEYS.includes(payload.new?.key)) {
          fetchContent();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchContent]);

  return (
    <EditableContentContext.Provider value={content}>
      {children}
    </EditableContentContext.Provider>
  );
}

export function useEditableContent() {
  return useContext(EditableContentContext);
}

export { DEFAULTS as EDITABLE_DEFAULTS };
