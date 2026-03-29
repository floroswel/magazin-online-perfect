import Layout from "@/components/layout/Layout";
import { Shield, CreditCard, Truck, RotateCcw, Star, Award, Lock, CheckCircle, Users, Package } from "lucide-react";
import { usePageSeo } from "@/components/SeoHead";

const stats = [
  { icon: Package, value: "5,000+", label: "Comenzi livrate" },
  { icon: Users, value: "3,500+", label: "Clienți mulțumiți" },
  { icon: Star, value: "4.8/5", label: "Rating mediu" },
  { icon: Award, value: "3+ ani", label: "De activitate" },
];

const trustPoints = [
  {
    icon: Lock,
    title: "Plăți 100% Securizate",
    description: "Toate tranzacțiile sunt criptate SSL. Acceptăm card online (Visa, Mastercard), transfer bancar, ramburs la curier și plata în rate.",
  },
  {
    icon: Shield,
    title: "Protecția Cumpărătorului",
    description: "Datele tale sunt protejate conform GDPR. Nu partajăm informațiile personale cu terți și respectăm dreptul tău la confidențialitate.",
  },
  {
    icon: Truck,
    title: "Livrare Rapidă & Sigură",
    description: "Livrăm în 1-3 zile lucrătoare prin curieri de încredere. Transport GRATUIT pentru comenzi peste 200 lei. Ambalaj protectiv pentru fiecare produs.",
  },
  {
    icon: RotateCcw,
    title: "Retur Gratuit 30 Zile",
    description: "Nu ești mulțumit? Returnează produsul în 30 de zile și primești rambursul integral. Fără întrebări, fără complicații.",
  },
  {
    icon: CheckCircle,
    title: "Produse Verificate & Handmade",
    description: "Fiecare lumânare este creată manual din ceară de soia 100% naturală, cu ingrediente premium. Verificăm calitatea fiecărui produs înainte de expediere.",
  },
  {
    icon: CreditCard,
    title: "Metode de Plată Flexibile",
    description: "Card online (3D Secure), transfer bancar, ramburs la curier, sau plata în rate fără dobândă prin Mokka și PayPo.",
  },
];

const paymentLogos = [
  "Visa", "Mastercard", "Apple Pay", "Google Pay", "Mokka", "PayPo", "Transfer bancar", "Ramburs",
];

export default function DeIncredere() {
  usePageSeo({
    title: "De Încredere — Garanții și Securitate | MamaLucica",
    description: "Plăți securizate, retur gratuit 30 zile, produse verificate handmade. Descoperă de ce peste 3,500 clienți aleg MamaLucica.",
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20">
        <div className="container max-w-3xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-medium mb-3">De Ce Ne Poți Avea Încredere</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Transparență, calitate și grija pentru client — valorile pe care le punem în fiecare comandă.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-5 text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Points */}
      <section className="container py-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustPoints.map((point) => (
            <div key={point.title} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <point.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{point.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Methods */}
      <section className="container py-10">
        <h2 className="font-serif text-2xl font-medium text-foreground text-center mb-6">Metode de Plată Acceptate</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {paymentLogos.map((name) => (
            <div key={name} className="bg-card border border-border rounded-lg px-5 py-3 text-sm font-medium text-foreground">
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-muted/30 py-12 mt-8">
        <div className="container text-center">
          <h2 className="font-serif text-2xl font-medium text-foreground mb-4">Conformitate & Certificări</h2>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> ANPC Înregistrat</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> GDPR Compliant</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> SSL Securizat</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> eAdvertising SOL</div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Ceară de Soia Certificată</div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
