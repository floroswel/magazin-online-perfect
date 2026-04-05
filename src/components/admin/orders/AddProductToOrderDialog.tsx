import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Plus, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  existingProductIds: string[];
}

export default function AddProductToOrderDialog({ open, onOpenChange, orderId, existingProductIds }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const like = `%${q.trim()}%`;
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, price, image_url, stock")
      .or(`name.ilike.${like},sku.ilike.${like}`)
      .limit(10);
    setResults(data || []);
    setSearching(false);
  }, []);

  const addProduct = async (product: any) => {
    setAdding(product.id);
    try {
      // Check if product already exists in order
      if (existingProductIds.includes(product.id)) {
        // Increment quantity of existing item
        const { data: existingItem } = await supabase
          .from("order_items")
          .select("id, quantity")
          .eq("order_id", orderId)
          .eq("product_id", product.id)
          .maybeSingle();
        if (existingItem) {
          await supabase.from("order_items").update({ quantity: existingItem.quantity + 1 }).eq("id", existingItem.id);
        }
      } else {
        await supabase.from("order_items").insert({
          order_id: orderId,
          product_id: product.id,
          quantity: 1,
          price: product.price,
        });
      }

      // Recalculate order total
      const { data: allItems } = await supabase
        .from("order_items")
        .select("price, quantity")
        .eq("order_id", orderId);
      const newSubtotal = (allItems || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);

      const { data: orderData } = await supabase.from("orders").select("shipping_total").eq("id", orderId).single();
      const shippingTotal = Number(orderData?.shipping_total || 0);

      await supabase.from("orders").update({
        subtotal: newSubtotal,
        total: newSubtotal + shippingTotal,
        updated_at: new Date().toISOString(),
      }).eq("id", orderId);

      // Timeline
      await supabase.from("order_timeline").insert({
        order_id: orderId,
        action: "edit",
        note: `Produs adăugat: ${product.name} (${Number(product.price).toFixed(2)} RON)`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["order-timeline", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`"${product.name}" adăugat în comandă`);
    } catch (err: any) {
      toast.error("Eroare: " + (err.message || "Necunoscută"));
    }
    setAdding(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) { setSearch(""); setResults([]); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4" /> Adaugă produs în comandă</DialogTitle>
          <DialogDescription>Caută un produs după nume sau SKU și adaugă-l în comandă.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Caută produs (min 2 caractere)..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
          {searching && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {results.length > 0 && (
          <div className="border rounded-md bg-card max-h-72 overflow-y-auto divide-y">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                disabled={adding === p.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-9 h-9 rounded object-cover border" />
                ) : (
                  <div className="w-9 h-9 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">N/A</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.sku || "Fără SKU"} · Stoc: {p.stock ?? "N/A"}
                    {existingProductIds.includes(p.id) && <span className="ml-1 text-primary">(deja în comandă)</span>}
                  </p>
                </div>
                <span className="text-sm font-semibold shrink-0">{Number(p.price).toFixed(2)} RON</span>
                {adding === p.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                ) : (
                  <Plus className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {search.length >= 2 && !searching && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Niciun produs găsit pentru „{search}"</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
