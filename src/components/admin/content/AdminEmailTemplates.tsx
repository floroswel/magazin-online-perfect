import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Edit, RotateCcw, Send, Eye } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";

const VARIABLES = [
  { key: "{{nume_client}}", label: "Nume client" },
  { key: "{{id_comanda}}", label: "ID comandă" },
  { key: "{{total_comanda}}", label: "Total comandă" },
  { key: "{{produse}}", label: "Produse" },
  { key: "{{adresa_livrare}}", label: "Adresa livrare" },
  { key: "{{nr_awb}}", label: "Nr. AWB" },
  { key: "{{link_tracking}}", label: "Link tracking" },
  { key: "{{motiv}}", label: "Motiv" },
  { key: "{{suma_rambursata}}", label: "Suma rambursată" },
  { key: "{{link_cont}}", label: "Link cont" },
  { key: "{{nr_factura}}", label: "Nr. factură" },
];

const SAMPLE_DATA: Record<string, string> = {
  "{{nume_client}}": "Ion Popescu",
  "{{id_comanda}}": "abc12345",
  "{{total_comanda}}": "349.99",
  "{{produse}}": "<ul><li>Laptop ASUS - 1x - 2999 RON</li><li>Mouse Logitech - 1x - 89 RON</li></ul>",
  "{{adresa_livrare}}": "Str. Exemplu 10, București, Sector 1",
  "{{nr_awb}}": "FAN-1234567890",
  "{{link_tracking}}": "https://tracking.example.com/FAN-1234567890",
  "{{motiv}}": "Client a solicitat anularea",
  "{{suma_rambursata}}": "199.50",
  "{{link_cont}}": "https://magazin.ro/account",
  "{{nr_factura}}": "FACT-2026-00042",
};

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  order_placed: { subject: "Comandă confirmată #{{id_comanda}}", body: "<h2>Bună, {{nume_client}}!</h2><p>Comanda ta <strong>#{{id_comanda}}</strong> a fost înregistrată cu succes.</p><p><strong>Total:</strong> {{total_comanda}} RON</p><p>{{produse}}</p>" },
  order_confirmed: { subject: "Comanda #{{id_comanda}} a fost confirmată", body: "<h2>Bună, {{nume_client}}!</h2><p>Comanda ta a fost confirmată și este în curs de procesare.</p>" },
  order_processing: { subject: "Comanda #{{id_comanda}} este în procesare", body: "<h2>Bună, {{nume_client}}!</h2><p>Comanda ta este acum în procesare.</p>" },
  order_shipped: { subject: "Comanda #{{id_comanda}} a fost expediată 🚚", body: "<h2>Bună, {{nume_client}}!</h2><p>AWB: <strong>{{nr_awb}}</strong></p><p><a href='{{link_tracking}}'>Urmărește coletul →</a></p>" },
  order_delivered: { subject: "Comanda #{{id_comanda}} a fost livrată ✅", body: "<h2>Bună, {{nume_client}}!</h2><p>Comanda a fost livrată cu succes!</p>" },
  order_cancelled: { subject: "Comanda #{{id_comanda}} a fost anulată", body: "<h2>Bună, {{nume_client}}!</h2><p>Comanda a fost anulată. Motiv: {{motiv}}</p>" },
  return_requested: { subject: "Cerere retur primită — #{{id_comanda}}", body: "<h2>Bună, {{nume_client}}!</h2><p>Am primit cererea ta de retur.</p>" },
  return_approved: { subject: "Returul tău a fost aprobat ✅", body: "<h2>Bună, {{nume_client}}!</h2><p>Cererea de retur a fost aprobată.</p>" },
  return_rejected: { subject: "Returul tău a fost respins", body: "<h2>Bună, {{nume_client}}!</h2><p>Motiv: {{motiv}}</p>" },
  refund_processed: { subject: "Rambursare procesată — {{suma_rambursata}} RON", body: "<h2>Bună, {{nume_client}}!</h2><p>Rambursarea de {{suma_rambursata}} RON a fost procesată.</p>" },
  subscription_activated: { subject: "Abonamentul tău a fost activat 🎉", body: "<h2>Bună, {{nume_client}}!</h2><p>Abonamentul tău a fost activat.</p>" },
  subscription_renewal_reminder: { subject: "Reminder: reînnoire abonament", body: "<h2>Bună, {{nume_client}}!</h2><p>Abonamentul tău se va reînnoi în curând.</p>" },
  subscription_order_created: { subject: "Comandă din abonament #{{id_comanda}}", body: "<h2>Bună, {{nume_client}}!</h2><p>Comanda recurentă a fost generată. Total: {{total_comanda}} RON</p>" },
  subscription_paused: { subject: "Abonamentul tău a fost modificat", body: "<h2>Bună, {{nume_client}}!</h2><p>Abonamentul tău a fost modificat.</p>" },
  invoice_issued: { subject: "Factura #{{nr_factura}} a fost emisă", body: "<h2>Bună, {{nume_client}}!</h2><p>Factura #{{nr_factura}} — Total: {{total_comanda}} RON</p>" },
};

