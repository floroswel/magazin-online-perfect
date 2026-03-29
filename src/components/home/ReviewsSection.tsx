import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const PLACEHOLDER_REVIEWS = [
  { id: "p1", user_name: "Maria P.", rating: 5, body: "Cel mai frumos cadou pe care l-am oferit. Parfumul de vanilie și santal a umplut întreaga cameră. Calitate excepțională!", created_at: "2025-02-14" },
  { id: "p2", user_name: "Andrei T.", rating: 5, body: "Am comandat un set personalizat pentru aniversare. Ambalajul premium și aroma rafinată au depășit orice așteptări.", created_at: "2025-01-28" },
  { id: "p3", user_name: "Elena D.", rating: 5, body: "A treia comandă la Mama Lucica. Lumânările ard uniform, parfumul e natural și durează mult. Recomand cu încredere!", created_at: "2025-03-05" },
];

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const ref = useScrollReveal();

  useEffect(() => {
    supabase
      .from("product_reviews")
      .select("id, user_name, rating, body, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }: any) => {
        setReviews(data && data.length > 0 ? data : PLACEHOLDER_REVIEWS);
      });
  }, []);

  return (
    <section className="py-16 md:py-24" ref={ref}>
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {reviews.map((r, i) => (
            <div
              key={r.id}
              className={`reveal stagger-${Math.min(i + 1, 4)} text-center px-4`}
            >
              <div className="flex justify-center gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`h-4 w-4 ${j < r.rating ? "fill-foreground text-foreground" : "text-border"}`} />
                ))}
              </div>
              <p className="font-serif text-base text-foreground/80 leading-relaxed mb-6 italic">
                "{r.body || r.comment}"
              </p>
              <p className="font-sans text-[12px] font-medium tracking-[1px] uppercase text-muted-foreground">
                {r.user_name || r.reviewer_name || "Client"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
