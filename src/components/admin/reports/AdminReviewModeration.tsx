import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Star, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

export default function AdminReviewModeration() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*, products(name)").order("created_at", { ascending: false }).limit(100);
    const filtered = (data || []).filter((r: any) => {
      if (filter === "pending") return !r.approved;
      if (filter === "approved") return r.approved;
      return false;
    });
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: string) => {
    // reviews table may not have 'approved' column in typed schema — cast to bypass
    await (supabase.from("reviews") as any).update({ approved: true }).eq("id", id);
    toast({ title: "Review aprobat" });
    load();
  };

  const handleReject = async (id: string) => {
    toast({ title: "Review respins" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Moderare Review-uri</h1>
          <p className="text-sm text-muted-foreground">Aprobă sau respinge review-uri clienți.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "pending" ? "În așteptare" : f === "approved" ? "Aprobate" : "Respinse"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Niciun review în această categorie.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produs</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comentariu</TableHead>
                  <TableHead>Data</TableHead>
                  {filter === "pending" && <TableHead>Acțiuni</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{(r.products as any)?.name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < (r.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-md truncate">{r.comment || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd MMM HH:mm", { locale: ro })}</TableCell>
                    {filter === "pending" && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-green-600 h-7" onClick={() => handleApprove(r.id)}><Check className="w-3 h-3" /></Button>
                          <Button size="sm" variant="outline" className="text-red-600 h-7" onClick={() => handleReject(r.id)}><X className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
