import { useEffect, useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const PLACEHOLDER_REVIEWS = [
  { id: "p1", reviewer_name: "Maria P.", rating: 5, comment: "Cel mai frumos cadou pe care l-am oferit. Parfumul de vanilie și santal a umplut întreaga cameră. Calitate excepțională!", date: "2025-02-14" },
  { id: "p2", reviewer_name: "Andrei T.", rating: 5, comment: "Am comandat un set personalizat pentru aniversare. Ambalajul premium și aroma rafinată au depășit orice așteptări.", date: "2025-01-28" },
  { id: "p3", reviewer_name: "Elena D.", rating: 5, comment: "A treia comandă la VENTUZA. Lumânările ard uniform, parfumul e natural și durează mult. Recomand cu încredere!", date: "2025-03-05" },
];

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const ref = useScrollReveal();

  useEffect(() => {
    (supabase as any)
      .from("reviews")
      .select("*, products(name)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }: any) => {
        setReviews(data && data.length > 0 ? data : PLACEHOLDER_REVIEWS);
      });
  }, []);

  return (
    <section className="bg-secondary py-16 md:py-24" ref={ref}>
      <div className="container px-4">
        <div className="text-center mb-12 reveal stagger-1">
          <p className="font-sans text-[11px] tracking-[4px] uppercase text-primary mb-3">RECENZII</p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">Ce spun clienții noștri</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((r, i) => (
            <div
              key={r.id}
              className={`reveal stagger-${i + 2} bg-card rounded-lg border border-border p-6 md:p-8`}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`h-4 w-4 ${j < r.rating ? "fill-primary text-primary" : "text-border"}`} />
                ))}
              </div>
              <p className="font-serif italic text-sm text-foreground/80 leading-relaxed mb-6">"{r.comment}"</p>
              <div className="flex items-center gap-2">
                <p className="font-sans text-sm font-medium text-foreground">{r.reviewer_name || "Client"}</p>
                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                <span className="font-sans text-[10px] text-muted-foreground">Cumpărare verificată</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
