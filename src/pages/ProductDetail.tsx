import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Heart, Star, Minus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Tables<"products"> | null>(null);
  const [similar, setSimilar] = useState<Tables<"products">[]>([]);
  const [reviews, setReviews] = useState<(Tables<"reviews"> & { profile?: { full_name: string | null } })[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prod } = await supabase.from("products").select("*").eq("slug", slug).single();
      if (!prod) { setLoading(false); return; }
      setProduct(prod);

      const [simRes, revRes] = await Promise.all([
        supabase.from("products").select("*").eq("category_id", prod.category_id!).neq("id", prod.id).limit(4),
        supabase.from("reviews").select("*").eq("product_id", prod.id).order("created_at", { ascending: false }),
      ]);
      setSimilar(simRes.data || []);
      setReviews(revRes.data || []);

      if (user) {
        const { data: fav } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", prod.id).maybeSingle();
        setIsFav(!!fav);
      }
      setLoading(false);
    }
    load();
  }, [slug, user]);

  const handleAddToCart = async () => {
    if (!user) { toast.error("Autentifică-te pentru a adăuga în coș"); return; }
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
    // Refresh reviews
    const { data } = await supabase.from("reviews").select("*").eq("product_id", product.id).order("created_at", { ascending: false });
    setReviews(data || []);
  };

  if (loading) return <Layout><div className="container py-16 text-center">Se încarcă...</div></Layout>;
  if (!product) return <Layout><div className="container py-16 text-center">Produsul nu a fost găsit.</div></Layout>;

  const specs = product.specs && typeof product.specs === "object" ? Object.entries(product.specs as Record<string, string>) : [];
  const discount = product.old_price ? Math.round(((product.old_price - product.price) / product.old_price) * 100) : 0;

  return (
    <Layout>
      <div className="container py-6">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Înapoi la catalog
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-card rounded-lg p-8 flex items-center justify-center border">
            <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="max-h-96 object-contain" />
          </div>

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
              <span className="text-3xl font-bold text-primary">{product.price.toLocaleString("ro-RO")} lei</span>
              {product.old_price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{product.old_price.toLocaleString("ro-RO")} lei</span>
                  <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded">-{discount}%</span>
                </>
              )}
            </div>

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
            </div>

            <p className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-destructive"}`}>
              {product.stock > 0 ? `✓ În stoc (${product.stock} buc.)` : "✗ Stoc epuizat"}
            </p>
          </div>
        </div>

        {/* Specs */}
        {specs.length > 0 && (
          <Card className="mt-8">
            <CardHeader><CardTitle>Specificații tehnice</CardTitle></CardHeader>
            <CardContent>
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
        )}

        {/* Reviews */}
        <Card className="mt-8">
          <CardHeader><CardTitle>Recenzii ({reviews.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
              <p className="text-muted-foreground text-sm">Nicio recenzie încă.</p>
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
    </Layout>
  );
}
