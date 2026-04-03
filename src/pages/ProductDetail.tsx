import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Heart, Star, Minus, Plus, ArrowLeft, MessageSquare, Truck, Package, Ruler, Bell } from "lucide-react";
import ProductReviews from "@/components/products/ProductReviews";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import VariantSelector from "@/components/products/VariantSelector";
import CountdownTimer from "@/components/products/CountdownTimer";
import FrequentlyBoughtTogether from "@/components/products/FrequentlyBoughtTogether";
import UpgradeRecommendation from "@/components/products/UpgradeRecommendation";

import PriceDropAlert from "@/components/products/PriceDropAlert";
import ScentPairing from "@/components/products/ScentPairing";
import SizeSelector from "@/components/products/SizeSelector";
import CandleCalculator from "@/components/products/CandleCalculator";
import { trackViewItem, trackAddToCart } from "@/hooks/useMarketingTracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";


import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

import { usePricingRules } from "@/hooks/usePricingRules";
import { toast } from "sonner";
import { safeJsonLd, sanitizeForJsonLd } from "@/lib/sanitize-json-ld";
import DOMPurify from "dompurify";
import { useCurrency } from "@/hooks/useCurrency";
import { useTaxSettings } from "@/hooks/useTaxSettings";
import { usePageSeo } from "@/components/SeoHead";
import { useEditableContent } from "@/hooks/useEditableContent";
import type { Tables } from "@/integrations/supabase/types";

