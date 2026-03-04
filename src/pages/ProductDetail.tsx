import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Heart, Star, Minus, Plus, ArrowLeft, GitCompare, MessageSquare, Truck } from "lucide-react";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import VariantSelector from "@/components/products/VariantSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import MokkaOrangePrice from "@/components/mokka/MokkaOrangePrice";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useComparison } from "@/hooks/useComparison";
import { toast } from "sonner";
import { safeJsonLd, sanitizeForJsonLd } from "@/lib/sanitize-json-ld";
import { useCurrency } from "@/hooks/useCurrency";
import type { Tables } from "@/integrations/supabase/types";

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToComparison, isInComparison } = useComparison();
  const { format, currency, convert } = useCurrency();
  const [product, setProduct] = useState<Tables<"products"> | null>(null);
  const [similar, setSimilar] = useState<Tables<"products">[]>([]);
  const [reviews, setReviews] = useState<Tables<"reviews">[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Tables<"products">[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [questionText, setQuestionText] = useState("");
  const [isFav, setIsFav] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prod } = await supabase.from("products").select("*").eq("slug", slug).single();
      if (!prod) { setLoading(false); return; }
      setProduct(prod);

      // Track in localStorage for homepage RecentlyViewed
      try {
        const ids: string[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
        const updated = [prod.id, ...ids.filter(id => id !== prod.id)].slice(0, 20);
        localStorage.setItem("recently_viewed", JSON.stringify(updated));
      } catch {}


      const [simRes, revRes, qRes] = await Promise.all([
        supabase.from("products").select("*").eq("category_id", prod.category_id!).neq("id", prod.id).limit(4),
        supabase.from("reviews").select("*").eq("product_id", prod.id).order("created_at", { ascending: false }),
        supabase.from("product_questions").select("*").eq("product_id", prod.id).order("created_at", { ascending: false }),
      ]);
      setSimilar(simRes.data || []);
      setReviews(revRes.data || []);
      setQuestions(qRes.data || []);

      if (user) {
        const { data: fav } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", prod.id).maybeSingle();
        setIsFav(!!fav);

        // Track recently viewed
        await supabase.from("recently_viewed").upsert(
          { user_id: user.id, product_id: prod.id, viewed_at: new Date().toISOString() },
          { onConflict: "user_id,product_id" }
        );

        // Get recently viewed
        const { data: rv } = await supabase
          .from("recently_viewed")
          .select("*, product:products(*)")
          .eq("user_id", user.id)
          .neq("product_id", prod.id)
          .order("viewed_at", { ascending: false })
          .limit(4);
        setRecentlyViewed((rv || []).map((d: any) => d.product).filter(Boolean));
      }
      setLoading(false);
    }
    load();
  }, [slug, user]);

  const handleAddToCart = async () => {
    if (product) { await addToCart(product.id, qty); toast.success("Adăugat în coș!"); }
  };

  const toggleFav = async () => {
    if (!user || !product) { toast.error("Autentifică-te mai întâi"); return; }
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
      setIsFav(false);
      toast.success("Eliminat din favorite");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
      setIsFav(true);
      toast.success("Adăugat la favorite!");
    }
  };

  const submitReview = async () => {
    if (!user || !product) return;
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id, product_id: product.id, rating: reviewRating, comment: reviewText,
    });
    if (error) { toast.error("Eroare la adăugarea recenziei"); return; }
    toast.success("Recenzie adăugată!");
    setReviewText("");
    const { data } = await supabase.from("reviews").select("*").eq("product_id", product.id).order("created_at", { ascending: false });
    setReviews(data || []);
  };

  const submitQuestion = async () => {
    if (!user || !product || !questionText.trim()) return;
    const { error } = await supabase.from("product_questions").insert({
      user_id: user.id, product_id: product.id, question: questionText,
    });
    if (error) { toast.error("Eroare"); return; }
    toast.success("Întrebarea a fost trimisă!");
    setQuestionText("");
    const { data } = await supabase.from("product_questions").select("*").eq("product_id", product.id).order("created_at", { ascending: false });
    setQuestions(data || []);
  };

  if (loading) return <Layout><div className="container py-16 text-center">Se încarcă...</div></Layout>;
  if (!product) return <Layout><div className="container py-16 text-center">Produsul nu a fost găsit.</div></Layout>;

  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;
  const activeImage = selectedVariant?.image_url || product.image_url;
  const specs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs as Record<string, string>).filter(([k]) => !k.startsWith("_")) : [];
  const discount = product.old_price ? Math.round(((product.old_price - activePrice) / product.old_price) * 100) : 0;

  return (
    <Layout>
      <div className="container py-6">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Înapoi la catalog
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <ProductImageGallery
            mainImage={activeImage || "/placeholder.svg"}
            images={product.images}
            alt={product.name}
          />

          {/* Details */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating || 0) ? "fill-emag-yellow text-emag-yellow" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.review_count} recenzii)</span>
              {product.brand && <span className="text-sm text-muted-foreground">• {product.brand}</span>}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{format(activePrice)}</span>
              {product.old_price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{format(product.old_price)}</span>
                  {discount > 0 && <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded">-{discount}%</span>}
                </>
              )}
            </div>

            {/* Mokka installment preview */}
            <MokkaOrangePrice price={activePrice} months={3} />

            {/* Variant Selector */}
            <VariantSelector productId={product.id} basePrice={product.price} onVariantSelect={setSelectedVariant} />

            <p className="text-muted-foreground">{product.description}</p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border rounded-md">
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="flex-1 font-semibold">
                <ShoppingCart className="h-5 w-5 mr-2" /> Adaugă în coș
              </Button>
              <Button variant="outline" size="lg" onClick={toggleFav}>
                <Heart className={`h-5 w-5 ${isFav ? "fill-primary text-primary" : ""}`} />
              </Button>
              <Button
                variant="outline" size="lg"
                onClick={() => product && addToComparison(product.id)}
                className={isInComparison(product.id) ? "border-emag-blue text-emag-blue" : ""}
              >
                <GitCompare className="h-5 w-5" />
              </Button>
            </div>

            <p className={`text-sm font-medium ${activeStock > 0 ? "text-green-600" : "text-destructive"}`}>
              {activeStock > 0 ? `✓ În stoc (${activeStock} buc.)` : "✗ Stoc epuizat"}
            </p>
            {activeStock > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Livrare estimată: <strong className="text-foreground">1-3 zile lucrătoare</strong></span>
              </div>
            )}
            {product.sku && (
              <p className="text-xs text-muted-foreground">Cod produs: {product.sku}</p>
            )}
          </div>
        </div>

        {/* Tabs: Specs, Reviews, Q&A */}
        <Tabs defaultValue="specs" className="mt-8">
          <TabsList>
            <TabsTrigger value="specs">Specificații</TabsTrigger>
            <TabsTrigger value="reviews">Recenzii ({reviews.length})</TabsTrigger>
            <TabsTrigger value="qa">Întrebări ({questions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="specs">
            {specs.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableBody>
                      {specs.map(([key, val]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium text-muted-foreground w-1/3">{key}</TableCell>
                          <TableCell>{val}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <p className="text-muted-foreground py-4">Nu sunt specificații disponibile.</p>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {user && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Adaugă o recenzie</h4>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setReviewRating(s)}>
                          <Star className={`h-5 w-5 cursor-pointer ${s <= reviewRating ? "fill-emag-yellow text-emag-yellow" : "text-muted"}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Scrie recenzia ta..." />
                    <Button onClick={submitReview} disabled={!reviewText.trim()}>Trimite recenzia</Button>
                  </div>
                )}
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nicio recenzie încă. Fii primul!</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-emag-yellow text-emag-yellow" : "text-muted"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</span>
                      </div>
                      <p className="text-sm">{r.comment}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qa">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {user && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Pune o întrebare</h4>
                    <div className="flex gap-2">
                      <Input value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Ce vrei să afli despre acest produs?" className="flex-1" />
                      <Button onClick={submitQuestion} disabled={!questionText.trim()}>Trimite</Button>
                    </div>
                  </div>
                )}
                {questions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nicio întrebare încă.</p>
                ) : (
                  questions.map((q: any) => (
                    <div key={q.id} className="border-b pb-4 last:border-0">
                      <p className="font-medium text-sm">❓ {q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(q.created_at).toLocaleDateString("ro-RO")}</p>
                      {q.answer && (
                        <div className="mt-2 bg-muted rounded-lg p-3">
                          <p className="text-sm">✅ {q.answer}</p>
                          {q.answered_at && <p className="text-xs text-muted-foreground mt-1">{new Date(q.answered_at).toLocaleDateString("ro-RO")}</p>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">Vizualizate recent</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentlyViewed.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Similar products */}
        {similar.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">Produse similare</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        name: sanitizeForJsonLd(product.name),
        description: sanitizeForJsonLd(product.description),
        image: product.image_url || "",
        brand: product.brand ? { "@type": "Brand", name: sanitizeForJsonLd(product.brand) } : undefined,
        sku: product.sku || product.id,
        offers: {
          "@type": "Offer",
          url: window.location.href,
          priceCurrency: currency,
          price: convert(product.price),
          availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        aggregateRating: product.review_count && product.review_count > 0 ? {
          "@type": "AggregateRating",
          ratingValue: product.rating || 0,
          reviewCount: product.review_count,
        } : undefined,
      }) }} />

      {/* Sticky mobile Add to Cart */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{product.name}</p>
          <p className="text-lg font-bold text-primary">{format(product.price)}</p>
        </div>
        <Button onClick={handleAddToCart} className="shrink-0 font-semibold">
          <ShoppingCart className="h-4 w-4 mr-1" /> Adaugă
        </Button>
      </div>
    </Layout>
  );
}
