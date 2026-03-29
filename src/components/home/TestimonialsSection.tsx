import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("product_reviews")
      .select("id, user_name, rating, body, product_id")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }: any) => setReviews(data || []));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="container py-12 md:py-28 px-4">
      <div className="text-center mb-8 md:mb-16">
        <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-primary mb-2 md:mb-3 font-medium">Recenzii</p>
        <h2 className="font-serif text-2xl md:text-4xl font-medium text-foreground">Ce Spun Clienții</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
        {reviews.map((r) => (
          <div key={r.id} className="text-center p-6">
            <div className="flex justify-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-border"}`} />
              ))}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6 italic font-serif">"{r.body}"</p>
            <div>
              <p className="text-sm font-medium text-foreground">{r.user_name || "Client Verificat"}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
