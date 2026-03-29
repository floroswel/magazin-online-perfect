import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";

interface PovesteaSection { label: string; title: string; text: string; }

const defaultSections: PovesteaSection[] = [
  { label: "Cum a Început", title: "O Pasiune Născută Acasă", text: "MamaLucica s-a născut dintr-o pasiune simplă: dorința de a crea ceva frumos, cu mâinile proprii, din ingrediente naturale. Totul a început acasă, în bucătărie, cu primele experimente cu ceară de soia și uleiuri esențiale. Astăzi, fiecare lumânare MamaLucica poartă aceeași dragoste și atenție la detalii din primele zile." },
  { label: "Ingrediente", title: "Ce Folosim", text: "" },
  { label: "Principii", title: "Valorile Noastre", text: "" },
  { label: "Angajament", title: "Promisiunea Noastră", text: "Fiecare lumânare MamaLucica este o mică operă de artă. Promitem să folosim mereu ingrediente naturale, să respectăm mediul și să creăm produse care aduc bucurie în fiecare casă." },
];

export default function PovesteaNoastra() {
  const [sections, setSections] = useState<PovesteaSection[]>([]);

  useEffect(() => {
    supabase.from("app_settings").select("value_json").eq("key", "static_page_povestea").maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && Array.isArray(data.value_json) && data.value_json.length > 0) {
          setSections(data.value_json as unknown as PovesteaSection[]);
        }
      });
  }, []);
  usePageSeo({
    title: "Povestea MamaLucica — Lumânări Artizanale din România",
    description: "Descoperă cum a început MamaLucica și pasiunea noastră pentru lumânări artizanale din ingrediente naturale.",
  });
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-secondary text-secondary-foreground py-16 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-4 font-medium">Despre Noi</p>
          <h1 className="font-serif text-3xl md:text-5xl font-medium leading-tight mb-6">Povestea MamaLucica</h1>
          <p className="text-secondary-foreground/60 text-base md:text-lg leading-relaxed">
            De la pasiune la parfumuri care transformă fiecare moment
          </p>
        </div>
      </section>

      {sections.length > 0 ? (
        <div className="max-w-3xl mx-auto py-12 md:py-24 px-4 space-y-16 md:space-y-20">
          {sections.map((sec, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-border mb-16" />}
              <section>
                <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 font-medium">{sec.label}</p>
                <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-6">{sec.title}</h2>
                {sec.text && <p className="text-muted-foreground leading-relaxed text-lg">{sec.text}</p>}
              </section>
            </div>
          ))}
          <p className="text-xs text-primary tracking-wide text-center mt-8">Handmade cu dragoste în România 🇷🇴</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto py-12 md:py-24 px-4 space-y-16 md:space-y-20">
          <section>
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 font-medium">Cum a Început</p>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-6">O Pasiune Născută Acasă</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              MamaLucica s-a născut dintr-o pasiune simplă: dorința de a crea ceva frumos, cu mâinile proprii, din ingrediente naturale.
            </p>
          </section>
          <div className="border-t border-border my-8" />
          <section className="text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 font-medium">Angajament</p>
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-6">Promisiunea Noastră</h2>
            <p className="text-muted-foreground leading-relaxed text-lg max-w-xl mx-auto">
              Fiecare lumânare MamaLucica este o mică operă de artă. Promitem să folosim mereu ingrediente naturale,
              să respectăm mediul și să creăm produse care aduc bucurie în fiecare casă.
            </p>
            <p className="text-xs text-primary tracking-wide mt-8">Handmade cu dragoste în România 🇷🇴</p>
          </section>
        </div>
      )
    </Layout>
  );
}
