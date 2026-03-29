import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const countries = [
  { name: "România", cost: "GRATUIT peste 200 RON", days: "2-4 zile" },
  { name: "Bulgaria", cost: "25 RON", days: "5-7 zile" },
  { name: "Ungaria", cost: "25 RON", days: "5-7 zile" },
  { name: "Germania", cost: "35 RON", days: "7-10 zile" },
  { name: "Austria", cost: "35 RON", days: "7-10 zile" },
  { name: "Italia", cost: "35 RON", days: "7-10 zile" },
  { name: "Franța", cost: "40 RON", days: "7-12 zile" },
  { name: "Spania", cost: "40 RON", days: "7-12 zile" },
  { name: "Olanda", cost: "40 RON", days: "7-12 zile" },
  { name: "Alte țări UE", cost: "45 RON", days: "10-14 zile" },
];

export default function LivrareInternationala() {
  return (
    <Layout>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20">
        <div className="container max-w-3xl text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-4 font-medium">Livrare</p>
          <h1 className="font-serif text-4xl font-medium mb-4">Livrare Internațională</h1>
          <p className="text-secondary-foreground/60">Livrăm lumânările MamaLucica în toată Europa</p>
        </div>
      </section>

      <div className="container py-16 max-w-3xl space-y-12">
        <div className="border border-border">
          <div className="grid grid-cols-3 text-xs tracking-wide uppercase text-muted-foreground border-b border-border px-6 py-3">
            <span>Țară</span>
            <span>Cost Livrare</span>
            <span>Timp Estimat</span>
          </div>
          {countries.map((c, i) => (
            <div key={i} className="grid grid-cols-3 text-sm px-6 py-3 border-b border-border last:border-0">
              <span className="font-medium text-foreground">{c.name}</span>
              <span className="text-muted-foreground">{c.cost}</span>
              <span className="text-muted-foreground">{c.days}</span>
            </div>
          ))}
        </div>

        <div className="border border-border p-8">
          <h2 className="font-serif text-xl font-medium text-foreground mb-4">Informații Importante</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Livrarea internațională nu include ramburs la curier. Plata se face online.</p>
            <p>• Pentru țările din afara UE, clientul este responsabil pentru taxe vamale și TVA local.</p>
            <p>• Toate lumânările sunt ambalate special pentru transport — protecție anti-șoc.</p>
            <p>• Tracking-ul este disponibil pentru toate comenzile internaționale.</p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/catalog">
            <Button className="px-12 text-xs tracking-wider uppercase h-12 bg-primary text-primary-foreground">
              Comandă Acum
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
