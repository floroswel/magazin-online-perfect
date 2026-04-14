import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Eye, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AdminEmailCampaigns() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSend = async () => {
    if (!subject || !body) {
      toast({ title: "Completează subiectul și conținutul", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: { type: "campaign", subject, body_html: body, audience },
      });
      if (error) throw error;
      toast({ title: "Campanie trimisă!", description: `Audiență: ${audience}` });
      setSubject("");
      setBody("");
    } catch (e: any) {
      toast({ title: "Eroare", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Mail className="w-5 h-5" /> Campanii Email</h1>
        <p className="text-sm text-muted-foreground">Creează și trimite campanii email personalizate.</p>
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
            <Button onClick={handleSend} disabled={sending || !subject || !body}>
              <Send className="w-4 h-4 mr-1" /> {sending ? "Se trimite..." : "Trimite Campania"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