export default function ProductDetail() {
  const { slug } = useParams();
  const { store_general } = useEditableContent();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const { getProductDiscount } = usePricingRules();
  const { format, currency, convert } = useCurrency();
  const taxSettings = useTaxSettings();
  const [product, setProduct] = useState<any>(null);
  const [similar, setSimilar] = useState<Tables<"products">[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Tables<"products">[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Tables<"products">[]>([]);
  const [bundleComponents, setBundleComponents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState("");
  const [isFav, setIsFav] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [hasVariants, setHasVariants] = useState(false);
  const [restockEmail, setRestockEmail] = useState("");
  const [restockSubmitting, setRestockSubmitting] = useState(false);
  const [restockDone, setRestockDone] = useState(false);
  const [selectedSize, setSelectedSize] = useState<{ id: string; label: string; weight_grams: number; price: number } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prod } = await supabase.from("products").select("*, brands(name)").eq("slug", slug).single();
      if (!prod) { setLoading(false); return; }
      setProduct(prod);

      // SEO meta is handled by usePageSeo below

      // Track in localStorage (product IDs + category mapping)
      try {
        const ids: string[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
        const updated = [prod.id, ...ids.filter(id => id !== prod.id)].slice(0, 20);
        localStorage.setItem("recently_viewed", JSON.stringify(updated));

        // Save category mapping for personalized recommendations
        const catMap: Record<string, string> = JSON.parse(localStorage.getItem("viewed_categories") || "{}");
        if (prod.category_id) catMap[prod.id] = prod.category_id;
        // Keep only last 20
        const catEntries = Object.entries(catMap);
        if (catEntries.length > 30) {
          const trimmed = Object.fromEntries(catEntries.slice(-20));
          localStorage.setItem("viewed_categories", JSON.stringify(trimmed));
        } else {
          localStorage.setItem("viewed_categories", JSON.stringify(catMap));
        }
      } catch {}

      const [simRes, qRes] = await Promise.all([
        supabase.from("products").select("*").eq("category_id", prod.category_id!).neq("id", prod.id).eq("visible", true).limit(4),
        supabase.from("product_questions").select("*").eq("product_id", prod.id).order("created_at", { ascending: false }),
      ]);
      setSimilar(simRes.data || []);
      setQuestions(qRes.data || []);

      // Load related products
      const { data: relData } = await supabase
        .from("product_relations")
        .select("related_product_id")
        .eq("product_id", prod.id)
        .order("sort_order");
      if (relData && relData.length > 0) {
        const relIds = relData.map((r: any) => r.related_product_id);
        const { data: relProds } = await supabase.from("products").select("*").in("id", relIds).eq("visible", true);
        setRelatedProducts(relProds || []);
      }

      // Load bundle components
      if (prod.product_type === "bundle") {
        const { data: bundleItems } = await supabase
          .from("product_bundle_items")
          .select("*, component:products(*)")
          .eq("bundle_product_id", prod.id)
          .order("sort_order");
        setBundleComponents((bundleItems || []).map((bi: any) => ({ ...bi, product: bi.component })));
      } else {
        setBundleComponents([]);
      }

      if (user) {
        const { data: fav } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", prod.id).maybeSingle();
        setIsFav(!!fav);
        await supabase.from("recently_viewed").upsert(
          { user_id: user.id, product_id: prod.id, viewed_at: new Date().toISOString() },
          { onConflict: "user_id,product_id" }
        );
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

      // Track view_item event
      trackViewItem({ id: prod.id, name: prod.name, price: prod.price, category: prod.category_id || undefined, brand: (prod as any).brands?.name || undefined });
    }
    load();
  }, [slug, user]);

  const handleAddToCart = async () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Selectează toate opțiunile de variantă!");
      return;
    }
    const stock = selectedVariant ? selectedVariant.stock : product?.stock;
    if (!stock || stock <= 0) return;
    if (product) {
      await addToCart(product.id, qty);
      trackAddToCart({ id: product.id, name: product.name, price: product.price }, qty);
      toast.success("Adăugat în coș!");
    }
  };

  const toggleFav = async () => {
    if (!user || !product) { toast.error("Autentifică-te mai întâi"); return; }
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
      setIsFav(false); toast.success("Eliminat din favorite");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
      setIsFav(true); toast.success("Adăugat la favorite!");
    }
  };

  // Reviews are now handled by ProductReviews component

  const submitQuestion = async () => {
    if (!user || !product || !questionText.trim()) return;
    const { error } = await supabase.from("product_questions").insert({ user_id: user.id, product_id: product.id, question: questionText });
    if (error) { toast.error("Eroare"); return; }
    toast.success("Întrebarea a fost trimisă!"); setQuestionText("");
    const { data } = await supabase.from("product_questions").select("*").eq("product_id", product.id).order("created_at", { ascending: false });
    setQuestions(data || []);
  };

  // Dynamic SEO for product page
  usePageSeo({
    title: product ? `${product.name} — ${product.price} lei · ${store_general.store_name}` : store_general.store_name,
    description: product ? `${product.name} — ${product.short_description || `Lumânare artizanală ${store_general.store_name}`}. Stoc: ${product.stock} bucăți. Livrare rapidă în România.` : "",
    ogImage: product?.image_url || "/og-homepage.jpg",
    ogType: "product",
    productPrice: product?.price,
    productCurrency: "RON",
  });

  if (loading) return <Layout><div className="container py-16 text-center">Se încarcă...</div></Layout>;
  if (!product) return <Layout><div className="container py-16 text-center">Produsul nu a fost găsit.</div></Layout>;

  const isBundle = product.product_type === "bundle";
  const bundleComponentsTotal = bundleComponents.reduce((sum: number, bc: any) => sum + (bc.product?.price || 0) * bc.quantity, 0);
  const bundleStock = isBundle && bundleComponents.length > 0
    ? Math.min(...bundleComponents.map((bc: any) => Math.floor((bc.product?.stock || 0) / bc.quantity)))
    : null;

  const activePrice = selectedSize ? selectedSize.price : (selectedVariant ? selectedVariant.price : product.price);
  const activeStock = isBundle ? (bundleStock ?? 0) : (selectedVariant ? selectedVariant.stock : product.stock);
  const activeImage = selectedVariant?.image_url || product.image_url;
  const specs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs as Record<string, string>).filter(([k]) => !k.startsWith("_")) : [];
  
  // Dynamic pricing rules
  const promoDiscount = getProductDiscount(product);
  const finalPrice = promoDiscount ? promoDiscount.discountedPrice : activePrice;
  const showOriginal = promoDiscount ? activePrice : product.old_price;
  const discount = showOriginal && showOriginal > finalPrice ? Math.round(((showOriginal - finalPrice) / showOriginal) * 100) : 0;
  
  const imageAlts = product.image_alts || {};
  const bundleSavings = isBundle && bundleComponentsTotal > finalPrice ? bundleComponentsTotal - finalPrice : 0;
  const bundleSavingsPercent = bundleSavings > 0 ? Math.round((bundleSavings / bundleComponentsTotal) * 100) : 0;

  return (
    <Layout>
      <div className="container py-6">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-xs tracking-wide uppercase text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Înapoi la colecție
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          <ProductImageGallery
            mainImage={activeImage || "/placeholder.svg"}
            images={product.images}
            alt={imageAlts[activeImage] || product.name}
          />

          <div className="space-y-4">
            {product.status === "draft" && <Badge variant="secondary">Ciornă</Badge>}
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating || 0) ? "fill-[hsl(var(--store-warning))] text-[hsl(var(--store-warning))]" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.review_count} recenzii)</span>
              {product.brands?.name && <span className="text-sm text-muted-foreground">• {product.brands.name}</span>}
            </div>

            <div className="bg-muted p-4 rounded">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-primary">{format(finalPrice)}</span>
                {showOriginal && showOriginal > finalPrice && (
                  <>
                    <span className="text-base text-muted-foreground line-through">{format(showOriginal)}</span>
                    {discount > 0 && <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-0.5 rounded">-{discount}%</span>}
                  </>
                )}
              </div>
            </div>
            {taxSettings.show_tax_included_message && (
              <p className="text-xs text-muted-foreground">{taxSettings.tax_included_message}</p>
            )}
            {promoDiscount && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-destructive text-destructive-foreground">{promoDiscount.badgeText}</Badge>
                <span className="text-sm font-medium text-primary">
                  Economisești {format(promoDiscount.savings)}
                </span>
                {promoDiscount.endsAt && <CountdownTimer endsAt={promoDiscount.endsAt} />}
              </div>
            )}

            <VariantSelector productId={product.id} basePrice={product.price} lowStockThreshold={product.low_stock_threshold || 5} onVariantSelect={setSelectedVariant} onHasVariants={setHasVariants} />
            <SizeSelector productId={product.id} onSizeSelect={(size) => { if (size) setSelectedSize(size); else setSelectedSize(null); }} />

            {/* Bundle savings badge */}
            {isBundle && bundleSavings > 0 && (
              <div className="bg-primary/10 border border-primary/20 p-3 flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">-{bundleSavingsPercent}%</Badge>
                <span className="text-sm font-medium text-primary">
                  Economisești {format(bundleSavings)} cumpărând pachetul!
                </span>
              </div>
            )}

            {/* Bundle components list */}
            {isBundle && bundleComponents.length > 0 && (
              <div className="space-y-2 border border-border rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground">📦 Conținut pachet:</p>
                {bundleComponents.map((bc: any) => (
                  <div key={bc.id} className="flex items-center gap-3">
                    {bc.product?.image_url ? (
                      <img src={bc.product.image_url} alt={bc.product.name} className="w-10 h-10 object-cover rounded border border-border" />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bc.product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {bc.quantity > 1 ? `${bc.quantity}× ` : ""}
                        <span className="line-through">{format(bc.product?.price * bc.quantity)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {product.short_description && (
              <p className="text-muted-foreground">{product.short_description}</p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-3">
              <div className="flex items-center border border-border rounded">
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
                <span className="w-12 text-center font-bold">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
              </div>
              <Button onClick={handleAddToCart} size="lg" className="flex-1 font-extrabold uppercase tracking-wide" disabled={activeStock <= 0 || (hasVariants && !selectedVariant)}>
                <ShoppingCart className="h-5 w-5 mr-2" /> {hasVariants && !selectedVariant ? "Selectează varianta" : activeStock <= 0 ? "Stoc epuizat" : "Adaugă în coș"}
              </Button>
              <Button variant="outline" size="lg" onClick={toggleFav}>
                <Heart className={`h-5 w-5 ${isFav ? "fill-primary text-primary" : ""}`} />
              </Button>
              <Button
                variant="outline" size="lg"
                onClick={() => product && addToComparison(product.id)}
                className={isInComparison(product.id) ? "border-primary text-primary" : ""}
              >
                <GitCompare className="h-5 w-5" />
              </Button>
            </div>


            {/* Stock status */}
            {(() => {
              const threshold = product.low_stock_threshold || 5;
              if (activeStock > threshold) {
                return <p className="text-sm font-medium text-primary">✓ În stoc</p>;
              } else if (activeStock > 0) {
                return (
                  <p className="text-sm font-medium text-accent animate-pulse">
                    ⚡ Stoc limitat — mai {activeStock === 1 ? "este 1 bucată" : `sunt ${activeStock} bucăți`}
                  </p>
                );
              } else {
                return (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-destructive">✗ Stoc epuizat</p>
                    {!restockDone ? (
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Email pentru notificare restock"
                          value={restockEmail}
                          onChange={(e) => setRestockEmail(e.target.value)}
                          className="flex-1 h-9 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={restockSubmitting || !restockEmail.includes("@")}
                          onClick={async () => {
                            setRestockSubmitting(true);
                            const { error } = await supabase.from("restock_notifications").insert({
                              product_id: product.id,
                              email: restockEmail,
                              user_id: user?.id || null,
                            });
                            if (error && error.code === "23505") {
                              toast.info("Ești deja înregistrat pentru notificare!");
                            } else if (error) {
                              toast.error("Eroare la înregistrare");
                            } else {
                              toast.success("Te vom notifica când produsul revine în stoc!");
                              setRestockDone(true);
                            }
                            setRestockSubmitting(false);
                          }}
                          className="gap-1"
                        >
                          <Bell className="w-3 h-3" /> Notifică-mă
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-primary">✓ Vei primi un email când produsul revine în stoc.</p>
                    )}
                  </div>
                );
              }
            })()}
            {activeStock > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Livrare estimată: <strong className="text-foreground">1-3 zile lucrătoare</strong></span>
                </div>
                <PriceDropAlert productId={product.id} productName={product.name} currentPrice={finalPrice} />
              </>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {product.sku && <span className="flex items-center gap-1"><Package className="w-3 h-3" /> SKU: {product.sku}</span>}
              {product.ean && <span className="flex items-center gap-1">EAN: {product.ean}</span>}
              {product.weight_kg && <span className="flex items-center gap-1">Greutate: {product.weight_kg} kg</span>}
              {product.length_cm && product.width_cm && product.height_cm && (
                <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {product.length_cm}×{product.width_cm}×{product.height_cm} cm</span>
              )}
            </div>

            {/* WhatsApp button */}
            <a
              href={`https://wa.me/40770123456?text=${encodeURIComponent(`Bună! Am o întrebare despre produsul "${product.name}" — ${window.location.href}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <MessageSquare className="w-4 h-4" /> Întreabă pe WhatsApp
            </a>
          </div>
        </div>

        {/* Vendor Comparison */}
        <div className="mt-8">
          <VendorComparison productName={product.name} productId={product.id} productPrice={product.price} brandId={product.brand_id} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mt-8">
          <TabsList>
            <TabsTrigger value="description">Descriere</TabsTrigger>
            <TabsTrigger value="specs">Specificații</TabsTrigger>
            <TabsTrigger value="reviews">Recenzii</TabsTrigger>
            <TabsTrigger value="qa">Întrebări ({questions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card>
              <CardContent className="pt-6">
                {product.description ? (
                  <div
                    className="prose prose-sm max-w-none text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-lg [&_img]:max-w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted/50 [&_th]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
                  />
                ) : (
                  <p className="text-muted-foreground">Nu există descriere disponibilă.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
              <CardContent className="pt-6">
                <ProductReviews productId={product.id} productName={product.name} />
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

        {/* Frequently bought together */}
        <FrequentlyBoughtTogether productId={product.id} currentProduct={product} />

        {/* Upgrade recommendation (upsell) */}
        <UpgradeRecommendation productId={product.id} currentProduct={product} />

        {/* Scent Pairing & Calculator */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <ScentPairing productName={product.name} tags={product.tags} />
          <CandleCalculator
            burnHours={product.burn_hours || (() => {
              const match = product.name.match(/(\d+)\s*h\b/i);
              if (match) return parseInt(match[1], 10);
              return product.weight_kg ? Math.round(product.weight_kg * 100) : 40;
            })()}
            productName={product.name}
          />
        </div>

        {/* Related products (manual selection) */}
        {relatedProducts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">Produse recomandate</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">Vizualizate recent</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentlyViewed.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Similar products (category-based) */}
        {similar.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">Produse similare</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Schema.org Product JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        name: sanitizeForJsonLd(product.name),
        description: sanitizeForJsonLd(product.short_description || product.description?.replace(/<[^>]*>/g, "")),
        image: product.image_url || "",
        brand: product.brands?.name ? { "@type": "Brand", name: sanitizeForJsonLd(product.brands.name) } : undefined,
        sku: product.sku || product.id,
        gtin13: product.ean || undefined,
        weight: product.weight_kg ? { "@type": "QuantitativeValue", value: product.weight_kg, unitCode: "KGM" } : undefined,
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

      {/* BreadcrumbList JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: window.location.origin },
          { "@type": "ListItem", position: 2, name: "Catalog", item: window.location.origin + "/catalog" },
          { "@type": "ListItem", position: 3, name: product.name, item: window.location.href },
        ],
      }) }} />

      {/* Sticky mobile Add to Cart */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{product.name}</p>
          <p className="text-lg font-bold text-primary">{format(product.price)}</p>
        </div>
        <Button onClick={handleAddToCart} className="shrink-0 font-semibold">
          <ShoppingCart className="h-4 w-4 mr-1" /> Cumpără
        </Button>
      </div>
    </Layout>
  );
}
