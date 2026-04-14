import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  city?: string;
  product_name?: string;
  product_slug?: string;
  product_image?: string;
}

export default function Testimonials() {
  const { data: testimonials } = useQuery({
    queryKey: ["homepage-testimonials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("id, reviewer_name, rating, comment, products(name, slug, image_url)")
        .eq("status", "approved")
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!data) return [];
      return data.map((r: any) => ({
        id: r.id,
        reviewer_name: r.reviewer_name || "Client verificat",
        rating: r.rating,
        comment: r.comment,
        product_name: r.products?.name,
        product_slug: r.products?.slug,
        product_image: r.products?.image_url,
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fallback static testimonials when DB is empty
  const fallback: Testimonial[] = [
    {
      id: "1",
      reviewer_name: "Andreea M.",
      rating: 5,
      comment: "Parfumul este absolut divin! Umple toată camera cu o aromă caldă și relaxantă. Voi comanda din nou cu siguranță.",
      city: "București",
    },
    {
      id: "2",
      reviewer_name: "Ioana P.",
      rating: 5,
      comment: "Lumânarea arată superb pe masă, sticla e foarte fină și se potrivește cu decorul. Chiar dacă nu e aprinsă, e o piesă frumoasă în cameră.",
      city: "Cluj-Napoca",
    },
    {
      id: "3",
      reviewer_name: "Maria T.",
      rating: 5,
      comment: "Se aprinde ușor și arde constant, fără să facă fum. Atmosfera creată e perfectă pentru serile relaxante de toamnă.",
      city: "Timișoara",
    },
  ];

  const items = testimonials && testimonials.length >= 3 ? testimonials.slice(0, 3) : fallback;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="ml-container">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-2">
          Recenzii clienți
        </h2>
        <p className="text-muted-foreground text-center mb-10">
          Uite ce au spus despre produsele noastre
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t) => (
            <div
              key={t.id}
              className="border border-border rounded-xl p-6 bg-card hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5"
                    fill={i < t.rating ? "var(--stars-color, #FFB800)" : "none"}
                    stroke={i < t.rating ? "var(--stars-color, #FFB800)" : "hsl(var(--muted-foreground))"}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-sm text-foreground leading-relaxed flex-1 mb-4">
                "{t.comment}"
              </p>

              {/* Author */}
              <div className="border-t border-border pt-3">
                <p className="font-semibold text-sm text-foreground">{t.reviewer_name}</p>
                {t.city && (
                  <p className="text-xs text-muted-foreground">{t.city}</p>
                )}
              </div>

              {/* Linked product */}
              {t.product_name && (
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                  {t.product_image && (
                    <img
                      src={t.product_image}
                      alt={t.product_name}
                      className="w-12 h-12 rounded-md object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.product_name}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
