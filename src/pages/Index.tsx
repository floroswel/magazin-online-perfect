import { Link } from "react-router-dom";
import { Flame, Leaf, Award, Sparkles, ArrowRight, Star } from "lucide-react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CartDrawer from "@/components/storefront/CartDrawer";
import { usePageSeo } from "@/components/SeoHead";
import { useThemeText } from "@/hooks/useThemeText";

export default function Index() {
  const { t } = useThemeText();
  usePageSeo({
    title: t("seo_home_title", "Mama Lucica · Lumânări handmade din ceară de soia | Made in Romania"),
    description: t(
      "seo_home_description",
      "Lumânări parfumate 100% handmade, turnate manual din ceară de soia. Calculator durată ardere, certificat de autenticitate, livrare 24-48h."
    ),
  });

  return (
    <StorefrontLayout>
      {/* ───────────── HERO EDITORIAL ───────────── */}
      <section className="relative bg-cream-gradient overflow-hidden hero-vignette">
        {/* texturi decorative */}
        <div className="absolute inset-0 paper-grain opacity-60 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="ml-container py-16 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          {/* coloana stânga */}
          <div className="animate-fade-in-right">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-foreground/5 border border-accent/30 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/70 font-semibold">
                {t("hero_eyebrow", "Atelierul Mama Lucica · est. 2020")}
              </p>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium leading-[1.02] text-foreground mb-6">
              {t("hero_title_pre", "Lumânări turnate")}{" "}
              <em className="not-italic relative inline-block">
                <span className="text-gradient-gold">{t("hero_title_accent", "cu suflet")}</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none">
                  <path d="M2 7 Q 50 1, 100 5 T 198 4" stroke="hsl(var(--accent))" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
                </svg>
              </em>
              ,<br />{t("hero_title_post", "niciodată în serie.")}
            </h1>

            <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              {t("hero_subtitle", "Ceară de soia 100% naturală. Parfumuri compuse manual. Fiecare lumânare poartă numele unui artizan și data turnării.")}
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/catalog"
                className="btn-shine inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 transition-all duration-300 shadow-gold hover:shadow-elevated hover:-translate-y-0.5"
              >
                {t("hero_cta_primary", "Descoperă colecția")}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/page/despre-noi"
                className="inline-flex items-center px-8 py-4 border border-foreground/80 text-foreground rounded-sm text-xs font-bold uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-all duration-300"
              >
                {t("hero_cta_secondary", "Povestea noastră")}
              </Link>
            </div>

            {/* trust row — toate editabile */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-accent/20 stagger">
              <div>
                <p className="font-display text-3xl lg:text-4xl text-gradient-gold leading-none">{t("hero_stat1_value", "12k+")}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{t("hero_stat1_label", "Clienți fericiți")}</p>
              </div>
              <div className="border-l border-accent/20 pl-4">
                <p className="font-display text-3xl lg:text-4xl text-gradient-gold leading-none flex items-baseline gap-1">
                  {t("hero_stat2_value", "4.9")}<Star className="w-4 h-4 fill-accent text-accent" />
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{t("hero_stat2_label", "Recenzii verificate")}</p>
              </div>
              <div className="border-l border-accent/20 pl-4">
                <p className="font-display text-3xl lg:text-4xl text-gradient-gold leading-none">{t("hero_stat3_value", "100%")}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{t("hero_stat3_label", "Handmade RO")}</p>
              </div>
            </div>
          </div>

          {/* coloana dreapta — obiectul vizual */}
          <div className="relative animate-scale-in">
            <div className="relative aspect-[4/5] bg-noir-gradient rounded-sm overflow-hidden shadow-editorial">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="candle-glow w-72 h-72 absolute" />
                <div className="text-[180px] relative z-10 animate-flicker leading-none select-none">🕯️</div>
                <div className="smoke" style={{ top: "18%", left: "49%", animationDelay: "0s" }} />
                <div className="smoke" style={{ top: "20%", left: "51%", animationDelay: "1.5s" }} />
                <div className="smoke" style={{ top: "16%", left: "48%", animationDelay: "2.8s" }} />
              </div>

              <div className="absolute top-6 right-6 bg-accent/95 text-accent-foreground px-3 py-1.5 rounded-sm">
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold">{t("hero_badge_corner", "Editorial · 2025")}</p>
              </div>

              <div className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur-md p-5 rounded-sm border border-accent/30 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 text-accent" />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-accent font-bold">{t("hero_card_eyebrow", "Lumânarea lunii")}</p>
                </div>
                <p className="font-display text-2xl text-foreground mb-1">{t("hero_card_title", "Tămâie & Mosc Auriu")}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">{t("hero_card_meta", "45h ardere · Limited")}</p>
                  <p className="font-display text-lg text-gradient-gold">{t("hero_card_price", "189 lei")}</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex absolute -left-8 top-1/3 bg-card border border-accent/40 px-4 py-3 rounded-sm shadow-card animate-float items-center gap-3">
              <Award className="w-5 h-5 text-accent" />
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{t("hero_award_label", "Premiu")}</p>
                <p className="text-xs font-bold text-foreground">{t("hero_award_title", "Best Artisan 2024")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── BANDĂ VALORI ───────────── */}
      <section className="bg-foreground text-background py-8 border-y border-accent/20">
        <div className="ml-container grid grid-cols-2 lg:grid-cols-4 gap-6 stagger">
          {[
            { icon: Leaf, title: t("values_1_title", "Ceară de soia"), sub: t("values_1_sub", "100% naturală, vegan") },
            { icon: Flame, title: t("values_2_title", "Ardere curată"), sub: t("values_2_sub", "Până la 60h, fără fum") },
            { icon: Award, title: t("values_3_title", "Certificat handmade"), sub: t("values_3_sub", "Lot & artizan") },
            { icon: Sparkles, title: t("values_4_title", "Parfumuri compuse"), sub: t("values_4_sub", "Note premium IFRA") },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full border border-accent/40 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:border-accent transition-colors duration-300">
                <Icon className="w-5 h-5 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-[11px] text-background/60 uppercase tracking-wider">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── ETAPE / CONSTRUCTION NOTE ───────────── */}
      <section className="ml-container py-20 relative">
        <div className="absolute inset-0 paper-grain opacity-40 pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="section-rule">
            <span className="font-display italic text-accent text-sm">Atelier</span>
          </div>

          <div className="bg-card border border-accent/20 p-10 lg:p-12 rounded-sm shadow-card relative overflow-hidden">
            {/* corner gold */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-accent/60" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-accent/60" />

            <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold mb-3 inline-flex items-center gap-2">
              <span className="w-6 h-px bg-accent" />
              Etapa 1 / 6 livrată
              <span className="w-6 h-px bg-accent" />
            </p>
            <h2 className="font-display text-3xl lg:text-4xl mb-4 text-foreground">Atelierul se construiește</h2>
            <div className="gold-rule w-24 mx-auto my-5" />
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Tema, header-ul, footer-ul cu legal/fiscal complet, alertele și navigația mobilă sunt gata.
              <br className="hidden sm:block" />
              Următoarele etape: <strong className="text-foreground">homepage cu colecții → pagina produs cu calculator de ardere automat → catalog → checkout 9-blocuri → cont client + suite de conversie agresivă</strong>.
            </p>
            <p className="text-xs text-muted-foreground italic">
              Spune <strong className="text-accent not-italic">"continuă cu etapa 2"</strong> când ești gata.
            </p>
          </div>
        </div>
      </section>

      <CartDrawer />
    </StorefrontLayout>
  );
}
