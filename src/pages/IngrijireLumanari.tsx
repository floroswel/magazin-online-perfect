import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const sections = [
  {
    icon: "🔥",
    title: "Prima ardere — Memory Burn",
    content: "La prima utilizare, lasă lumânarea să ardă suficient de mult încât toată suprafața de ceară de sus să se topească uniform. Acest lucru previne formarea unui tunel și asigură o ardere uniformă pe toată durata de viață a lumânării.",
  },
  {
    icon: "✂️",
    title: "Tunsul fitilului",
    content: "Înainte de fiecare utilizare, taie fitilul la aproximativ 5mm. Un fitil prea lung produce fum, o flacără prea mare și poate întuneca recipientul. Folosește un tunzător special de fitil sau o foarfecă.",
  },
  {
    icon: "⏱️",
    title: "Durata sesiunilor de ardere",
    content: "Nu lăsa lumânarea să ardă mai mult de 4 ore continuu. După 4 ore, stinge-o, lasă-o să se răcească complet (cel puțin 2 ore), apoi poți reaprinde. Sesiunile ideale sunt de 2-3 ore.",
  },
  {
    icon: "🏠",
    title: "Depozitare",
    content: "Păstrează lumânările într-un loc răcoros, uscat și departe de lumina directă a soarelui. Temperatura ideală de depozitare este între 15-25°C. Evită locurile cu umiditate mare.",
  },
  {
    icon: "🛡️",
    title: "Siguranță",
    content: "Nu lăsa niciodată o lumânare aprinsă nesupravegheată. Plasează lumânarea pe o suprafață stabilă, rezistentă la căldură. Menține distanța față de materiale inflamabile, copii și animale de companie.",
  },
];

const faqs = [
  { q: "De ce apare un tunel în lumânare?", a: "Tunelul apare când prima ardere nu a durat suficient. Asigură-te că la prima utilizare toată suprafața de sus se topește uniform." },
  { q: "De ce lumânarea mea produce fum negru?", a: "Fitilul este prea lung. Taie-l la 5mm înainte de fiecare utilizare." },
  { q: "Cât timp durează o lumânare MamaLucica?", a: "Lumânările noastre medii ard între 35-45 ore, în funcție de dimensiune și condițiile de utilizare." },
  { q: "Pot reutiliza recipientul?", a: "Absolut! După ce lumânarea s-a consumat, curăță recipientul cu apă caldă și poți folosi pentru depozitare sau ca vas decorativ." },
];

export default function IngrijireLumanari() {
  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground">🕯️ Ghid de Îngrijire Lumânări</h1>
          <p className="text-muted-foreground mt-2">Sfaturi esențiale pentru a te bucura la maxim de lumânările MamaLucica</p>
        </div>

        <div className="space-y-6 mb-12">
          {sections.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <h2 className="font-semibold text-foreground text-lg mb-2">{s.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{s.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-bold text-foreground text-center mb-6">Întrebări frecvente</h2>
        <div className="space-y-4 mb-8">
          {faqs.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="font-semibold text-foreground mb-1">{f.q}</p>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => window.print()}>🖨️ Printează ghidul</Button>
        </div>
      </div>
    </Layout>
  );
}
