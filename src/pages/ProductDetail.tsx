import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { usePageSeo } from "@/components/SeoHead";
import { safeJsonLd } from "@/lib/sanitize-json-ld";
import { Heart, Share2, Minus, Plus, Truck, RotateCcw, Shield, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const RECENTLY_KEY = "lumax_recently_viewed";
function addRecentlyViewed(id: string) {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(RECENTLY_KEY) || "[]");
    const updated = [id, ...ids.filter(x => x !== id)].slice(0, 8);
    localStorage.setItem(RECENTLY_KEY, JSON.stringify(updated));
  } catch {}
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(id, name, slug), brand:brands(name)")
        .eq("slug", slug!)
        .maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  const { data: reviews } = useQuery({
    queryKey: ["product-reviews", product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", product!.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!product?.id,
  });

  const { data: related } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .gt("stock", 0)
        .limit(5);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  useEffect(() => {
    if (product?.id) addRecentlyViewed(product.id);
  }, [product?.id]);

  const discount = product?.old_price && product.old_price > product.price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  const isOutOfStock = product?.stock != null && product.stock <= 0;
  const settings = useSettings();
  const lowStockThreshold = parseInt(settings.low_stock_threshold || "5");
  const isLowStock = product?.stock != null && product.stock > 0 && product.stock < lowStockThreshold;

  const images = product?.images?.length ? product.images : product?.image_url ? [product.image_url] : ["/placeholder.svg"];

  usePageSeo({
    title: product ? `${product.name} | LUMAX` : "Produs | LUMAX",
    description: product?.meta_description || product?.short_description || "",
    ogImage: product?.image_url || undefined,
    ogType: "product",
    productPrice: product?.price,
    productCurrency: "RON",
  });

  const handleAdd = async () => {
    if (!product || isOutOfStock) return;
    await addToCart(product.id, quantity);
    toast.success(`${product.name} adăugat în coș`);
  };

  const handleBuyNow = async () => {
    if (!product || isOutOfStock) return;
    await addToCart(product.id, quantity);
    navigate("/checkout");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="lumax-container py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square skeleton rounded-xl" />
            <div className="space-y-4">
              <div className="h-4 skeleton rounded w-20" />
              <div className="h-8 skeleton rounded w-3/4" />
              <div className="h-6 skeleton rounded w-32" />
              <div className="h-32 skeleton rounded-xl" />
              <div className="h-12 skeleton rounded-lg" />
              <div className="h-12 skeleton rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="lumax-container py-20 text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-lg font-bold">Produsul nu a fost găsit</p>
          <Link to="/catalog" className="text-primary text-sm font-semibold hover:underline mt-2 inline-block">← Înapoi la catalog</Link>
        </div>
      </Layout>
    );
  }

  const specs = product.specs as Record<string, string> | null;

  const productJsonLd = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images[0],
    description: product.short_description || product.description?.slice(0, 200),
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "RON",
      availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(product.rating && product.review_count && product.review_count > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.review_count,
      },
    } : {}),
  });

  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd }} />

      {/* Breadcrumb */}
      <div className="lumax-container py-3">
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-primary">Acasă</Link>
          <span>/</span>
          {(product as any).category && (
            <>
              <Link to={`/catalog?category=${(product as any).category.slug}`} className="hover:text-primary">
                {(product as any).category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="lumax-container pb-12">
        <div className="grid md:grid-cols-[55%_45%] gap-8">
          {/* Images */}
          <div>
            <div className="relative aspect-square rounded-xl border border-border overflow-hidden bg-secondary mb-3 group">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                  <span className="bg-muted-foreground text-white text-sm font-bold px-4 py-2 rounded-lg">STOC EPUIZAT</span>
                </div>
              )}
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-extrabold px-2 py-1 rounded">
                  -{discount}%
                </span>
              )}
              <button onClick={() => setLiked(!liked)} className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-colors ${liked ? "bg-destructive text-white" : "bg-card text-muted-foreground hover:bg-destructive hover:text-white"}`}>
                <Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
              </button>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-[72px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === selectedImage ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {(product as any).brand?.name || "LUMAX"}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-foreground leading-tight mb-2">{product.name}</h1>

            {/* Rating */}
            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-2 mb-2 text-sm">
                <span className="text-lumax-yellow">
                  {"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}
                </span>
                <span className="text-muted-foreground text-xs">{product.rating} din 5 ({product.review_count || 0} recenzii)</span>
              </div>
            )}

            {product.sku && <p className="text-xs text-muted-foreground mb-3">Cod: {product.sku}</p>}

            <hr className="border-border mb-4" />

            {/* Price box */}
            <div className="bg-secondary rounded-xl p-4 mb-4">
              {product.old_price && product.old_price > product.price && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base text-muted-foreground line-through">{format(product.old_price)}</span>
                  <span className="bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded">-{discount}%</span>
                </div>
              )}
              <p className="text-3xl font-black text-destructive">{format(product.price)}</p>
              {product.old_price && product.old_price > product.price && (
                <p className="text-sm font-semibold text-lumax-green mt-1">Economisești {format(product.old_price - product.price)}</p>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="text-[13px] font-semibold text-foreground mb-2 block">Cantitate:</label>
              <div className="flex items-center border border-border rounded-lg w-fit overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-secondary">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="w-9 h-9 flex items-center justify-center hover:bg-secondary">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className={`text-xs font-semibold mt-1.5 ${isOutOfStock ? "text-destructive" : isLowStock ? "text-lumax-yellow" : "text-lumax-green"}`}>
                {isOutOfStock ? "❌ Stoc epuizat" : isLowStock ? `⚠️ Doar ${product.stock} bucăți` : "✅ În stoc"}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 mb-4">
              <button onClick={handleAdd} disabled={isOutOfStock} className="w-full h-[52px] bg-primary text-primary-foreground text-[15px] font-bold rounded-lg hover:bg-lumax-blue-dark transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
                {isOutOfStock ? "Stoc Epuizat" : "Adaugă în Coș"}
              </button>
              <button onClick={handleBuyNow} disabled={isOutOfStock} className="w-full h-[52px] bg-destructive text-destructive-foreground text-[15px] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
                Cumpără Acum
              </button>
              <button onClick={() => { setLiked(!liked); toast.success(liked ? "Eliminat din favorite" : "Adăugat la favorite"); }} className="w-full h-11 bg-transparent border-2 border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                <Heart className="inline h-4 w-4 mr-1.5" fill={liked ? "currentColor" : "none"} /> {liked ? "Salvat la Favorite" : "Adaugă la Favorite"}
              </button>
            </div>

            {/* Delivery box */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              {[
                { icon: Truck, title: "Livrare gratuită", sub: `La comenzi > ${settings.free_shipping_threshold || "200"} lei` },
                { icon: RotateCcw, title: `Retur ${settings.return_days || "30"} zile`, sub: "Fără întrebări" },
                { icon: Shield, title: "Plată securizată", sub: "SSL 256-bit" },
                { icon: Package, title: `Livrat în ${settings.delivery_time || "24-48h"}`, sub: settings.delivery_description || "Curier rapid" },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <span className="text-[13px] font-semibold text-foreground">{title}</span>
                    <span className="text-[13px] text-muted-foreground ml-2">{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mt-10">
          <TabsList className="bg-secondary w-full justify-start rounded-none border-b border-border">
            <TabsTrigger value="description" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Descriere</TabsTrigger>
            <TabsTrigger value="specs" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Specificații</TabsTrigger>
            <TabsTrigger value="shipping" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Livrare & Retur</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Recenzii ({product.review_count || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="max-w-3xl py-6">
            {product.description ? (
              <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : (
              <p className="text-sm text-muted-foreground">Descrierea produsului nu este disponibilă.</p>
            )}
          </TabsContent>

          <TabsContent value="specs" className="py-6">
            {specs && Object.keys(specs).length > 0 ? (
              <table className="w-full max-w-lg text-sm">
                <tbody>
                  {Object.entries(specs).map(([k, v]) => (
                    <tr key={k} className="border-b border-border">
                      <td className="py-2.5 pr-4 font-medium text-muted-foreground bg-secondary/50 px-3 w-40">{k}</td>
                      <td className="py-2.5 px-3 text-foreground">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">Specificațiile nu sunt disponibile.</p>
            )}
          </TabsContent>

          <TabsContent value="shipping" className="py-6 max-w-3xl">
            <div className="prose prose-sm max-w-none text-foreground">
              <h3>Livrare</h3>
              <p>Livrăm în toată România prin curier rapid. Comenzile plasate până la ora 14:00 sunt expediate în aceeași zi.</p>
              <ul>
                <li>Livrare standard: 3-5 zile lucrătoare — 25 lei (GRATUITĂ la comenzi peste 200 lei)</li>
                <li>Livrare express: 1-2 zile lucrătoare — 35 lei</li>
              </ul>
              <h3>Retur</h3>
              <p>Acceptăm retururi în termen de 30 de zile de la primirea produsului. Produsul trebuie să fie nefolosit și în ambalajul original.</p>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="py-6">
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {(r.reviewer_name || "A")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{r.reviewer_name || "Anonim"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</p>
                      </div>
                      <span className="ml-auto text-lumax-yellow text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    </div>
                    {r.title && <p className="text-sm font-semibold mb-1">{r.title}</p>}
                    <p className="text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nu există recenzii încă.</p>
            )}
          </TabsContent>
        </Tabs>

        {/* Related products */}
        {related && related.length > 0 && (
          <div className="mt-12">
            <h2 className="section-title">Produse similare</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {related.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
