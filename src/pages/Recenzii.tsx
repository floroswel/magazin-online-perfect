import { useEffect, useState } from "react";
import { Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

export default function Recenzii() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = (supabase as any).from("reviews").select("*, products(name, slug, image_url)").eq("status", "approved").order("created_at", { ascending: false }).limit(50);
    if (filter !== "all") q = q.eq("rating", parseInt(filter));
    q.then(({ data }: any) => { setReviews(data || []); setLoading(false); });
  }, [filter]);

  const avgRating = reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">⭐ Recenzii Clienți</h1>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 text-lg font-bold text-foreground">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> {avgRating}/5
            </span>
            <span>{reviews.length} recenzii verificate</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="5">5 stele</SelectItem>
              <SelectItem value="4">4 stele</SelectItem>
              <SelectItem value="3">3 stele</SelectItem>
              <SelectItem value="2">2 stele</SelectItem>
              <SelectItem value="1">1 stea</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Se încarcă...</p>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground">Nu sunt recenzii pentru filtrul selectat.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                        ))}
                      </div>
                      <p className="font-medium text-foreground text-sm">{r.reviewer_name || "Client verificat"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                  <p className="text-sm text-foreground mb-2">{r.comment}</p>
                  {r.products && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {r.products.image_url && <img src={r.products.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span>{r.products.name}</span>
                    </div>
                  )}
                  {r.photo_urls?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.photo_urls.map((url: string, i: number) => (
                        <img key={i} src={url} alt="Review photo" className="w-16 h-16 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
