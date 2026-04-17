import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

export default function AdminStockTransfers() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("warehouses").select("id, name, is_active").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, sku").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: transfers = [], refetch } = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_transfers")
        .select("*, products(name, sku), from_wh:warehouses!stock_transfers_from_warehouse_id_fkey(name), to_wh:warehouses!stock_transfers_to_warehouse_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const handleTransfer = async () => {
    const qty = parseInt(quantity);
    if (!fromWarehouse || !toWarehouse || !productId || !qty || qty <= 0) {
      toast.error("Completează toate câmpurile"); return;
    }
    if (fromWarehouse === toWarehouse) {
      toast.error("Depozitele trebuie să fie diferite"); return;
    }

    setSubmitting(true);

    // Check source stock
    const { data: srcStock } = await supabase
      .from("warehouse_stock")
      .select("quantity")
      .eq("warehouse_id", fromWarehouse)
      .eq("product_id", productId)
      .maybeSingle();

    if (!srcStock || srcStock.quantity < qty) {
      toast.error(`Stoc insuficient în depozitul sursă (disponibil: ${srcStock?.quantity ?? 0})`);
      setSubmitting(false); return;
    }

    const product = products.find(p => p.id === productId);

    // Decrement source
    await supabase.from("warehouse_stock").update({ quantity: srcStock.quantity - qty }).eq("warehouse_id", fromWarehouse).eq("product_id", productId);

    // Increment destination (upsert)
    const { data: destStock } = await supabase
      .from("warehouse_stock")
      .select("quantity")
      .eq("warehouse_id", toWarehouse)
      .eq("product_id", productId)
      .maybeSingle();

    if (destStock) {
      await supabase.from("warehouse_stock").update({ quantity: destStock.quantity + qty }).eq("warehouse_id", toWarehouse).eq("product_id", productId);
    } else {
      await supabase.from("warehouse_stock").insert({ warehouse_id: toWarehouse, product_id: productId, quantity: qty });
    }

    // Log transfer
    await supabase.from("stock_transfers").insert({
      product_id: productId,
      from_warehouse_id: fromWarehouse,
      to_warehouse_id: toWarehouse,
      quantity: qty,
      sku: product?.sku || null,
      notes: notes || null,
      transferred_by: user?.id,
    });

    toast.success(`${qty} buc transferate cu succes!`);
    setDialogOpen(false);
    setFromWarehouse(""); setToWarehouse(""); setProductId(""); setQuantity(""); setNotes("");
    setSubmitting(false);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ArrowLeftRight className="w-5 h-5" /> Transferuri Stoc</h1>
          <p className="text-sm text-muted-foreground">Transfer produse între depozite. {warehouses.length} depozite active.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Transfer nou</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Din depozit</TableHead>
                <TableHead>În depozit</TableHead>
                <TableHead className="text-right">Cantitate</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nu au fost efectuate transferuri.</TableCell></TableRow>
              ) : transfers.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm">{t.products?.name || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.sku || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{t.from_wh?.name || "?"}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{t.to_wh?.name || "?"}</Badge></TableCell>
                  <TableCell className="text-right font-bold">{t.quantity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.notes || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ro })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer nou de stoc</DialogTitle>
            <DialogDescription>Mută produse între depozite.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Produs</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Selectează produs" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Din depozit</Label>
              <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                <SelectTrigger><SelectValue placeholder="Depozit sursă" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>În depozit</Label>
              <Select value={toWarehouse} onValueChange={setToWarehouse}>
                <SelectTrigger><SelectValue placeholder="Depozit destinație" /></SelectTrigger>
                <SelectContent>
                  {warehouses.filter(w => w.id !== fromWarehouse).map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cantitate</Label>
              <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="10" />
            </div>
            <div>
              <Label>Note (opțional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motiv transfer..." />
            </div>
            <Button className="w-full" onClick={handleTransfer} disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se transferă...</> : <><ArrowLeftRight className="w-4 h-4 mr-2" /> Transferă</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
