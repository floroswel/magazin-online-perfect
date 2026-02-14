import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface InventoryRow {
  product_id: string;
  product_name: string;
  system_stock: number;
  counted_stock: string;
  difference: number;
}

export default function AdminInventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<{ id: string; name: string; stock: number }[]>([]);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("products").select("id, name, stock").order("name");
      if (data) setProducts(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateCount = (id: string, val: string) => {
    setCounts((prev) => ({ ...prev, [id]: val }));
  };

  const rows: InventoryRow[] = products.map((p) => ({
    product_id: p.id,
    product_name: p.name,
    system_stock: p.stock,
    counted_stock: counts[p.id] ?? "",
    difference: counts[p.id] ? parseInt(counts[p.id]) - p.stock : 0,
  }));

  const changedRows = rows.filter((r) => r.counted_stock !== "" && r.difference !== 0);

  const saveInventory = async () => {
    if (changedRows.length === 0) { toast.info("Nicio diferență de reconciliat"); return; }
    setSaving(true);

    const { data: defaultWh } = await supabase.from("warehouses").select("id").eq("is_default", true).maybeSingle();
    const warehouseId = defaultWh?.id;

    for (const row of changedRows) {
      // Update products.stock
      await supabase.from("products").update({ stock: parseInt(row.counted_stock) }).eq("id", row.product_id);

      // Record adjustment movement
      if (warehouseId) {
        await supabase.from("stock_movements").insert({
          product_id: row.product_id,
          warehouse_id: warehouseId,
          movement_type: "adjustment",
          quantity: Math.abs(row.difference),
          notes: `Inventar: ${row.system_stock} → ${row.counted_stock} (diferență: ${row.difference > 0 ? "+" : ""}${row.difference})`,
          created_by: user!.id,
        });

        // Update warehouse_stock
        const { data: ws } = await supabase.from("warehouse_stock")
          .select("id").eq("warehouse_id", warehouseId).eq("product_id", row.product_id).maybeSingle();
        if (ws) {
          await supabase.from("warehouse_stock").update({ quantity: parseInt(row.counted_stock) }).eq("id", ws.id);
        }
      }
    }

    toast.success(`${changedRows.length} produse reconciliate!`);
    setCounts({});
    setSaving(false);

    // Refresh
    const { data } = await supabase.from("products").select("id, name, stock").order("name");
    if (data) setProducts(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventar</h1>
          <p className="text-sm text-muted-foreground">Proces de inventariere — introdu cantitățile reale și reconciliază diferențele</p>
        </div>
        <Button onClick={saveInventory} disabled={saving || changedRows.length === 0}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Se salvează..." : `Reconciliază (${changedRows.length})`}
        </Button>
      </div>

      {changedRows.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-400">
              ⚠️ {changedRows.length} produse cu diferențe de stoc. Apasă „Reconciliază" pentru a actualiza.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nu există produse pentru inventar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Produs</TableHead>
                  <TableHead className="text-right">Stoc sistem</TableHead>
                  <TableHead className="text-right w-[120px]">Stoc real</TableHead>
                  <TableHead className="text-right">Diferență</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.product_id} className="border-border">
                    <TableCell className="font-medium">{r.product_name}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{r.system_stock}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        className="w-[100px] ml-auto text-right font-mono"
                        placeholder="—"
                        value={r.counted_stock}
                        onChange={(e) => updateCount(r.product_id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.counted_stock !== "" && r.difference !== 0 ? (
                        <Badge className={r.difference > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {r.difference > 0 ? "+" : ""}{r.difference}
                        </Badge>
                      ) : r.counted_stock !== "" ? (
                        <Badge className="bg-primary/20 text-primary">OK</Badge>
                      ) : null}
                    </TableCell>
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
