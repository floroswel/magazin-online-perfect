import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Trash2, ShoppingCart, Loader2 } from "lucide-react";

interface OrderLine {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManualOrderDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Customer info
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCounty, setShippingCounty] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ramburs");
  const [notes, setNotes] = useState("");

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const [shippingCost, setShippingCost] = useState(0);
  const total = subtotal + shippingCost;

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
    if (q.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const like = `%${q.trim()}%`;
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, price, image_url, stock")
      .or(`name.ilike.${like},sku.ilike.${like}`)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  }, []);

  const addProduct = (p: any) => {
    const existing = lines.find(l => l.product_id === p.id);
    if (existing) {
      setLines(lines.map(l => l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l));
    } else {
      setLines([...lines, {
        product_id: p.id,
        name: p.name,
        sku: p.sku || "",
        price: Number(p.price),
        quantity: 1,
        image_url: p.image_url,
      }]);
    }
    setSearch("");
    setSearchResults([]);
  };

  const updateQty = (pid: string, qty: number) => {
    if (qty < 1) return;
    setLines(lines.map(l => l.product_id === pid ? { ...l, quantity: qty } : l));
  };

  const updatePrice = (pid: string, price: number) => {
    setLines(lines.map(l => l.product_id === pid ? { ...l, price } : l));
  };

  const removeLine = (pid: string) => {
    setLines(lines.filter(l => l.product_id !== pid));
  };

  const resetForm = () => {
    setLines([]);
    setSearch("");
    setSearchResults([]);
    setCustomerEmail("");
    setCustomerName("");
    setCustomerPhone("");
    setShippingAddress("");
    setShippingCity("");
    setShippingCounty("");
    setPaymentMethod("ramburs");
    setNotes("");
    setShippingCost(0);
  };

  const handleSave = async () => {
    if (lines.length === 0) {
      toast.error("Adaugă cel puțin un produs.");
      return;
    }
    if (!customerEmail.trim() && !customerName.trim()) {
      toast.error("Completează emailul sau numele clientului.");
      return;
    }

    setSaving(true);
    try {
      const orderNumber = `MAN-${Date.now().toString(36).toUpperCase()}`;

      // Lookup existing user by email from previous orders
      let resolvedUserId = "00000000-0000-0000-0000-000000000000";
      if (customerEmail.trim()) {
        const emailLower = customerEmail.trim().toLowerCase();
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("user_id")
          .eq("user_email", emailLower)
          .neq("user_id", "00000000-0000-0000-0000-000000000000")
          .limit(1)
          .maybeSingle();
        if (existingOrder?.user_id) {
          resolvedUserId = existingOrder.user_id;
        }
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: resolvedUserId,
          status: "pending",
          total,
          subtotal,
          shipping_total: shippingCost,
          discount_total: 0,
          tax_total: 0,
          user_email: customerEmail || null,
          order_number: orderNumber,
          payment_method: paymentMethod,
          source: "manual",
          notes: notes || null,
          shipping_address: {
            fullName: customerName,
            phone: customerPhone,
            address: shippingAddress,
            city: shippingCity,
            county: shippingCounty,
          },
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      const items = lines.map(l => ({
        order_id: order.id,
        product_id: l.product_id,
        quantity: l.quantity,
        price: l.price,
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsErr) throw itemsErr;

      toast.success(`Comanda ${orderNumber} a fost creată cu succes!`);
      queryClient.invalidateQueries({ queryKey: ["admin-dash"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Eroare la salvare: " + (err.message || "Necunoscută"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Comandă manuală
          </DialogTitle>
          <DialogDescription>Creează o comandă nouă introducând datele clientului și produsele.</DialogDescription>
        </DialogHeader>

        {/* Product search */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Produse</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Caută produs după nume sau SKU (min 3 caractere)..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
            {searching && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-md bg-card max-h-48 overflow-y-auto divide-y">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">N/A</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku || "Fără SKU"} · Stoc: {p.stock ?? "N/A"}</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{Number(p.price).toFixed(2)} RON</span>
                  <Plus className="w-4 h-4 text-primary shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Order lines */}
          {lines.length > 0 && (
            <div className="border rounded-md divide-y">
              {lines.map((l) => (
                <div key={l.product_id} className="flex items-center gap-2 px-3 py-2">
                  {l.image_url ? (
                    <img src={l.image_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.sku}</p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => updateQty(l.product_id, parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-center text-sm"
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={l.price}
                    onChange={(e) => updatePrice(l.product_id, parseFloat(e.target.value) || 0)}
                    className="w-24 h-8 text-sm text-right"
                  />
                  <span className="text-xs text-muted-foreground">RON</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLine(l.product_id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-between items-center px-3 py-2 bg-muted/30">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-bold">{subtotal.toFixed(2)} RON</span>
              </div>
            </div>
          )}
        </div>

        {/* Customer info */}
        <div className="space-y-3 border-t pt-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Date client</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nume complet</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ion Popescu" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@exemplu.ro" />
            </div>
            <div>
              <Label className="text-xs">Telefon</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="07xx xxx xxx" />
            </div>
            <div>
              <Label className="text-xs">Metodă plată</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ramburs">Ramburs</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer bancar</SelectItem>
                  <SelectItem value="mokka">Mokka (rate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="space-y-3 border-t pt-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Adresă livrare</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Str. Exemplu nr. 10, bl. A, ap. 5" />
            </div>
            <div>
              <Input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="Oraș" />
            </div>
            <div>
              <Input value={shippingCounty} onChange={(e) => setShippingCounty(e.target.value)} placeholder="Județ" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0">Cost livrare (RON):</Label>
            <Input
              type="number"
              step="0.01"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              className="w-28 h-8"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 border-t pt-3">
          <Label className="text-xs">Note interne</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observații..." rows={2} />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t pt-3">
          <div>
            <Badge variant="outline" className="text-sm">
              {lines.length} {lines.length === 1 ? "produs" : "produse"}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total comandă</p>
            <p className="text-xl font-bold text-foreground">{total.toFixed(2)} RON</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={saving}>Anulează</Button>
          <Button onClick={handleSave} disabled={saving || lines.length === 0} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            Creează comanda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
