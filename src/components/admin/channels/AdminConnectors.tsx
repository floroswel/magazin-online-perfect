import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plug, Plus } from "lucide-react";

export default function AdminConnectors() {
  const { data: connectors = [], isLoading } = useQuery({
    queryKey: ["external-connectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("connector_instances").select("*, connectors(name, category, key)").order("installed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
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
              <TableRow><TableHead>Conector</TableHead><TableHead>Categorie</TableHead><TableHead>Status</TableHead><TableHead>Ultima sincronizare</TableHead><TableHead>Erori</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Se încarcă...</TableCell></TableRow>
              ) : connectors.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu sunt conectori instalați. Adaugă din App Store.</TableCell></TableRow>
              ) : connectors.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{(c.connectors as any)?.name || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{(c.connectors as any)?.category || "—"}</Badge></TableCell>
                  <TableCell><Badge variant={c.enabled ? "default" : "secondary"} className="text-[10px]">{c.status || "inactiv"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.last_sync_at ? new Date(c.last_sync_at).toLocaleString("ro") : "—"}</TableCell>
                  <TableCell>{c.error_count > 0 ? <Badge variant="destructive" className="text-[10px]">{c.error_count}</Badge> : "0"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
