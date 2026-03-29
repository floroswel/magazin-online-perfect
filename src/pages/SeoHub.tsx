import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { safeJsonLd } from "@/lib/sanitize-json-ld";
import { CITIES, CITY_LABELS, SEO_CATEGORIES, getCityLabel } from "@/lib/seoData";
import { useMemo } from "react";

export default function SeoHub() {
  const title = "Lumânări artizanale în România — Livrare în toate orașele | MamaLucica";
  const description = "Descoperă lumânări parfumate, decorative și cadouri cu livrare rapidă în București, Cluj, Timișoara, Iași și alte 17 orașe din România. Artizani verificați pe MamaLucica.";
  usePageSeo({ title, description });

  const jsonLd = useMemo(() => safeJsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${window.location.origin}/l`,
  }), [title, description]);

  return (
    <Layout>
      <div className="container px-4 py-8 md:py-12 max-w-5xl">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Acasă</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">Lumânări pe orașe</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          🕯️ Lumânări artizanale cu livrare în toată România
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Alege orașul și categoria preferată pentru a descoperi selecția noastră de lumânări cu livrare rapidă.
        </p>

        {/* Category sections */}
        {SEO_CATEGORIES.map((cat) => (
          <section key={cat.slug} className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <span>{cat.icon}</span> {cat.label}
            </h2>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((city) => (
                <Link
                  key={city}
                  to={`/l/${city}/${cat.slug}`}
                  className="text-sm bg-muted hover:bg-accent text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full transition-colors"
                >
                  {getCityLabel(city)}
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Cities section */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">📍 Livrăm în toate orașele mari</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CITIES.map((city) => (
              <div key={city} className="bg-muted/50 rounded-lg p-3">
                <h3 className="font-medium text-foreground text-sm mb-1.5">{getCityLabel(city)}</h3>
                <div className="flex flex-col gap-0.5">
                  {SEO_CATEGORIES.slice(0, 3).map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/l/${city}/${cat.slug}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {cat.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEO text */}
        <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">
            Cum funcționează MamaLucica?
          </h2>
          <p>
            MamaLucica este marketplace-ul dedicat lumânărilor artizanale din România. Conectăm artizani 
            talentați cu iubitorii de lumânări din întreaga țară. Fiecare produs este realizat manual, 
            din ingrediente naturale premium: ceară de soia, uleiuri esențiale și fitiluri din bumbac.
          </p>
          <p>
            Livrăm prin curier rapid în toate orașele României, de obicei în 1-3 zile lucrătoare. 
            Transport gratuit pentru comenzi peste 150 RON. Retur gratuit în 14 zile.
          </p>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </Layout>
  );
}
