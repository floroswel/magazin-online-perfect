import { useMemo, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageSeo } from "@/components/SeoHead";

const faqSections = [
  {
    title: "Comenzi & Livrare",
    items: [
      { q: "Cât durează livrarea?", a: "Livrarea standard durează 2-4 zile lucrătoare prin curier. Pentru produsele personalizate, adăugați 3-5 zile lucrătoare pentru preparare manuală." },
      { q: "Oferiți livrare gratuită?", a: "Da, livrarea este gratuită pentru comenzile peste 200 RON. Sub acest prag, costul de livrare este de 19.99 RON." },
      { q: "Pot urmări comanda?", a: "Da. Accesați pagina Urmărire Comandă sau secțiunea Comenzi din contul dvs. Veți primi și un email cu link-ul de tracking când comanda este expediată." },
      { q: "Livrați internațional?", a: "Da, livrăm în toate țările UE. Consultați pagina Livrare Internațională pentru tarife și termene." },
      { q: "Ce fac dacă pachetul e deteriorat?", a: "Contactați-ne în 24 de ore de la primire cu fotografii ale produsului și ambalajului deteriorat. Vom trimite un produs nou sau vom emite o rambursare completă." },
    ],
  },
  {
    title: "Lumânări & Produse",
    items: [
      { q: "Din ce este făcută ceara?", a: "Folosim exclusiv ceară de soia 100% naturală. Este vegană, biodegradabilă și arde mai curat decât ceara de parafină." },
      { q: "Cât durează prima ardere?", a: "Prima ardere este esențială. Lăsați lumânarea să ardă până când toată suprafața de ceară se topește uniform — de obicei 2-3 ore. Acest lucru previne formarea tunelului." },
      { q: "Cum tai fitilul corect?", a: "Tăiați fitilul la 5-6mm înainte de fiecare aprindere. Folosiți un tăietor de fitil sau foarfece. Un fitil prea lung produce fum și ardere inegală." },
      { q: "Cât durează o lumânare?", a: "Depinde de dimensiune: lumânările mici ard 20-30 ore, cele medii 40-50 ore, iar cele mari peste 60 ore. Timpul exact este indicat pe fiecare produs." },
      { q: "Lumânările sunt vegane?", a: "Da, toate lumânările VENTUZA sunt 100% vegane. Folosim ceară de soia, parfumuri fără ingrediente de origine animală și fitiluri din bumbac natural." },
    ],
  },
  {
    title: "Personalizare",
    items: [
      { q: "Ce pot personaliza?", a: "Puteți alege parfumul, culoarea, textul gravat sau tipărit, și tipul de ambalaj. Accesați pagina Personalizare pentru a crea lumânarea ideală." },
      { q: "Cât durează o comandă personalizată?", a: "Comenzile personalizate necesită 3-5 zile lucrătoare pentru preparare, plus timpul de livrare standard." },
      { q: "Pot returna o lumânare personalizată?", a: "Din motive igienice și de personalizare, lumânările cu text personalizat nu pot fi returnate, cu excepția defectelor de fabricație." },
      { q: "Cum văd previzualizarea?", a: "Pe pagina de personalizare veți vedea o previzualizare live a lumânării pe măsură ce faceți selecțiile." },
    ],
  },
  {
    title: "Plăți & Retururi",
    items: [
      { q: "Ce metode de plată acceptați?", a: "Acceptăm card online, transfer bancar, ramburs la curier și plata în rate prin partenerii noștri." },
      { q: "Cum returnez un produs?", a: "Accesați secțiunea Comenzi din contul dvs. și selectați Solicită Retur. Completați formularul și vă vom contacta în 24 de ore." },
      { q: "În cât timp primesc rambursul?", a: "Rambursul se procesează în 5-10 zile lucrătoare de la primirea produsului returnat, pe aceeași metodă de plată folosită la comandă." },
      { q: "Oferiți facturi fiscale?", a: "Da, puteți solicita factură fiscală la checkout completând datele companiei (CUI, denumire, adresă)." },
    ],
  },
  {
    title: "Personalizare",
    items: [
      { q: "Pot personaliza o lumânare?", a: "Da! Accesează pagina de Personalizare unde poți alege baza, parfumul, culoarea, textul și ambalajul. Fiecare lumânare este creată manual după specificațiile tale." },
      { q: "Cât durează o comandă personalizată?", a: "Lumânările personalizate se realizează în 3-5 zile lucrătoare, fiind create manual de echipa noastră." },
      { q: "Pot comanda un set cadou personalizat?", a: "Da, oferim seturi cadou personalizate cu ambalaj premium, mesaj personalizat și fundă de mătase. Selectează opțiunea la checkout." },
    ],
  },
];

export default function FAQ() {
  usePageSeo({
    title: "Întrebări Frecvente — FAQ | MamaLucica",
    description: "Răspunsuri la cele mai comune întrebări despre comenzi, livrare, plăți, retururi și lumânările handmade MamaLucica.",
  });

  // Schema.org FAQPage structured data
  useEffect(() => {
    const allItems = faqSections.flatMap(s => s.items);
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: allItems.map(item => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    script.id = "faq-schema";
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("faq-schema");
      if (el) el.remove();
    };
  }, []);

  return (
    <Layout>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-ventuza-gold mb-4 font-medium">Suport</p>
          <h1 className="font-serif text-4xl font-medium">Întrebări Frecvente</h1>
        </div>
      </section>

      <div className="container py-16 max-w-3xl space-y-12">
        {faqSections.map((section, si) => (
          <div key={si}>
            <h2 className="font-serif text-xl font-medium text-foreground mb-6">{section.title}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {section.items.map((item, i) => (
                <AccordionItem key={i} value={`${si}-${i}`} className="border border-border px-5">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </Layout>
  );
}
