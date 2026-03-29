import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface VisitData {
  lastVisit: number;
  visitCount: number;
  lastViewedIds: string[];
}

export default function WelcomeBack() {
  const [product, setProduct] = useState<Tables<"products"> | null>(null);
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    const key = "ml_visit_data";
    const raw = localStorage.getItem(key);
    const now = Date.now();
    let data: VisitData = raw
      ? JSON.parse(raw)
      : { lastVisit: 0, visitCount: 0, lastViewedIds: [] };

    // Count as new visit if > 1 hour since last
    const isNewVisit = now - data.lastVisit > 60 * 60 * 1000;
    if (isNewVisit) {
      data.visitCount += 1;
    }

    // Merge recently_viewed into visit data
    const recentIds: string[] = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
    if (recentIds.length > 0) {
      data.lastViewedIds = recentIds.slice(0, 4);
    }

    data.lastVisit = now;
    localStorage.setItem(key, JSON.stringify(data));

    setVisitCount(data.visitCount);

    // Only show for returning visitors (2+) with viewed products
    if (data.visitCount >= 2 && data.lastViewedIds.length > 0) {
      supabase
        .from("products")
        .select("*")
        .eq("id", data.lastViewedIds[0])
        .eq("visible", true)
        .maybeSingle()
        .then(({ data: p }) => {
          if (p) setProduct(p);
        });
    }
  }, []);

  if (visitCount < 2 || !product) return null;

  return (
    <section className="container px-4 py-6">
      <div className="bg-accent/30 border border-accent rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-shrink-0">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-lg font-semibold text-foreground">
            👋 Bun revenit!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Ai vizitat recent{" "}
            <Link
              to={`/product/${product.slug}`}
              className="text-primary font-medium hover:underline"
            >
              {product.name}
            </Link>
            . Încă te interesează?
          </p>
        </div>
        <Link
          to={`/product/${product.slug}`}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition whitespace-nowrap"
        >
          Vezi produsul →
        </Link>
      </div>
    </section>
  );
}
