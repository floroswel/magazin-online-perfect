import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plug, Plus, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminConnectors() {
  const queryClient = useQueryClient();

  const { data: connectors = [], isLoading } = useQuery({
    queryKey: ["external-connectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("connector_instances").select("*, connectors(name, category, key)").order("installed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("connector_instances").update({ enabled, status: enabled ? "active" : "inactive" }).eq("id", id);
      if (error) throw error;
      toast({ title: enabled ? "Conector activat" : "Conector dezactivat" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["external-connectors"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Plug className="w-5 h-5" /> Conectori Externi</h1>
          <p className="text-sm text-muted-foreground">Gestionare webhooks și integrări terțe instalate.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Conector nou</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Conector</TableHead><TableHead>Categorie</TableHead><TableHead>Status</TableHead><TableHead>Ultima sincronizare</TableHead><TableHead>Erori</TableHead><TableHead>Activ</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : connectors.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nu sunt conectori instalați. Adaugă din App Store.</TableCell></TableRow>
              ) : connectors.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{(c.connectors as any)?.name || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{(c.connectors as any)?.category || "—"}</Badge></TableCell>
                  <TableCell><Badge variant={c.enabled ? "default" : "secondary"} className="text-[10px]">{c.status || "inactiv"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.last_sync_at ? new Date(c.last_sync_at).toLocaleString("ro") : "—"}</TableCell>
                  <TableCell>{c.error_count > 0 ? <Badge variant="destructive" className="text-[10px]">{c.error_count}</Badge> : "0"}</TableCell>
                  <TableCell>
                    <Switch checked={c.enabled} onCheckedChange={(checked) => toggleMutation.mutate({ id: c.id, enabled: checked })} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
