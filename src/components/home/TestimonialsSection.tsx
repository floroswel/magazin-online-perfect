import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    (supabase as any)
      .from("reviews")
      .select("*, products(name, image_url)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }: any) => setReviews(data || []));
  }, []);

  if (reviews.length === 0) return null;

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "5.0";

  return (
    <section className="container py-12">
      <h2 className="text-2xl font-bold text-foreground text-center mb-2">Ce spun clienții noștri</h2>

      <div className="flex items-center justify-center gap-4 mb-8 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {avgRating}/5 din {reviews.length}+ recenzii
        </span>
        <span>•</span>
        <span>97% recomandă</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {reviews.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                ))}
              </div>
              <p className="text-sm text-foreground mb-3 line-clamp-3">{r.comment}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {r.products?.image_url && (
                  <img src={r.products.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium text-foreground">{r.reviewer_name || "Client verificat"}</p>
                  {r.products?.name && <p className="truncate max-w-[150px]">{r.products.name}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
