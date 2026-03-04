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
import { Mail, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function AdminEmailTemplates() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Mail className="w-5 h-5" /> Șabloane Email</h1>
        <p className="text-sm text-muted-foreground">Editare template-uri email tranzacționale. Variabile: {"{{order_id}}, {{customer_name}}, {{total}}"}</p>
      </div>
      <div className="grid gap-3">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Se încarcă...</p>
        ) : templates.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Nu sunt șabloane email configurate. Adaugă-le din Notificări.</CardContent></Card>
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
              <Switch checked={t.is_active} />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ ...t })}>
                <Edit className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editare: {editing.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Subiect</Label><Input value={editing.subject_template || ""} onChange={e => setEditing({ ...editing, subject_template: e.target.value })} /></div>
              <div><Label>Corp email (HTML)</Label><Textarea value={editing.body_template || ""} onChange={e => setEditing({ ...editing, body_template: e.target.value })} rows={10} className="font-mono text-xs" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Se salvează..." : "Salvează"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
