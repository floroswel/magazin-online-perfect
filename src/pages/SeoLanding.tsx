import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";
import { safeJsonLd } from "@/lib/sanitize-json-ld";
import type { Tables } from "@/integrations/supabase/types";

const CITIES = [
  "bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta",
  "brasov", "craiova", "galati", "ploiesti", "oradea",
  "sibiu", "arad", "pitesti", "bacau", "targu-mures",
  "baia-mare", "buzau", "satu-mare", "botosani", "suceava",
];

const CITY_LABELS: Record<string, string> = {
  "bucuresti": "București", "cluj-napoca": "Cluj-Napoca", "timisoara": "Timișoara",
  "iasi": "Iași", "constanta": "Constanța", "brasov": "Brașov",
  "craiova": "Craiova", "galati": "Galați", "ploiesti": "Ploiești",
  "oradea": "Oradea", "sibiu": "Sibiu", "arad": "Arad",
  "pitesti": "Pitești", "bacau": "Bacău", "targu-mures": "Târgu Mureș",
  "baia-mare": "Baia Mare", "buzau": "Buzău", "satu-mare": "Satu Mare",
  "botosani": "Botoșani", "suceava": "Suceava",
};

export default function SeoLanding() {
  const { city, category } = useParams<{ city: string; category: string }>();
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [categoryData, setCategoryData] = useState<Tables<"categories"> | null>(null);
  const [loading, setLoading] = useState(true);

  const cityLabel = CITY_LABELS[city || ""] || city || "";
  const catSlug = category || "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Fetch category by slug
      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", catSlug)
        .eq("visible", true)
        .maybeSingle();

      setCategoryData(cat);

      // Fetch products in this category
      let query = supabase
        .from("products")
        .select("*")
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(24);

      if (cat) {
        query = query.eq("category_id", cat.id);
      }

      const { data } = await query;
      setProducts(data || []);
      setLoading(false);
    };
    load();
  }, [catSlug]);

  const title = `${categoryData?.name || catSlug.replace(/-/g, " ")} în ${cityLabel} — Livrare Rapidă | MamaLucica`;
  const description = `Cumpără ${(categoryData?.name || catSlug.replace(/-/g, " ")).toLowerCase()} cu livrare rapidă în ${cityLabel}. Lumânări artizanale handmade de la artizani verificați. Comandă acum pe MamaLucica.ro!`;

  usePageSeo({ title, description });

  const jsonLd = useMemo(() => safeJsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${window.location.origin}/l/${city}/${category}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          url: `${window.location.origin}/product/${p.slug}`,
          image: p.image_url,
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "RON",
            availability: (p.stock ?? 0) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        },
      })),
    },
  }), [products, title, description, city, category]);

  return (
    <Layout>
      <div className="container px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Acasă</Link>
          <span className="mx-2">›</span>
          <Link to="/catalog" className="hover:text-primary">Catalog</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">{categoryData?.name || catSlug.replace(/-/g, " ")} în {cityLabel}</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          {categoryData?.name || catSlug.replace(/-/g, " ")} în {cityLabel}
        </h1>

        <div className="prose prose-sm max-w-none text-muted-foreground mb-8">
          <p>
            Descoperă cele mai frumoase {(categoryData?.name || catSlug.replace(/-/g, " ")).toLowerCase()} disponibile 
            cu livrare rapidă în {cityLabel}. Pe MamaLucica găsești lumânări artizanale handmade 
            de la artizani verificați din România. Fiecare lumânare este creată cu ingrediente naturale
            și atenție la detalii, perfectă pentru cadouri sau decorarea casei tale.
          </p>
          <p>
            Livrăm în {cityLabel} prin curier rapid, de obicei în 1-3 zile lucrătoare. 
            Transport gratuit pentru comenzi peste 150 RON.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-64" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Nu am găsit produse în această categorie.</p>
            <Link to="/catalog" className="text-primary font-medium hover:underline mt-2 inline-block">
              Vezi tot catalogul →
            </Link>
          </div>
        )}

        {/* SEO content block */}
        <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">
            De ce să cumperi {(categoryData?.name || catSlug.replace(/-/g, " ")).toLowerCase()} de pe MamaLucica?
          </h2>
          <ul>
            <li><strong>Artizani verificați</strong> — Fiecare vânzător este evaluat și aprobat manual.</li>
            <li><strong>Ingrediente naturale</strong> — Ceară de soia, fitiluri din bumbac, uleiuri esențiale.</li>
            <li><strong>Livrare rapidă în {cityLabel}</strong> — Primești comanda în 1-3 zile lucrătoare.</li>
            <li><strong>Garanție de satisfacție</strong> — Retur gratuit în 14 zile.</li>
            <li><strong>Plată securizată</strong> — Card, ramburs sau transfer bancar.</li>
          </ul>
        </div>

        {/* Other cities */}
        <div className="mt-12">
          <h3 className="text-base font-semibold text-foreground mb-3">
            {categoryData?.name || catSlug.replace(/-/g, " ")} — alte orașe
          </h3>
          <div className="flex flex-wrap gap-2">
            {CITIES.filter(c => c !== city).slice(0, 12).map(c => (
              <Link
                key={c}
                to={`/l/${c}/${category}`}
                className="text-xs bg-muted hover:bg-accent text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full transition"
              >
                {CITY_LABELS[c] || c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </Layout>
  );
}
