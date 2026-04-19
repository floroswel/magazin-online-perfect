import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Eye, Loader2, History, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Campaign {
  id: string;
  subject: string;
  content: string;
  status: string;
  recipient_count: number | null;
  target_segment: string | null;
  sent_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function AdminEmailCampaigns() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState<Campaign[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [search, setSearch] = useState("");

  const loadHistory = async () => {
    setLoadingHistory(true);
    let q = supabase
      .from("newsletter_campaigns")
      .select("id, subject, content, status, recipient_count, target_segment, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (search.trim()) q = q.ilike("subject", `%${search.trim()}%`);
    const { data, error } = await q;
    if (error) toast({ title: "Eroare la încărcare istoric", description: error.message, variant: "destructive" });
    setHistory((data as Campaign[]) || []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
    // realtime updates so when send-email finishes the row appears immediately
    const ch = supabase
      .channel("newsletter_campaigns_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "newsletter_campaigns" }, () => loadHistory())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSend = async () => {
    const subj = subject.trim();
    const html = body.trim();
    if (!subj) {
      toast({ title: "Subiect obligatoriu", variant: "destructive" });
      return;
    }
    if (!html || html.length < 10) {
      toast({ title: "Conținut email prea scurt", description: "Minim 10 caractere.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      // 1) Persist as 'sending' first so we always have history (even if edge function fails)
      const { data: row, error: insertErr } = await supabase
        .from("newsletter_campaigns")
        .insert({
          subject: subj,
          content: html,
          status: "sending",
          target_segment: audience,
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;

      // 2) Trigger send-email edge function
      const { error: fnErr } = await supabase.functions.invoke("send-email", {
        body: { type: "campaign", campaign_id: row.id, subject: subj, body_html: html, audience },
      });
      if (fnErr) {
        await supabase
          .from("newsletter_campaigns")
          .update({ status: "failed" })
          .eq("id", row.id);
        throw fnErr;
      }

      await supabase
        .from("newsletter_campaigns")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);

      toast({ title: "Campanie trimisă", description: `Audiență: ${audience}` });
      setSubject("");
      setBody("");
      loadHistory();
    } catch (e: any) {
      toast({ title: "Eroare trimitere", description: e?.message || "Nu s-a putut trimite", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Mail className="w-5 h-5" /> Campanii Email</h1>
        <p className="text-sm text-muted-foreground">Creează, trimite și urmărește istoricul campaniilor email.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Subiect Email</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Reduceri de Primăvară 🌸" />
            </div>
            <div>
              <Label className="text-xs">Audiență</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți abonații</SelectItem>
                  <SelectItem value="customers">Doar clienți cu comenzi</SelectItem>
                  <SelectItem value="vip">Clienți VIP</SelectItem>
                  <SelectItem value="inactive">Clienți inactivi (90+ zile)</SelectItem>
                  <SelectItem value="newsletter">Abonați newsletter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Conținut Email (HTML acceptat)</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="Scrie conținutul campaniei aici..." className="font-mono text-sm" />
          </div>

          {preview && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-xs font-bold mb-2">Previzualizare:</p>
                <div className="bg-background p-4 rounded border">
                  <h3 className="font-bold mb-2">{subject || "Subiect..."}</h3>
                  <div dangerouslySetInnerHTML={{ __html: body || "<p>Conținut...</p>" }} className="prose prose-sm max-w-none" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview(!preview)}>
              <Eye className="w-4 h-4 mr-1" /> {preview ? "Ascunde" : "Previzualizare"}
            </Button>
            <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}>
              {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              {sending ? "Se trimite..." : "Trimite Campania"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold flex items-center gap-2 text-foreground">
              <History className="w-4 h-4" /> Istoric campanii
            </h2>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după subiect..."
              className="max-w-xs h-8"
            />
          </div>
          {loadingHistory ? (
            <div className="text-center py-6 text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Se încarcă...
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nicio campanie trimisă încă.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-foreground truncate">{c.subject}</p>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{c.target_segment || "all"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(c.sent_at || c.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                      {c.recipient_count != null ? ` · ${c.recipient_count} destinatari` : ""}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {c.status === "sent" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Trimisă
                      </span>
                    ) : c.status === "failed" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                        <XCircle className="w-3.5 h-3.5" /> Eșuată
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {c.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
