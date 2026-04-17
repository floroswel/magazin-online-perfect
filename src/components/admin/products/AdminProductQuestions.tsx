import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

export default function AdminProductQuestions() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const load = async () => {
    const { data } = await supabase.from("product_questions").select("*, products(name)").order("created_at", { ascending: false }).limit(100);
    setQuestions(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    await supabase.from("product_questions").update({ answer: replyText, answered_at: new Date().toISOString(), status: "answered" }).eq("id", id);
    toast({ title: "Răspuns trimis" });
    setReplyTo(null); setReplyText("");
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Întrebări Produse</h1>
        <p className="text-sm text-muted-foreground">Q&A — întrebări de la clienți și răspunsuri.</p>
      </div>
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nu sunt întrebări.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{(q.products as any)?.name || "Produs"}</span>
                    <Badge variant={q.status === "answered" ? "default" : "outline"}>
                      {q.status === "answered" ? "Răspuns" : "Nou"}
                    </Badge>
                  </div>
                  <p className="text-sm">{q.question}</p>
                  {q.answer && <p className="text-sm text-primary bg-primary/5 rounded p-2">↳ {q.answer}</p>}
                  {replyTo === q.id ? (
                    <div className="flex gap-2">
                      <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Scrie răspunsul..." rows={2} />
                      <Button size="sm" onClick={() => submitReply(q.id)}><Send className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    !q.answer && <Button size="sm" variant="outline" onClick={() => setReplyTo(q.id)}>Răspunde</Button>
                  )}
                  <p className="text-xs text-muted-foreground">{format(new Date(q.created_at), "dd MMM yyyy HH:mm", { locale: ro })}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
