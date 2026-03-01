import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, CheckCircle2, XCircle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  product_id: string;
  user_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  pros: string | null;
  cons: string | null;
  verified_purchase: boolean;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("product_reviews").select("*").order("created_at", { ascending: false }).limit(100);
    setReviews(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("product_reviews").update({ status }).eq("id", id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success(status === "approved" ? "Review aprobat" : "Review respins");
  };

  const submitReply = async (id: string) => {
    await supabase.from("product_reviews").update({ admin_reply: reply }).eq("id", id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, admin_reply: reply } : r));
    setReplyingTo(null);
    setReply("");
    toast.success("Răspuns salvat");
  };

  const pendingCount = reviews.filter(r => r.status === "pending").length;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Star className="w-6 h-6 text-yellow-500" /> Review-uri Produse</h1>
        <p className="text-sm text-muted-foreground">Moderează și răspunde la review-urile clienților</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total review-uri</p><p className="text-2xl font-bold">{reviews.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Rating mediu</p><p className="text-2xl font-bold flex items-center gap-1">{avgRating} <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /></p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">În așteptare</p><p className="text-2xl font-bold text-yellow-500">{pendingCount}</p></CardContent></Card>
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
          ) : reviews.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Niciun review.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.user_name || "Anonim"}</span>
                      <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />)}</div>
                      {r.verified_purchase && <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs">Cumpărare verificată</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === "approved" ? "default" : r.status === "pending" ? "secondary" : "outline"}>
                        {r.status === "approved" ? "Aprobat" : r.status === "pending" ? "În așteptare" : "Respins"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ro-RO")}</span>
                    </div>
                  </div>
                  {r.title && <p className="font-medium">{r.title}</p>}
                  {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
                  {r.pros && <p className="text-sm text-green-600">👍 {r.pros}</p>}
                  {r.cons && <p className="text-sm text-red-500">👎 {r.cons}</p>}
                  {r.admin_reply && (
                    <div className="bg-muted/50 rounded p-3 text-sm"><span className="font-medium">Răspuns admin:</span> {r.admin_reply}</div>
                  )}
                  <div className="flex gap-2 pt-1">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "approved")}><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobă</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "rejected")} className="text-destructive"><XCircle className="w-3 h-3 mr-1" /> Respinge</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(r.id); setReply(r.admin_reply || ""); }}><MessageSquare className="w-3 h-3 mr-1" /> Răspunde</Button>
                  </div>
                  {replyingTo === r.id && (
                    <div className="flex gap-2 mt-2">
                      <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Scrie răspunsul..." rows={2} className="flex-1" />
                      <Button size="sm" onClick={() => submitReply(r.id)}>Salvează</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
