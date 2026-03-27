import Layout from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const sections = [
  {
    title: "🚚 Comenzi & Livrare",
    items: [
      { q: "Cât durează livrarea?", a: "Livrarea standard durează 1-3 zile lucrătoare prin Sameday sau Fan Courier. Pentru lumânările realizate la comandă (made to order), adaugă 3-5 zile de preparare manuală." },
      { q: "Oferiți livrare gratuită?", a: "Da! Livrarea este gratuită pentru comenzile peste 200 RON. Sub această sumă, costul livrării este afișat la checkout." },
      { q: "Pot urmări comanda?", a: "Absolut! După expediere primești un email cu numărul AWB și link-ul de tracking. Poți verifica și pe pagina de Urmărire Comandă." },
      { q: "Livrați internațional?", a: "Da, livrăm în toată Europa. Consultă pagina Livrare Internațională pentru detalii despre costuri și termene." },
      { q: "Ce fac dacă pachetul e deteriorat?", a: "Contactează-ne în 24h cu poze ale pachetului și produsului. Vom trimite un produs nou sau vom emite rambursul integral." },
    ],
  },
  {
    title: "🕯️ Lumânări & Produse",
    items: [
      { q: "Din ce este făcută ceara?", a: "Folosim predominant ceară de soia 100% naturală, biodegradabilă și vegană. Unele lumânări decorative (twisted, sculptate) sunt din parafină premium." },
      { q: "Cât durează prima ardere?", a: "Prima ardere trebuie să fie de minim 1-2 ore, până se topește uniform stratul de sus. Acest lucru previne efectul de 'tunel'." },
      { q: "Cum tai fitilul corect?", a: "Taie fitilul la ~5mm înainte de fiecare aprindere. Un fitil prea lung produce fum negru, iar unul prea scurt se stinge singur." },
      { q: "Cât durează o lumânare?", a: "Depinde de dimensiune: lumânările medii (200g) ard 30-40 ore, cele mari (350g) 40-50 ore. Durata exactă e menționată pe fiecare produs." },
      { q: "Lumânările sunt vegane?", a: "Toate lumânările din ceară de soia sunt 100% vegane. Lumânările din parafină sau ceară de albine nu sunt considerate vegane." },
    ],
  },
  {
    title: "✨ Personalizare",
    items: [
      { q: "Ce pot personaliza?", a: "Poți alege parfumul, culoarea, textul de pe etichetă și tipul de ambalaj. Folosește Personalizare Builder-ul nostru pentru a crea lumânarea perfectă." },
      { q: "Cât durează o comandă personalizată?", a: "Lumânările personalizate sunt realizate la comandă și necesită 3-7 zile lucrătoare de preparare, plus 1-3 zile de livrare." },
      { q: "Pot returna o lumânare personalizată?", a: "Din cauza naturii unice a produsului, lumânările personalizate nu pot fi returnate, cu excepția defectelor de fabricație." },
      { q: "Cum văd previzualizarea înainte de comandă?", a: "Builder-ul de personalizare arată o previzualizare live a selecțiilor tale. Confirmarea finală se face la adăugarea în coș." },
    ],
  },
  {
    title: "💳 Plăți & Retururi",
    items: [
      { q: "Ce metode de plată acceptați?", a: "Acceptăm: Card online (Visa/Mastercard), Ramburs la livrare, Transfer bancar, Apple Pay/Google Pay, și plată în rate prin TBI Bank." },
      { q: "Cum returnez un produs?", a: "Ai dreptul de retur în 14 zile de la primire. Completează formularul de retur din contul tău sau contactează-ne. Produsul trebuie să fie neutilizat și în ambalajul original." },
      { q: "În cât timp primesc rambursul?", a: "Rambursul se procesează în 3-5 zile lucrătoare de la primirea produsului returnat, prin aceeași metodă de plată folosită la comandă." },
      { q: "Oferiți facturi fiscale?", a: "Da! Factura fiscală se generează automat și se trimite pe email la fiecare comandă. Pentru persoane juridice, adaugă datele firmei la checkout." },
    ],
  },
  {
    title: "📦 Abonamente",
    items: [
      { q: "Cum funcționează abonamentul?", a: "Alegi planul (Esențial 39 RON / Confort 69 RON / Premium 119 RON) și primești lumânări noi în fiecare lună, direct la ușă." },
      { q: "Pot schimba parfumul lunar?", a: "La planurile Confort și Premium poți alege parfumul preferat. La planul Esențial, noi selectăm cel mai potrivit parfum sezonier." },
      { q: "Cum anulez abonamentul?", a: "Poți anula oricând din contul tău, secțiunea Abonamente. Anularea se aplică de la următoarea lună — nu există penalizări." },
      { q: "Când se livrează abonamentul lunar?", a: "Abonamentele se pregătesc în primele 5 zile ale lunii și se livrează între zilele 5-10. Vei primi notificare cu tracking-ul." },
    ],
  },
];

export default function FAQ() {
  return (
    <Layout>
      <SeoHead title="FAQ — Întrebări Frecvente | VENTUZA" description="Răspunsuri la cele mai frecvente întrebări despre lumânările VENTUZA: livrare, personalizare, plăți, retururi și abonamente." />
      <div className="container py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Întrebări Frecvente</h1>
        <p className="text-muted-foreground mb-8">Ai o întrebare? Probabil găsești răspunsul aici. Dacă nu, <Link to="/page/contact" className="text-primary hover:underline">contactează-ne</Link>.</p>

        {sections.map((section, si) => (
          <div key={si} className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{section.title}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {section.items.map((item, ii) => (
                <AccordionItem key={ii} value={`s${si}-q${ii}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-medium text-sm">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </Layout>
  );
}
