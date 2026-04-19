import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { ShoppingBag, Heart, Truck, Shield, Award, Minus, Plus } from "lucide-react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";
import ProductCard from "@/components/storefront/ProductCard";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { safeJsonLd } from "@/lib/sanitize-json-ld";

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, setOpen } = useCart();
  const { toggle, isFav } = useFavorites();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", slug!)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product?.category_id, product?.id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, old_price, image_url, stock, rating, review_count, badge_promo, badge_new, badge_bestseller")
        .eq("category_id", product.category_id)
        .eq("status", "active")
        .neq("id", product.id)
        .limit(4);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["product-reviews", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data } = await (supabase as any)
        .from("product_reviews")
        .select("id, rating, title, comment, author_name, created_at")
        .eq("product_id", product.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!product?.id,
  });

  if (isLoading) {
    return <StorefrontLayout><div className="ml-container py-20 text-center text-muted-foreground">Se încarcă...</div></StorefrontLayout>;
  }
  if (!product) {
    return (
      <StorefrontLayout>
        <div className="ml-container py-20 text-center">
          <h1 className="font-display text-2xl mb-3">Produs inexistent</h1>
          <p className="text-sm text-muted-foreground mb-6">Acest produs nu mai este disponibil.</p>
          <Link to="/catalog" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm">Înapoi la catalog</Link>
        </div>
      </StorefrontLayout>
    );
  }

  const images: string[] = [
    product.image_url,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean) as string[];
  const fav = isFav?.(product.id) ?? false;
  const stock = product.stock ?? 0;
  const discount = product.old_price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100) : 0;

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      image_url: product.image_url,
      price: Number(product.price),
    }, qty);
    setOpen(true);
  };

  const productJsonLd = safeJsonLd({
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: images.length ? images : undefined,
    description: product.short_description || product.meta_description || product.name,
    sku: product.sku || product.id,
    brand: (product as any).brand ? { "@type": "Brand", name: (product as any).brand } : undefined,
    aggregateRating:
      (product.rating ?? 0) > 0 && (product.review_count ?? 0) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating).toFixed(1),
            reviewCount: product.review_count,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      url: `${window.location.origin}/produs/${product.slug}`,
      priceCurrency: "RON",
      price: Number(product.price).toFixed(2),
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  });

  return (
    <StorefrontLayout>
      <SeoHead
        title={product.meta_title || `${product.name} — Mama Lucica`}
        description={product.meta_description || product.short_description || `Cumpără ${product.name} de la Mama Lucica.`}
        ogImage={product.image_url || undefined}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd }} />
      <section className="ml-container py-6 lg:py-10">
        <nav className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-accent">Acasă</Link>
          <span className="mx-2">/</span>
          <Link to="/catalog" className="hover:text-accent">Catalog</Link>
          {product.categories && (
            <>
              <span className="mx-2">/</span>
              <Link to={`/categorie/${(product.categories as any).slug}`} className="hover:text-accent">{(product.categories as any).name}</Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-muted rounded-md overflow-hidden mb-3">
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">🕯️</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square bg-muted rounded-sm overflow-hidden border-2 ${activeImg === i ? "border-accent" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl lg:text-4xl mb-2">{product.name}</h1>
            {product.short_description && <p className="text-sm text-muted-foreground mb-4">{product.short_description}</p>}
            {(product.rating ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className="text-highlight" aria-hidden="true">{"★".repeat(Math.round(Number(product.rating)))}</span>
                <span className="text-muted-foreground">{Number(product.rating).toFixed(1)} ({product.review_count ?? 0} recenzii)</span>
              </div>
            )}
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl font-bold" style={{ color: "#FF3300" }}>{Number(product.price).toFixed(2)} lei</span>
              {product.old_price && product.old_price > product.price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{Number(product.old_price).toFixed(2)} lei</span>
                  <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs font-bold rounded-sm">-{discount}%</span>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-6">TVA inclus · Livrare 35 lei (gratuit peste 200 lei)</div>

            {stock > 0 ? (
              <div className="text-sm text-success font-semibold mb-4">✓ În stoc ({stock} buc.)</div>
            ) : (
              <div className="text-sm text-destructive font-semibold mb-4">✗ Stoc epuizat</div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-border rounded-sm">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2"><Minus className="h-4 w-4" /></button>
                <span className="w-12 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="p-2"><Plus className="h-4 w-4" /></button>
              </div>
              <button
                onClick={handleAdd}
                disabled={stock <= 0}
                className="flex-1 h-12 bg-primary text-primary-foreground font-semibold rounded-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
              >
                <ShoppingBag className="h-5 w-5" /> Adaugă în coș
              </button>
              <button
                onClick={() => toggle?.(product.id)}
                className="h-12 w-12 border border-border rounded-sm flex items-center justify-center hover:bg-muted"
                aria-label="Favorite"
              >
                <Heart className={`h-5 w-5 ${fav ? "fill-accent text-accent" : ""}`} />
              </button>
            </div>

            <button
              onClick={() => { handleAdd(); navigate("/checkout"); }}
              disabled={stock <= 0}
              className="w-full h-12 bg-accent text-accent-foreground font-bold rounded-sm hover:opacity-90 disabled:opacity-40 mb-6"
            >
              Cumpără acum
            </button>

            <div className="grid grid-cols-3 gap-2 mb-6 text-[11px] text-center">
              <div className="p-3 bg-muted rounded-sm"><Truck className="h-5 w-5 mx-auto mb-1" /> Livrare 24-48h</div>
              <div className="p-3 bg-muted rounded-sm"><Shield className="h-5 w-5 mx-auto mb-1" /> Plată securizată</div>
              <div className="p-3 bg-muted rounded-sm"><Award className="h-5 w-5 mx-auto mb-1" /> 100% Handmade</div>
            </div>

            {product.description && (
              <div className="prose prose-sm max-w-none border-t border-border pt-6">
                <h3 className="font-display text-lg mb-2">Descriere</h3>
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
              </div>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl mb-6">Recenzii ({reviews.length})</h2>
            <div className="space-y-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="p-4 border border-border rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-highlight" aria-hidden="true">{"★".repeat(r.rating)}</span>
                    <span className="text-sm font-semibold">{r.author_name || "Anonim"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                  {r.title && <div className="font-semibold text-sm mb-1">{r.title}</div>}
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl mb-6">Produse similare</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p: any) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        )}
      </section>
    </StorefrontLayout>
  );
}
