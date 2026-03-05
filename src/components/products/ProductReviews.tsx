import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty } from "@/hooks/useLoyalty";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Star, ThumbsUp, Camera, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  pros: string | null;
  cons: string | null;
  verified_purchase: boolean;
  status: string;
  admin_reply: string | null;
  photos: string[];
  created_at: string;
  helpful_count: number | null;
}

interface ReviewSettings {
  auto_approve: boolean;
  verified_only: boolean;
  allow_photos: boolean;
  max_photos: number;
  min_length: number;
  show_on_product: boolean;
}

interface Props {
  productId: string;
  productName: string;
}

const REVIEWS_PER_PAGE = 10;

export default function ProductReviews({ productId, productName }: Props) {
  const { user } = useAuth();
  const { config: loyaltyConfig, addPoints } = useLoyalty();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ReviewSettings>({ auto_approve: false, verified_only: false, allow_photos: true, max_photos: 3, min_length: 0, show_on_product: true });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formPros, setFormPros] = useState("");
  const [formCons, setFormCons] = useState("");
  const [formPhotos, setFormPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Display state
  const [filterRating, setFilterRating] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setLoading(true);
    const [revRes, settingsRes] = await Promise.all([
      supabase.from("product_reviews").select("*").eq("product_id", productId).eq("status", "approved").order("created_at", { ascending: false }),
      supabase.from("app_settings").select("value_json").eq("key", "review_settings").maybeSingle(),
    ]);
    setReviews((revRes.data || []) as Review[]);
    if (settingsRes.data?.value_json && typeof settingsRes.data.value_json === "object") {
      setSettings(prev => ({ ...prev, ...(settingsRes.data.value_json as Record<string, unknown>) } as ReviewSettings));
    }
    setLoading(false);
  };

  // Star distribution
  const starCounts = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: reviews.filter(r => r.rating === s).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === s).length / reviews.length) * 100) : 0,
  }));
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  // Filter & sort
  const filtered = reviews.filter(r => {
    if (filterRating !== "all" && r.rating !== Number(filterRating)) return false;
    if (filterType === "photos" && (!r.photos || r.photos.length === 0)) return false;
    if (filterType === "verified" && !r.verified_purchase) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "helpful") return (b.helpful_count || 0) - (a.helpful_count || 0);
    if (sortBy === "high") return b.rating - a.rating;
    if (sortBy === "low") return a.rating - b.rating;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / REVIEWS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

  const submitReview = async () => {
    if (!user) { toast.error("Autentifică-te mai întâi"); return; }
    if (formRating === 0) { toast.error("Selectează un rating"); return; }
    if (settings.min_length > 0 && formBody.length < settings.min_length) {
      toast.error(`Recenzia trebuie să aibă minim ${settings.min_length} caractere`);
      return;
    }

    setSubmitting(true);

    // Check verified purchase
    const { data: orderData } = await supabase.from("order_items").select("order_id").eq("product_id", productId).limit(1);
    let verified = false;
    if (orderData && orderData.length > 0) {
      const { data: orderCheck } = await supabase.from("orders").select("id").eq("id", orderData[0].order_id).eq("user_id", user.id).maybeSingle();
      verified = !!orderCheck;
    }

    // Upload photos
    let photoUrls: string[] = [];
    if (formPhotos.length > 0 && settings.allow_photos) {
      for (const file of formPhotos.slice(0, settings.max_photos)) {
        const ext = file.name.split(".").pop();
        const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("review-photos-uploads").upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from("review-photos-uploads").getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }
    }

    // Get user profile name
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();

    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      user_name: profile?.full_name || user.email?.split("@")[0] || "Client",
      rating: formRating,
      title: formTitle || null,
      body: formBody || null,
      pros: formPros || null,
      cons: formCons || null,
      verified_purchase: verified,
      status: settings.auto_approve ? "approved" : "pending",
      photos: photoUrls,
    });

    if (error) {
      toast.error("Eroare la trimiterea recenziei");
      setSubmitting(false);
      return;
    }

    // Award loyalty points for review
    if (loyaltyConfig.program_enabled && loyaltyConfig.bonus_review > 0) {
      await addPoints(loyaltyConfig.bonus_review, "bonus", `Review pentru ${productName}`);
      toast.success(`Recenzie trimisă! +${loyaltyConfig.bonus_review} puncte fidelitate`);
    } else {
      toast.success(settings.auto_approve ? "Recenzia ta a fost publicată!" : "Recenzia a fost trimisă și va fi verificată.");
    }

    setShowForm(false);
    setFormRating(0);
    setFormTitle("");
    setFormBody("");
    setFormPros("");
    setFormCons("");
    setFormPhotos([]);
    setSubmitting(false);
    loadData();
  };

  const markHelpful = async (reviewId: string) => {
    await supabase.from("product_reviews").update({ helpful_count: (reviews.find(r => r.id === reviewId)?.helpful_count || 0) + 1 }).eq("id", reviewId);
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r));
  };

  if (!settings.show_on_product) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-foreground">{avgRating.toFixed(1)}</div>
          <div className="flex justify-center mt-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">({reviews.length} recenzii)</p>
        </div>
        <div className="space-y-1.5">
          {starCounts.map(s => (
            <button key={s.stars} className="flex items-center gap-2 w-full group" onClick={() => { setFilterRating(filterRating === String(s.stars) ? "all" : String(s.stars)); setPage(1); }}>
              <span className="text-sm w-8 text-right">{s.stars}★</span>
              <Progress value={s.pct} className="flex-1 h-3" />
              <span className="text-xs text-muted-foreground w-12">{s.pct}% ({s.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Write review button */}
      <div className="flex items-center justify-between">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "default"}>
          {showForm ? "Anulează" : "Scrie o recenzie"}
        </Button>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-8"><SelectValue placeholder="Filtrează" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="photos">Cu fotografii</SelectItem>
              <SelectItem value="verified">Verificați</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(1); }}>
            <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Sortează" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Cele mai recente</SelectItem>
              <SelectItem value="helpful">Cele mai utile</SelectItem>
              <SelectItem value="high">Rating înalt</SelectItem>
              <SelectItem value="low">Rating scăzut</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Rating *</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setFormRating(s)}>
                    <Star className={`w-7 h-7 cursor-pointer transition-colors ${s <= formRating ? "text-yellow-500 fill-yellow-500" : "text-muted hover:text-yellow-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Titlu (opțional)</p>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} maxLength={100} placeholder="Rezumat scurt" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Recenzie {settings.min_length > 0 ? `(min ${settings.min_length} caractere)` : "(opțional)"}</p>
              <Textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={3} placeholder="Spune-ne experiența ta..." />
              {settings.min_length > 0 && <p className="text-xs text-muted-foreground mt-1">{formBody.length}/{settings.min_length} caractere</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">👍 Pro-uri</p>
                <Input value={formPros} onChange={e => setFormPros(e.target.value)} placeholder="Ce ți-a plăcut?" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">👎 Contra</p>
                <Input value={formCons} onChange={e => setFormCons(e.target.value)} placeholder="Ce ar putea fi mai bun?" />
              </div>
            </div>
            {settings.allow_photos && (
              <div>
                <p className="text-sm font-medium mb-1">Fotografii (max {settings.max_photos})</p>
                <input type="file" ref={fileRef} accept="image/*" multiple className="hidden" onChange={e => {
                  const files = Array.from(e.target.files || []).slice(0, settings.max_photos);
                  setFormPhotos(files);
                }} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Camera className="w-3 h-3 mr-1" /> Adaugă fotografii
                </Button>
                {formPhotos.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {formPhotos.map((f, i) => (
                      <div key={i} className="relative w-16 h-16 rounded border border-border overflow-hidden">
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button onClick={submitReview} disabled={submitting || formRating === 0}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Trimite recenzia
            </Button>
            {loyaltyConfig.program_enabled && loyaltyConfig.bonus_review > 0 && (
              <p className="text-xs text-green-600">🎁 Vei primi +{loyaltyConfig.bonus_review} puncte fidelitate pentru recenzie</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : paginated.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {reviews.length === 0 ? "Nicio recenzie încă. Fii primul care lasă o recenzie!" : "Niciun rezultat pentru filtrele selectate."}
        </p>
      ) : (
        <div className="space-y-4">
          {paginated.map(r => (
            <div key={r.id} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />)}</div>
                  <span className="font-medium text-sm">{r.user_name || "Client"}</span>
                  {r.verified_purchase && <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs gap-1"><CheckCircle2 className="w-3 h-3" /> Verificat</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</span>
              </div>
              {r.title && <p className="font-medium">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
              {r.pros && <p className="text-sm text-green-600">👍 {r.pros}</p>}
              {r.cons && <p className="text-sm text-red-500">👎 {r.cons}</p>}
              {r.photos && r.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {r.photos.map((url, i) => (
                    <img key={i} src={url} alt={`Review photo ${i + 1}`} className="w-20 h-20 object-cover rounded border border-border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxUrl(url)} />
                  ))}
                </div>
              )}
              {r.admin_reply && (
                <div className="bg-muted/50 rounded p-3 text-sm border-l-4 border-primary">
                  <span className="font-medium text-primary">Răspuns oficial</span>
                  <p className="mt-1">{r.admin_reply}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => markHelpful(r.id)}>
                  <ThumbsUp className="w-3 h-3" /> Util ({r.helpful_count || 0})
                </Button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Pagina {page} din {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Review photo" className="max-w-[90vw] max-h-[90vh] rounded-lg" />
        </div>
      )}
    </div>
  );
}
