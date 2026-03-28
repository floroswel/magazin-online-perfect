import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RotateCcw, Upload, X, Package, ArrowLeftRight, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface ReturnReason {
  id: string;
  text: string;
  image_requirement: "disabled" | "optional" | "required";
}

interface ReturnSettings {
  enabled: boolean;
  return_window_days: number;
  allow_same_product_exchange: boolean;
  allow_different_product_exchange: boolean;
  allow_partial_returns: boolean;
  return_reasons: ReturnReason[];
  courier_pickup: string;
  allow_bank_refund: boolean;
  return_shipping_cost: number;
  exchange_shipping_cost: number;
  auto_approve: boolean;
}

interface ReturnRequestFormProps {
  order: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export default function ReturnRequestForm({ order, open, onClose, onSuccess, userId }: ReturnRequestFormProps) {
  const [settings, setSettings] = useState<ReturnSettings | null>(null);
  const [step, setStep] = useState(1);
  const [returnType, setReturnType] = useState<string>("return");
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number; reasonId: string; reasonText: string; photos: File[] }>>({});
  const [observation, setObservation] = useState("");
  const [refundMethod, setRefundMethod] = useState("bank");
  const [bankHolder, setBankHolder] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [courierChoice, setCourierChoice] = useState("customer");
  const [pickupAddress, setPickupAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const orderItems = order?.order_items || (order?.items as any[] || []);

  useEffect(() => {
    if (open) {
      (supabase as any).from("return_form_settings").select("*").limit(1).single().then(({ data }: any) => {
        if (data) {
          setSettings({
            ...data,
            return_reasons: Array.isArray(data.return_reasons) ? data.return_reasons : [],
          });
        }
      });
      setStep(1);
      setSelectedItems({});
      setObservation("");
      setReturnType("return");
      if (order?.shipping_address) setPickupAddress(order.shipping_address);
    }
  }, [open]);

  const selectedCount = Object.values(selectedItems).filter((i) => i.selected).length;

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
        quantity: prev[itemId]?.quantity || 1,
        reasonId: prev[itemId]?.reasonId || "",
        reasonText: prev[itemId]?.reasonText || "",
        photos: prev[itemId]?.photos || [],
      },
    }));
  };

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // Create return request using existing `returns` table
      const { data: returnReq, error } = await (supabase as any).from("returns").insert({
        order_id: order.id,
        user_id: userId,
        customer_id: userId,
        type: returnType,
        status: settings?.auto_approve ? "approved" : "pending",
        auto_approved: settings?.auto_approve || false,
        reason: Object.values(selectedItems).filter((i) => i.selected).map((i) => i.reasonText).join(", "),
        details: observation,
        refund_method: returnType === "return" ? refundMethod : "none",
        bank_account_holder: refundMethod === "bank" ? bankHolder : null,
        bank_iban: refundMethod === "bank" ? bankIban : null,
        bank_name: refundMethod === "bank" ? bankName : null,
        courier_pickup_by: courierChoice,
        pickup_address: pickupAddress || null,
        return_shipping_cost_calculated: returnType === "return" ? (settings?.return_shipping_cost || 0) : (settings?.exchange_shipping_cost || 0),
      }).select().single();

      if (error) throw error;

      // Create return items
      const items = Object.entries(selectedItems)
        .filter(([_, v]) => v.selected)
        .map(([itemId, v]) => {
          const orderItem = orderItems.find((oi: any) => (oi.id || oi.product_id) === itemId);
          return {
            return_request_id: returnReq.id,
            order_item_id: itemId,
            product_id: orderItem?.product_id || itemId,
            product_name: orderItem?.product_name || orderItem?.name || "Produs",
            quantity: v.quantity,
            return_reason_id: v.reasonId,
            return_reason_text: v.reasonText,
            unit_price: orderItem?.unit_price || orderItem?.price || 0,
            total_value: (orderItem?.unit_price || orderItem?.price || 0) * v.quantity,
          };
        });

      if (items.length > 0) {
        await (supabase as any).from("return_request_items").insert(items);
      }

      // Upload photos
      for (const [itemId, v] of Object.entries(selectedItems)) {
        if (!v.selected || !v.photos.length) continue;
        for (const photo of v.photos) {
          const path = `${returnReq.id}/${itemId}/${Date.now()}_${photo.name}`;
          const { error: uploadErr } = await supabase.storage.from("return-request-images").upload(path, photo);
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("return-request-images").getPublicUrl(path);
            await (supabase as any).from("return_request_images").insert({
              return_request_id: returnReq.id,
              return_item_id: null,
              storage_path: path,
              public_url: urlData.publicUrl,
              original_filename: photo.name,
              file_size: photo.size,
            });
          }
        }
      }

      toast.success(settings?.auto_approve ? "Cererea de retur a fost aprobată automat!" : "Cererea de retur a fost trimisă!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Eroare: " + (err.message || "A apărut o eroare"));
    }
    setSubmitting(false);
  }

  if (!settings) return null;

  if (!settings.enabled) {
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5" /> Retur indisponibil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Funcționalitatea de retur nu este activă momentan. Te rugăm să ne contactezi la adresa de email pentru a solicita un retur.</p>
          <DialogFooter><Button onClick={onClose}>Închide</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const reasons = settings.return_reasons || [];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5" />Formular Retur — Comanda #{order?.id?.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* STEP 1 - Select products */}
        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Pas 1 — Selectează produsele</h3>
            {orderItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nu există produse în această comandă.</p>
            ) : (
              orderItems.map((item: any) => {
                const itemId = item.id || item.product_id;
                const sel = selectedItems[itemId];
                return (
                  <div key={itemId} className="flex items-center gap-3 border rounded-md p-3">
                    <Checkbox checked={sel?.selected || false} onCheckedChange={() => toggleItem(itemId)} />
                    {(item.image_url || item.product_image) && (
                      <img src={item.image_url || item.product_image} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product_name || item.name}</p>
                      <p className="text-xs text-muted-foreground">{Number(item.unit_price || item.price || 0).toFixed(2)} RON × {item.quantity || 1}</p>
                    </div>
                    {sel?.selected && settings.allow_partial_returns && (
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Cant:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={item.quantity || 1}
                          value={sel.quantity}
                          onChange={(e) => setSelectedItems((p) => ({ ...p, [itemId]: { ...p[itemId], quantity: Math.min(parseInt(e.target.value) || 1, item.quantity || 1) } }))}
                          className="w-16 h-8"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* STEP 2 - Reasons */}
        {step === 2 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Pas 2 — Motivul returului</h3>
            {Object.entries(selectedItems).filter(([_, v]) => v.selected).map(([itemId, v]) => {
              const item = orderItems.find((oi: any) => (oi.id || oi.product_id) === itemId);
              const selectedReason = reasons.find((r) => r.id === v.reasonId);
              return (
                <div key={itemId} className="border rounded-md p-3 space-y-2">
                  <p className="text-sm font-medium">{item?.product_name || item?.name}</p>
                  <Select value={v.reasonId} onValueChange={(val) => {
                    const r = reasons.find((rr) => rr.id === val);
                    setSelectedItems((p) => ({ ...p, [itemId]: { ...p[itemId], reasonId: val, reasonText: r?.text || "" } }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selectează motivul..." /></SelectTrigger>
                    <SelectContent>
                      {reasons.map((r) => <SelectItem key={r.id} value={r.id}>{r.text}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedReason && selectedReason.image_requirement !== "disabled" && (
                    <div>
                      <Label className="text-xs">{selectedReason.image_requirement === "required" ? "Imagine obligatorie *" : "Imagine opțională"}</Label>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []).filter((f) => f.size <= 5 * 1024 * 1024);
                          setSelectedItems((p) => ({ ...p, [itemId]: { ...p[itemId], photos: [...(p[itemId]?.photos || []), ...files] } }));
                        }}
                        className="mt-1"
                      />
                      {v.photos.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {v.photos.map((f, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {f.name}
                              <button onClick={() => setSelectedItems((p) => ({ ...p, [itemId]: { ...p[itemId], photos: p[itemId].photos.filter((_, j) => j !== i) } }))} className="ml-1"><X className="w-3 h-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div>
              <Label>Observații (opțional)</Label>
              <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} maxLength={500} rows={3} />
            </div>
          </div>
        )}

        {/* STEP 3 - Type */}
        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Pas 3 — Tipul solicitării</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                <input type="radio" checked={returnType === "return"} onChange={() => setReturnType("return")} />
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">Retur (rambursare)</span>
              </label>
              {settings.allow_same_product_exchange && (
                <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                  <input type="radio" checked={returnType === "same_exchange"} onChange={() => setReturnType("same_exchange")} />
                  <ArrowLeftRight className="w-4 h-4" />
                  <span className="text-sm">Schimb cu același produs</span>
                </label>
              )}
              {settings.allow_different_product_exchange && (
                <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                  <input type="radio" checked={returnType === "different_exchange"} onChange={() => setReturnType("different_exchange")} />
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Schimb cu alt produs</span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 - Refund method */}
        {step === 4 && returnType === "return" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Pas 4 — Metoda de rambursare</h3>
            {settings.allow_bank_refund && (
              <label className="flex items-start gap-3 border rounded-md p-3 cursor-pointer">
                <input type="radio" checked={refundMethod === "bank"} onChange={() => setRefundMethod("bank")} className="mt-1" />
                <div className="flex-1 space-y-2">
                  <span className="text-sm font-medium">Rambursare în cont bancar</span>
                  {refundMethod === "bank" && (
                    <div className="space-y-2">
                      <Input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="Titular cont" />
                      <Input value={bankIban} onChange={(e) => setBankIban(e.target.value)} placeholder="IBAN (RO...)" />
                      <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Banca" />
                    </div>
                  )}
                </div>
              </label>
            )}
            <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
              <input type="radio" checked={refundMethod === "wallet"} onChange={() => setRefundMethod("wallet")} />
              <span className="text-sm">Rambursare în Wallet</span>
            </label>
          </div>
        )}

        {/* STEP 5 - Courier */}
        {step === 5 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Pas 5 — Ridicare colet</h3>
            {settings.courier_pickup === "customer_choice" ? (
              <div className="space-y-2">
                <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                  <input type="radio" checked={courierChoice === "customer"} onChange={() => setCourierChoice("customer")} />
                  <span className="text-sm">Eu voi trimite coletul</span>
                </label>
                <label className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                  <input type="radio" checked={courierChoice === "merchant"} onChange={() => setCourierChoice("merchant")} />
                  <span className="text-sm">Vă rog să trimiteți un curier la adresa mea</span>
                </label>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {settings.courier_pickup === "customer" ? "Veți trimite coletul prin curier propriu." : "Vom trimite un curier pentru ridicarea coletului."}
              </p>
            )}
            <div>
              <Label>Adresa ridicare</Label>
              <Textarea value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} rows={2} />
            </div>
          </div>
        )}

        {/* STEP 6 - Confirm */}
        {step === 6 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Pas 6 — Confirmare</h3>
            <div className="border rounded-md p-3 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Tip:</span> {returnType === "return" ? "Retur" : returnType === "same_exchange" ? "Schimb același produs" : "Schimb alt produs"}</p>
              <p><span className="text-muted-foreground">Produse:</span> {selectedCount} produs(e)</p>
              {returnType === "return" && <p><span className="text-muted-foreground">Rambursare:</span> {refundMethod === "bank" ? "Cont bancar" : "Wallet"}</p>}
              {(settings.return_shipping_cost > 0 || settings.exchange_shipping_cost > 0) && (
                <p><span className="text-muted-foreground">Cost transport retur:</span> {(returnType === "return" ? settings.return_shipping_cost : settings.exchange_shipping_cost).toFixed(2)} RON</p>
              )}
              {observation && <p><span className="text-muted-foreground">Observații:</span> {observation}</p>}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between gap-2">
          <div>
            {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="w-4 h-4 mr-1" />Înapoi</Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Anulează</Button>
            {step < 6 ? (
              <Button
                onClick={() => {
                  // Skip step 4 if not return type
                  if (step === 3 && returnType !== "return") setStep(5);
                  else setStep(step + 1);
                }}
                disabled={step === 1 && selectedCount === 0}
              >
                Continuă<ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Se trimite..." : "Trimite cererea"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
