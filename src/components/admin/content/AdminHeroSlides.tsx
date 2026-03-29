import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2, MoveUp, MoveDown, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  { id: "1", title: "Lumânări Artizanale Handmade", subtitle: "Fiecare lumânare e turnată manual cu dragoste și ingrediente naturale", cta: "DESCOPERĂ COLECȚIA", link: "/catalog", image: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=1200&h=500&fit=crop" },
  { id: "2", title: "Colecția de Sezon", subtitle: "Arome noi inspirate din natură — ediție limitată", cta: "VEZI NOUTĂȚILE", link: "/catalog?sort=newest", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1200&h=500&fit=crop" },
  { id: "3", title: "Seturi Cadou Premium", subtitle: "Dăruiește aromă și căldură — pachete elegante pentru orice ocazie", cta: "ALEGE CADOUL", link: "/catalog?category=cadouri-seturi", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=1200&h=500&fit=crop" },
];

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "hero_slides")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && Array.isArray(data.value_json)) {
          setSlides(data.value_json as unknown as HeroSlide[]);
        } else {
          setSlides(DEFAULT_SLIDES);
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "hero_slides", value_json: slides as any, description: "Hero slider slides" }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Slide-uri salvate!");
    setSaving(false);
  };

  const addSlide = () => {
    setSlides(s => [...s, { id: crypto.randomUUID(), title: "Slide Nou", subtitle: "", cta: "VEZI MAI MULT", link: "/catalog", image: "" }]);
  };

  const update = (id: string, field: keyof HeroSlide, val: string) => {
    setSlides(s => s.map(sl => sl.id === id ? { ...sl, [field]: val } : sl));
  };

  const remove = (id: string) => setSlides(s => s.filter(sl => sl.id !== id));

  const move = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const arr = [...slides];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSlides(arr);
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" /> Hero Slider
          </h1>
          <p className="text-sm text-muted-foreground">Gestionează slide-urile din slider-ul principal al homepage-ului</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addSlide}><Plus className="w-4 h-4 mr-2" />Adaugă Slide</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvează
          </Button>
        </div>
      </div>

      {slides.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Niciun slide. Adaugă slide-uri folosind butonul de sus.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {slides.map((slide, idx) => (
          <Card key={slide.id}>
            <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
              <span className="flex-1 font-medium text-sm truncate">{slide.title || "Slide fără titlu"}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(idx, -1)} disabled={idx === 0}><MoveUp className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(idx, 1)} disabled={idx === slides.length - 1}><MoveDown className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(slide.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4 px-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Titlu</Label><Input value={slide.title} onChange={e => update(slide.id, "title", e.target.value)} /></div>
                <div><Label>Subtitlu</Label><Input value={slide.subtitle} onChange={e => update(slide.id, "subtitle", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Text buton (CTA)</Label><Input value={slide.cta} onChange={e => update(slide.id, "cta", e.target.value)} /></div>
                <div><Label>Link buton</Label><Input value={slide.link} onChange={e => update(slide.id, "link", e.target.value)} /></div>
                <div><Label>URL Imagine</Label><Input value={slide.image} onChange={e => update(slide.id, "image", e.target.value)} /></div>
              </div>
              {slide.image && (
                <div className="mt-2"><img src={slide.image} alt={slide.title} className="h-24 w-full object-cover rounded-md border" /></div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
