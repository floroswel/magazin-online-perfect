import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RotateCcw, Upload, X, Package, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

const RETURN_REASONS = [
  "Produs defect",
  "Produs incorect",
  "Nu corespunde descrierii",
  "M-am răzgândit",
  "Dimensiune/Culoare greșită",
  "Ambalaj deteriorat",
  "Altul",
];

interface ReturnRequestFormProps {
  order: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function ReturnRequestForm({ order, open, onClose, onSuccess, userId }: ReturnRequestFormProps) {
  const [returnType, setReturnType] = useState<"return" | "exchange">("return");
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number; exchangeProductId?: string }>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"items" | "details" | "confirm">("items");

  const orderItems = order?.order_items || [];

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
        quantity: prev[itemId]?.quantity || 1,
      },
    }));
  };

  const setItemQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: Math.max(1, qty) },
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast.error("Maxim 3 fotografii");
      return;
    }
    setPhotos(prev => [...prev, ...files].slice(0, 3));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const selectedCount = Object.values(selectedItems).filter(i => i.selected).length;

  const handleSubmit = async () => {
    if (!reason || selectedCount === 0) return;
    setSubmitting(true);

    try {
      // Upload photos
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("return-photos").upload(path, photo);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("return-photos").getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
      }

      // Create return request
      const { data: returnData, error: returnError } = await supabase.from("returns").insert({
        order_id: order.id,
        user_id: userId,
        type: returnType,
        reason,
        details: explanation || null,
        photos: uploadedUrls,
        items: [],
        refund_amount: 0,
      } as any).select().single();

      if (returnError) throw returnError;

      // Create return request items
      const items = Object.entries(selectedItems)
        .filter(([, v]) => v.selected)
        .map(([itemId, v]) => {
          const orderItem = orderItems.find((oi: any) => oi.id === itemId);
          return {
            return_request_id: (returnData as any).id,
            order_item_id: itemId,
            product_id: orderItem?.product_id || null,
            product_name: orderItem?.products?.name || "Produs",
            quantity: v.quantity,
            exchange_product_id: v.exchangeProductId || null,
          };
        });

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from("return_request_items").insert(items as any);
        if (itemsError) console.error("Items insert error:", itemsError);
      }

      toast.success("Cererea de retur a fost trimisă cu succes!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Eroare la trimiterea cererii");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Solicită retur
          </DialogTitle>
          <DialogDescription>
            Comanda #{order?.id?.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs">
          {["Produse", "Detalii", "Confirmare"].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === ["items", "details", "confirm"].indexOf(step)
                  ? "bg-primary text-primary-foreground"
                  : i < ["items", "details", "confirm"].indexOf(step)
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <span className={i === ["items", "details", "confirm"].indexOf(step) ? "font-semibold text-foreground" : "text-muted-foreground"}>{s}</span>
              {i < 2 && <span className="text-muted-foreground mx-1">→</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Select products */}
        {step === "items" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Selectează produsele pe care vrei să le returnezi:</p>
            {orderItems.map((item: any) => {
              const sel = selectedItems[item.id];
              return (
                <div key={item.id} className={`border rounded-lg p-3 transition-colors ${sel?.selected ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={sel?.selected || false}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.products?.images?.[0] ? (
                        <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.products?.name || "Produs"}</p>
                      <p className="text-xs text-muted-foreground">Cantitate comandată: {item.quantity}</p>
                    </div>
                  </div>
                  {sel?.selected && (
                    <div className="mt-2 pl-9 flex items-center gap-2">
                      <Label className="text-xs">Cantitate retur:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={sel.quantity}
                        onChange={(e) => setItemQty(item.id, Math.min(item.quantity, parseInt(e.target.value) || 1))}
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <div className="space-y-4">
            {/* Return type */}
            <div>
              <Label>Tip cerere *</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={returnType === "return" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setReturnType("return")}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Rambursare bani
                </Button>
                <Button
                  variant={returnType === "exchange" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setReturnType("exchange")}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Schimb produs
                </Button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label>Motivul returului *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Selectează motivul" /></SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Explanation */}
            <div>
              <Label>Explicație (opțional)</Label>
              <Textarea
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Descrie problema în detaliu..."
              />
            </div>

            {/* Photos */}
            <div>
              <Label>Fotografii (opțional, max 3)</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-16 h-16 rounded border border-border overflow-hidden">
                    <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <label className="w-16 h-16 rounded border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tip cerere:</span>
                <Badge variant="outline">{returnType === "return" ? "Rambursare" : "Schimb produs"}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Motiv:</span>
                <span className="font-medium">{reason}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Produse:</span>
                <span className="font-medium">{selectedCount} produs(e)</span>
              </div>
              {photos.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fotografii:</span>
                  <span className="font-medium">{photos.length}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">Produse selectate:</p>
              {Object.entries(selectedItems)
                .filter(([, v]) => v.selected)
                .map(([itemId, v]) => {
                  const item = orderItems.find((oi: any) => oi.id === itemId);
                  return (
                    <div key={itemId} className="flex items-center gap-2 text-sm">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      <span>{item?.products?.name || "Produs"}</span>
                      <span className="text-muted-foreground">× {v.quantity}</span>
                    </div>
                  );
                })}
            </div>

            <div className="bg-primary/5 rounded-lg p-3 text-sm">
              <p className="font-medium">📋 Instrucțiuni de retur:</p>
              <p className="text-muted-foreground mt-1">
                După aprobarea cererii, veți primi un email cu instrucțiuni detaliate pentru trimiterea produselor înapoi, inclusiv adresa de retur și eventualul AWB pre-generat.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === "items" && (
            <>
              <Button variant="outline" onClick={onClose}>Anulează</Button>
              <Button onClick={() => setStep("details")} disabled={selectedCount === 0}>
                Continuă ({selectedCount} selectat{selectedCount !== 1 ? "e" : ""})
              </Button>
            </>
          )}
          {step === "details" && (
            <>
              <Button variant="outline" onClick={() => setStep("items")}>Înapoi</Button>
              <Button onClick={() => setStep("confirm")} disabled={!reason}>
                Continuă
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("details")}>Înapoi</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Se trimite..." : "Trimite cererea de retur"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
