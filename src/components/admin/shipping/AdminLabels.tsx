import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tag, Printer, Loader2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function AdminLabels() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("shipments")
        .select("id, awb_number, carrier, order_id, status, label_url")
        .not("awb_number", "is", null)
        .order("created_at", { ascending: false })
        .limit(100);
      setShipments(data || []);
      setLoading(false);
    })();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === shipments.length) setSelected(new Set());
    else setSelected(new Set(shipments.map(s => s.id)));
  };

  const handlePrint = () => {
    if (selected.size === 0) { toast({ title: "Selectează cel puțin o etichetă" }); return; }
    const withLabels = shipments.filter(s => selected.has(s.id) && s.label_url);
    if (withLabels.length > 0) {
      withLabels.forEach(s => window.open(s.label_url, "_blank"));
      toast({ title: `Deschis ${withLabels.length} etichete` });
    } else {
      toast({ title: "Niciun AWB nu are etichetă PDF generată", description: "Regenerează AWB-urile din secțiunea comenzi.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Tag className="w-5 h-5" /> Etichete Expediere</h1>
          <p className="text-sm text-muted-foreground">Generare și printare etichete de expediere în masă.</p>
        </div>
        <Button size="sm" onClick={handlePrint} disabled={selected.size === 0}>
          <Printer className="w-4 h-4 mr-1" /> Printează ({selected.size})
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={selected.size === shipments.length && shipments.length > 0} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead>AWB</TableHead>
                  <TableHead>Curier</TableHead>
                  <TableHead>Comandă</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu sunt etichete de printat. Generează AWB-uri mai întâi.</TableCell></TableRow>
                ) : shipments.map(s => (
                  <TableRow key={s.id}>
                    <TableCell><Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></TableCell>
                    <TableCell className="font-mono text-xs">{s.awb_number}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{s.carrier}</Badge></TableCell>
                    <TableCell className="text-xs">{s.order_id.slice(0, 8)}...</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{s.status}</Badge></TableCell>
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
