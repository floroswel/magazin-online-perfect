import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Users, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminPushNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: number; failed: number } | null>(null);

  const { data: subCount } = useQuery({
    queryKey: ["push-sub-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("push_subscriptions")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Titlu și mesaj sunt obligatorii");
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-push", {
        body: { title, body, url: url || undefined, broadcast: true },
      });
      if (error) throw error;
      const result = { success: data?.sent ?? 0, failed: data?.failed ?? 0 };
      setLastResult(result);
      toast.success(`Trimise cu succes: ${result.success} notificări`);
      setTitle("");
      setBody("");
      setUrl("");
    } catch (err: any) {
      toast.error(err.message || "Eroare la trimitere");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Notificări Push
        </h1>
        <p className="text-sm text-muted-foreground">Trimite notificări push către toți utilizatorii abonați.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{subCount ?? "—"}</div>
            <p className="text-xs text-muted-foreground">Abonați activi</p>
          </CardContent>
        </Card>
        {lastResult && (
          <>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <div className="text-2xl font-bold">{lastResult.success}</div>
                <p className="text-xs text-muted-foreground">Trimise cu succes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                <div className="text-2xl font-bold">{lastResult.failed}</div>
                <p className="text-xs text-muted-foreground">Eșuate</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compune notificare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Titlu *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ofertă specială de weekend! 🔥"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Mesaj *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex: -20% la toate lumânările parfumate. Doar azi!"
              rows={3}
              maxLength={300}
            />
          </div>
          <div className="space-y-2">
            <Label>URL destinație (opțional)</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ex: /oferte sau /catalog/lumanari"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()}>
              {sending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
              {sending ? "Se trimit..." : `Trimite către ${subCount ?? 0} abonați`}
            </Button>
            <Badge variant="outline" className="text-xs">
              Broadcast — toți abonații
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
