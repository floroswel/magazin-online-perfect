import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    (supabase as any)
      .from("reviews")
      .select("*, products(name, image_url)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }: any) => setReviews(data || []));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="container py-20 md:py-28">
      <div className="text-center mb-16">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-medium">Recenzii</p>
        <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground">Ce Spun Clienții</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {reviews.map((r) => (
          <div key={r.id} className="text-center p-6">
            <div className="flex justify-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-border"}`} />
              ))}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6 italic font-serif">"{r.comment}"</p>
            <div>
              <p className="text-sm font-medium text-foreground">{r.reviewer_name || "Client Verificat"}</p>
              {r.products?.name && (
                <p className="text-xs text-muted-foreground mt-1">{r.products.name}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
