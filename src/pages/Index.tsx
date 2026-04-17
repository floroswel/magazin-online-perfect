import { Link } from "react-router-dom";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CartDrawer from "@/components/storefront/CartDrawer";
import { usePageSeo } from "@/components/SeoHead";

export default function Index() {
  usePageSeo({
    title: "Mama Lucica · Lumânări handmade din ceară de soia | Made in Romania",
    description: "Lumânări parfumate 100% handmade, turnate manual din ceară de soia. Calculator durată ardere, certificat de autenticitate, livrare 24-48h.",
  });

  return (
    <StorefrontLayout>
      {/* Hero editorial */}
      <section className="relative bg-cream-gradient overflow-hidden">
        <div className="ml-container py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold mb-5">
              Atelierul Mama Lucica · est. 2020
            </p>
            <h1 className="font-display text-5xl lg:text-7xl font-medium leading-[1.05] text-foreground mb-6">
              Lumânări turnate <em className="text-accent not-italic">cu suflet</em>, niciodată în serie.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Ceară de soia 100% naturală. Parfumuri compuse manual. Fiecare lumânare poartă numele unui artizan și data turnării.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/catalog"
                className="inline-flex items-center px-8 py-3.5 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-opacity shadow-gold"
              >
                Descoperă colecția →
              </Link>
              <Link
                to="/page/despre-noi"
                className="inline-flex items-center px-8 py-3.5 border border-foreground text-foreground rounded-sm text-xs font-bold uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
              >
                Povestea noastră
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-border/50">
              <div>
                <p className="font-display text-3xl text-accent">12k+</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Clienți fericiți</p>
              </div>
              <div>
                <p className="font-display text-3xl text-accent">4.9★</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recenzii verificate</p>
              </div>
              <div>
                <p className="font-display text-3xl text-accent">100%</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Handmade RO</p>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/5] bg-noir-gradient rounded-sm overflow-hidden shadow-editorial flex items-center justify-center">
            <div className="text-9xl">🕯️</div>
            <div className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur p-5 rounded-sm border border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">Lumânarea lunii</p>
              <p className="font-display text-xl">Tămâie & Mosc Auriu</p>
              <p className="text-xs text-muted-foreground mt-1">45h ardere · Editorial Limited</p>
            </div>
          </div>
        </div>
      </section>

      {/* Construction notice */}
      <section className="ml-container py-16">
        <div className="max-w-2xl mx-auto text-center bg-card border border-border p-10 rounded-sm shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold mb-3">Etapa 1 / 6 livrată ✓</p>
          <h2 className="font-display text-3xl mb-4">Atelierul se construiește</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Tema, header-ul, footer-ul cu legal/fiscal complet, alertele și navigația mobilă sunt gata.
            <br />
            Următoarele etape: <strong>homepage cu colecții → pagina produs cu calculator de ardere automat → catalog → checkout 9-blocuri → cont client + suite de conversie agresivă</strong>.
          </p>
          <p className="text-xs text-muted-foreground">
            Spune <strong>"continuă cu etapa 2"</strong> când ești gata să continuăm.
          </p>
        </div>
      </section>

      <CartDrawer />
    </StorefrontLayout>
  );
}
