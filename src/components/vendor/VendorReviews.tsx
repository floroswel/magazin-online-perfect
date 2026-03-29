import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VendorReviewsProps {
  brandId: string;
  rating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  author_name: string;
  created_at: string;
  product_name: string;
}

export default function VendorReviews({ brandId, rating, reviewCount }: VendorReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!brandId) return;
    // Fetch reviews for products belonging to this brand
    supabase
      .from("reviews")
      .select("id, rating, comment, author_name, created_at, product_id")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return;

        // Get product names for these reviews
        const productIds = [...new Set(data.map((r: any) => r.product_id).filter(Boolean))];
        const { data: products } = await supabase
          .from("products")
          .select("id, name, brand_id")
          .in("id", productIds)
          .eq("brand_id", brandId);

        const brandProductIds = new Set((products || []).map((p: any) => p.id));
        const productNameMap: Record<string, string> = {};
        (products || []).forEach((p: any) => { productNameMap[p.id] = p.name; });

        const filtered = data
          .filter((r: any) => brandProductIds.has(r.product_id))
          .map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment || "",
            author_name: r.author_name || "Client",
            created_at: r.created_at,
            product_name: productNameMap[r.product_id] || "Produs",
          }));

        setReviews(filtered);
      });
  }, [brandId]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-6 h-6 ${s <= Math.round(rating) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        <h3 className="text-xl font-bold mb-1">{rating.toFixed(1)} / 5</h3>
        <p className="text-muted-foreground text-sm">Bazat pe {reviewCount} recenzii ale clienților</p>
      </div>

      {/* Individual reviews */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-card-foreground">{review.author_name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("ro-RO")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Produs: {review.product_name}</p>
              {review.comment && <p className="text-sm text-card-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