function renderPreview(html: string) {
  let rendered = html || "";
  for (const [key, val] of Object.entries(SAMPLE_DATA)) {
    rendered = rendered.split(key).join(val);
  }
  return rendered;
}

export default function AdminEmailTemplates() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  const [sendingTest, setSendingTest] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notification_templates").select("*").eq("channel", "email").order("key");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (t: any) => {
      const { error } = await supabase.from("notification_templates").update({
        subject_template: t.subject_template,
        body_template: t.body_template,
        is_active: t.is_active,
      }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      setEditing(null);
      toast({ title: "Șablon salvat" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("notification_templates").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-templates"] }),
  });

  const insertVariable = (varKey: string) => {
    if (!editing) return;
    const textarea = bodyRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = editing.body_template || "";
      const newText = text.substring(0, start) + varKey + text.substring(end);
      setEditing({ ...editing, body_template: newText });
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + varKey.length;
      }, 0);
    } else {
      setEditing({ ...editing, body_template: (editing.body_template || "") + varKey });
    }
  };

  const resetToDefault = () => {
    if (!editing) return;
    const def = DEFAULT_TEMPLATES[editing.key];
    if (def) {
      setEditing({ ...editing, subject_template: def.subject, body_template: def.body });
      toast({ title: "Resetat la template implicit" });
    }
  };

  const sendTestEmail = async () => {
    if (!editing) return;
    setSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: { type: "test", to: "admin@test.com", data: { message: `Test: ${editing.name}\n\nSubiect: ${editing.subject_template}` } },
      });
      if (error) throw error;
      toast({ title: "Email de test trimis!" });
    } catch {
      toast({ title: "Eroare la trimitere", variant: "destructive" });
    }
    setSendingTest(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Mail className="w-5 h-5" /> Șabloane Email Tranzacționale</h1>
        <p className="text-sm text-muted-foreground">Editare template-uri email. Click pe variabile pentru a le insera în corp.</p>
      </div>
      <div className="grid gap-3">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Se încarcă...</p>
        ) : templates.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nu sunt șabloane email configurate.</CardContent></Card>
        ) : templates.map((t: any) => (
          <Card key={t.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <Badge variant="outline" className="text-[10px] font-mono">{t.key}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Subiect: {t.subject_template || "—"}</p>
              </div>
              <Switch
                checked={t.is_active}
                onCheckedChange={(v) => toggleMutation.mutate({ id: t.id, is_active: v })}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing({ ...t }); setEditorTab("edit"); }}>
                <Edit className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editare: {editing.name}</DialogTitle></DialogHeader>

            {/* Variable chips */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Variabile disponibile (click pentru inserare):</Label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-colors font-mono"
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div><Label>Subiect</Label><Input value={editing.subject_template || ""} onChange={e => setEditing({ ...editing, subject_template: e.target.value })} /></div>

              <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as "edit" | "preview")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit"><Edit className="w-3 h-3 mr-1" />Editor</TabsTrigger>
                  <TabsTrigger value="preview"><Eye className="w-3 h-3 mr-1" />Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <Label>Corp email (HTML)</Label>
                  <Textarea
                    ref={bodyRef}
                    value={editing.body_template || ""}
                    onChange={e => setEditing({ ...editing, body_template: e.target.value })}
                    rows={12}
                    className="font-mono text-xs"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="border rounded-md p-4 bg-white min-h-[200px]">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">Subiect: {renderPreview(editing.subject_template || "")}</p>
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: renderPreview(editing.body_template || "") }}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label className="text-sm">{editing.is_active ? "Activ" : "Dezactivat"}</Label>
              </div>
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={resetToDefault}><RotateCcw className="w-3 h-3 mr-1" />Reset implicit</Button>
              <Button variant="outline" size="sm" onClick={sendTestEmail} disabled={sendingTest}>
                <Send className="w-3 h-3 mr-1" />{sendingTest ? "Se trimite..." : "Trimite test"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
