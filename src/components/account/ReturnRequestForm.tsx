import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RotateCcw, Upload, X, Package, ArrowLeftRight, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
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

interface GdprConfig {
  require_consent: boolean;
  consent_text: string;
}

interface ReturnRequestFormProps {
  order: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  guestEmail?: string;
  inline?: boolean;
  gdprConfig?: GdprConfig;
}

function formatAddress(addr: any): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [addr.street, addr.address, addr.city, addr.county, addr.postalCode].filter(Boolean);
  if (addr.fullName) parts.unshift(addr.fullName);
  return parts.join(", ");
}

export default function ReturnRequestForm({ order, open, onClose, onSuccess, userId, guestEmail, inline, gdprConfig }: ReturnRequestFormProps) {
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
  const orderDisplay = order?.order_number || order?.id?.slice(0, 8) || "N/A";

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
      setRefundMethod("bank");
      setBankHolder("");
      setBankIban("");
      setBankName("");
      setCourierChoice("customer");
      if (order?.shipping_address) {
        setPickupAddress(formatAddress(order.shipping_address));
      } else {
        setPickupAddress("");
      }
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

  const isGuest = !!guestEmail;

  // Determine which steps are active
  const needsRefundStep = returnType === "return";
  const totalSteps = needsRefundStep ? 6 : 5;
  
  function getActualStep(displayStep: number): number {
    // When refund step is skipped, map display steps correctly
    if (!needsRefundStep && displayStep >= 4) return displayStep + 1;
    return displayStep;
  }

  function goNext() {
    if (step === 1 && selectedCount === 0) {
      toast.error("Selectează cel puțin un produs.");
      return;
    }
    // Validate step 2: every selected item must have a reason
    if (step === 2) {
      const selectedEntries = Object.entries(selectedItems).filter(([_, v]) => v.selected);
      const missingReason = selectedEntries.some(([_, v]) => !v.reasonId);
      if (missingReason) { toast.error("Selectează un motiv pentru fiecare produs."); return; }
      for (const [_, v] of selectedEntries) {
        const reason = (settings?.return_reasons || []).find(r => r.id === v.reasonId);
        if (reason?.image_requirement === "required" && v.photos.length === 0) {
          toast.error("Încarcă imaginile obligatorii pentru motivul selectat."); return;
        }
      }
    }
    // Validate step 4: IBAN format if bank refund selected
    if (step === 4 && needsRefundStep && refundMethod === "bank") {
      if (!bankHolder.trim()) { toast.error("Completează titularul contului."); return; }
      const cleanIban = bankIban.replace(/\s/g, "").toUpperCase();
      if (!cleanIban || !/^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(cleanIban)) {
        toast.error("IBAN invalid. Formatul corect: RO + 2 cifre + 4 litere bancă + 16 caractere.");
        return;
      }
      if (!bankName.trim()) { toast.error("Completează numele băncii."); return; }
    }
    // Skip step 4 if not return type
    if (step === 3 && !needsRefundStep) {
      setStep(5);
    } else {
      setStep(step + 1);
    }
  }

  function goBack() {
    if (step === 5 && !needsRefundStep) {
      setStep(3);
    } else {
      setStep(step - 1);
    }
  }

  const isLastStep = step === 6;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const selectedEntries = Object.entries(selectedItems).filter(([_, v]) => v.selected);
      if (selectedEntries.length === 0) {
        toast.error("Nu ai selectat niciun produs.");
        setSubmitting(false);
        return;
      }

      if (isGuest) {
        const items = selectedEntries.map(([itemId, v]) => {
          const orderItem = orderItems.find((oi: any) => (oi.id || oi.product_id) === itemId);
          return {
            order_item_id: itemId,
            product_id: orderItem?.product_id || itemId,
            product_name: orderItem?.product_name || orderItem?.name || "Produs",
            quantity: v.quantity,
            reason_id: v.reasonId,
            reason_text: v.reasonText,
            unit_price: orderItem?.unit_price || orderItem?.price || 0,
          };
        });

        const { data, error: fnErr } = await supabase.functions.invoke("guest-return", {
          body: {
            action: "submit",
            order_id: order.id,
            guest_email: guestEmail,
            return_type: returnType,
            items,
            observation,
            refund_method: needsRefundStep ? refundMethod : "none",
            bank_holder: refundMethod === "bank" ? bankHolder : null,
            bank_iban: refundMethod === "bank" ? bankIban.replace(/\s/g, "").toUpperCase() : null,
            bank_name: refundMethod === "bank" ? bankName : null,
            courier_choice: courierChoice,
            pickup_address: pickupAddress || null,
          },
        });

        if (fnErr || data?.error) {
          throw new Error(data?.error || "Eroare la trimiterea cererii");
        }

        toast.success(data?.auto_approved ? "Cererea de retur a fost aprobată automat!" : "Cererea de retur a fost trimisă!");
        onSuccess();
      } else {
        const { data: returnReq, error } = await (supabase as any).from("returns").insert({
          order_id: order.id,
          user_id: userId,
          customer_id: userId,
          type: returnType,
          status: settings?.auto_approve ? "approved" : "pending",
          auto_approved: settings?.auto_approve || false,
          reason: selectedEntries.map(([_, v]) => v.reasonText).join(", "),
          details: observation,
          refund_method: needsRefundStep ? refundMethod : "none",
          bank_account_holder: refundMethod === "bank" ? bankHolder : null,
          bank_iban: refundMethod === "bank" ? bankIban.replace(/\s/g, "").toUpperCase() : null,
          bank_name: refundMethod === "bank" ? bankName : null,
          courier_pickup_by: courierChoice,
          pickup_address: pickupAddress || null,
          return_shipping_cost_calculated: returnType === "return" ? (settings?.return_shipping_cost || 0) : (settings?.exchange_shipping_cost || 0),
        }).select().single();

        if (error) throw error;

        // Create return items
        const items = selectedEntries.map(([itemId, v]) => {
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
      }
    } catch (err: any) {
      toast.error("Eroare: " + (err.message || "A apărut o eroare"));
    }
    setSubmitting(false);
  }

  if (!settings) {
    if (!open) return null;
    return inline ? (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground mt-2">Se încarcă setările...</p>
      </div>
    ) : null;
  }

  if (!settings.enabled) {
    const content = (
      <div className="text-center py-8">
        <RotateCcw className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <h3 className="font-semibold mb-1">Retur indisponibil</h3>
        <p className="text-sm text-muted-foreground">Funcționalitatea de retur nu este activă momentan. Te rugăm să ne contactezi la adresa de email pentru a solicita un retur.</p>
        {!inline && <Button className="mt-4" onClick={onClose}>Închide</Button>}
      </div>
    );
    if (inline) return content;
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5" /> Retur indisponibil</DialogTitle>
            <DialogDescription>Funcționalitatea de retur nu este activă momentan.</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  const reasons = settings.return_reasons || [];

  // Calculate refund total for confirmation
  const refundTotal = Object.entries(selectedItems)
    .filter(([_, v]) => v.selected)
    .reduce((sum, [itemId, v]) => {
      const orderItem = orderItems.find((oi: any) => (oi.id || oi.product_id) === itemId);
      return sum + (orderItem?.unit_price || orderItem?.price || 0) * v.quantity;
    }, 0);

  const formContent = (
    <>
      {/* Step indicators */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => {
          const actualCurrent = needsRefundStep ? step : (step >= 5 ? step - 1 : step);
          return (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= actualCurrent ? "bg-primary" : "bg-muted"}`} />
          );
        })}
      </div>

      {/* STEP 1 - Select products */}
      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Pas 1 — Selectează produsele</h3>
          {orderItems.length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-lg">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-sm font-medium mb-1">Nu am găsit produse în această comandă</p>
              <p className="text-xs text-muted-foreground">
                Dacă consideri că este o eroare, te rugăm să ne contactezi la adresa de email.
              </p>
            </div>
          ) : (
            orderItems.map((item: any) => {
              const itemId = item.id || item.product_id;
              const sel = selectedItems[itemId];
              return (
                <div key={itemId} className={`flex items-center gap-3 border rounded-md p-3 transition-colors ${sel?.selected ? "border-primary bg-primary/5" : ""}`}>
                  <Checkbox checked={sel?.selected || false} onCheckedChange={() => toggleItem(itemId)} />
                  {(item.image_url || item.product_image) && (
                    <img src={item.image_url || item.product_image} className="w-12 h-12 object-cover rounded" alt={item.product_name || item.name} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name || item.name}</p>
                    <p className="text-xs text-muted-foreground">{Number(item.unit_price || item.price || 0).toFixed(2)} RON × {item.quantity || 1}</p>
                  </div>
                  {sel?.selected && settings.allow_partial_returns && (item.quantity || 1) > 1 && (
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
                        if (files.length < (e.target.files?.length || 0)) {
                          toast.warning("Fișierele mai mari de 5MB au fost omise.");
                        }
                        setSelectedItems((p) => ({ ...p, [itemId]: { ...p[itemId], photos: [...(p[itemId]?.photos || []), ...files] } }));
                      }}
                      className="mt-1"
                    />
                    {v.photos.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {v.photos.map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {f.name.length > 20 ? f.name.slice(0, 17) + "..." : f.name}
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
            <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} maxLength={500} rows={3} placeholder="Detalii suplimentare despre problema întâmpinată..." />
          </div>
        </div>
      )}

      {/* STEP 3 - Type */}
      {step === 3 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Pas 3 — Tipul solicitării</h3>
          <div className="space-y-2">
            <label className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer transition-colors ${returnType === "return" ? "border-primary bg-primary/5" : ""}`}>
              <input type="radio" checked={returnType === "return"} onChange={() => setReturnType("return")} />
              <RotateCcw className="w-4 h-4" />
              <div>
                <span className="text-sm font-medium">Retur (rambursare)</span>
                <p className="text-xs text-muted-foreground">Primești banii înapoi</p>
              </div>
            </label>
            {settings.allow_same_product_exchange && (
              <label className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer transition-colors ${returnType === "same_exchange" ? "border-primary bg-primary/5" : ""}`}>
                <input type="radio" checked={returnType === "same_exchange"} onChange={() => setReturnType("same_exchange")} />
                <ArrowLeftRight className="w-4 h-4" />
                <div>
                  <span className="text-sm font-medium">Schimb cu același produs</span>
                  <p className="text-xs text-muted-foreground">Primești același produs (altă mărime/culoare)</p>
                </div>
              </label>
            )}
            {settings.allow_different_product_exchange && (
              <label className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer transition-colors ${returnType === "different_exchange" ? "border-primary bg-primary/5" : ""}`}>
                <input type="radio" checked={returnType === "different_exchange"} onChange={() => setReturnType("different_exchange")} />
                <Package className="w-4 h-4" />
                <div>
                  <span className="text-sm font-medium">Schimb cu alt produs</span>
                  <p className="text-xs text-muted-foreground">Alege un produs diferit</p>
                </div>
              </label>
            )}
          </div>
        </div>
      )}

      {/* STEP 4 - Refund method (only for return type) */}
      {step === 4 && needsRefundStep && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Pas 4 — Metoda de rambursare</h3>
          <div className="bg-muted/40 rounded-md p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Suma estimată de rambursat: <strong className="text-foreground">{refundTotal.toFixed(2)} RON</strong></span>
          </div>
          {settings.allow_bank_refund && (
            <label className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer transition-colors ${refundMethod === "bank" ? "border-primary bg-primary/5" : ""}`}>
              <input type="radio" checked={refundMethod === "bank"} onChange={() => setRefundMethod("bank")} className="mt-1" />
              <div className="flex-1 space-y-2">
                <span className="text-sm font-medium">Rambursare în cont bancar</span>
                {refundMethod === "bank" && (
                  <div className="space-y-2">
                    <Input value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="Titular cont *" maxLength={100} />
                    <Input value={bankIban} onChange={(e) => setBankIban(e.target.value.toUpperCase())} placeholder="IBAN (RO...) *" maxLength={34} />
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Banca *" maxLength={100} />
                  </div>
                )}
              </div>
            </label>
          )}
          <label className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer transition-colors ${refundMethod === "wallet" ? "border-primary bg-primary/5" : ""}`}>
            <input type="radio" checked={refundMethod === "wallet"} onChange={() => setRefundMethod("wallet")} />
            <div>
              <span className="text-sm font-medium">Rambursare în Wallet</span>
              <p className="text-xs text-muted-foreground">Credit în contul tău de magazin</p>
            </div>
          </label>
        </div>
      )}

      {/* STEP 5 - Courier */}
      {step === 5 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Pas {needsRefundStep ? "5" : "4"} — Ridicare colet</h3>
          {settings.courier_pickup === "customer_choice" ? (
            <div className="space-y-2">
              <label className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer transition-colors ${courierChoice === "customer" ? "border-primary bg-primary/5" : ""}`}>
                <input type="radio" checked={courierChoice === "customer"} onChange={() => setCourierChoice("customer")} />
                <span className="text-sm">Eu voi trimite coletul</span>
              </label>
              <label className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer transition-colors ${courierChoice === "merchant" ? "border-primary bg-primary/5" : ""}`}>
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
            <Label>Adresa ridicare {courierChoice === "merchant" ? "*" : "(opțional)"}</Label>
            <Textarea value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} rows={2} placeholder="Strada, număr, bloc, scara, apartament, oraș, județ..." maxLength={500} />
          </div>
        </div>
      )}

      {/* STEP 6 - Confirm */}
      {step === 6 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Pas {needsRefundStep ? "6" : "5"} — Confirmare</h3>
          <div className="border rounded-md p-3 space-y-2 text-sm">
            <p><span className="text-muted-foreground">Comandă:</span> <strong>#{orderDisplay}</strong></p>
            <p><span className="text-muted-foreground">Tip:</span> {returnType === "return" ? "Retur (rambursare)" : returnType === "same_exchange" ? "Schimb cu același produs" : "Schimb cu alt produs"}</p>
            <div>
              <span className="text-muted-foreground">Produse:</span>
              <ul className="ml-4 mt-1 space-y-0.5">
                {Object.entries(selectedItems).filter(([_, v]) => v.selected).map(([itemId, v]) => {
                  const item = orderItems.find((oi: any) => (oi.id || oi.product_id) === itemId);
                  return (
                    <li key={itemId} className="text-xs">
                      • {item?.product_name || item?.name} × {v.quantity} — {v.reasonText}
                    </li>
                  );
                })}
              </ul>
            </div>
            {returnType === "return" && (
              <>
                <p><span className="text-muted-foreground">Rambursare:</span> {refundMethod === "bank" ? `Cont bancar (${bankIban})` : "Wallet"}</p>
                <p><span className="text-muted-foreground">Sumă estimată:</span> <strong>{refundTotal.toFixed(2)} RON</strong></p>
              </>
            )}
            {(settings.return_shipping_cost > 0 || settings.exchange_shipping_cost > 0) && (
              <p><span className="text-muted-foreground">Cost transport retur:</span> {(returnType === "return" ? settings.return_shipping_cost : settings.exchange_shipping_cost).toFixed(2)} RON</p>
            )}
            <p><span className="text-muted-foreground">Ridicare colet:</span> {courierChoice === "merchant" ? "Curier trimis de noi" : "Trimis de client"}</p>
            {observation && <p><span className="text-muted-foreground">Observații:</span> {observation}</p>}
          </div>
          <div className="bg-muted/30 rounded-md p-3 text-xs text-muted-foreground space-y-1 border">
            <p className="font-semibold text-foreground">📋 Informare legală</p>
            <p>Conform Directivei UE 2011/83/EU și OUG 34/2014, ai dreptul de retragere din contract în termen de 14 zile calendaristice de la primirea produsului, fără a fi necesar să invoci un motiv.</p>
            <p>Rambursarea se va efectua în maximum 14 zile de la primirea produselor returnate, folosind aceeași metodă de plată, cu excepția cazului în care ai convenit altfel.</p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between gap-2 pt-3 border-t">
        <div>
          {step > 1 && <Button variant="outline" onClick={goBack}><ChevronLeft className="w-4 h-4 mr-1" />Înapoi</Button>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Anulează</Button>
          {!isLastStep ? (
            <Button
              onClick={goNext}
              disabled={step === 1 && (selectedCount === 0 || orderItems.length === 0)}
            >
              Continuă<ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Se trimite..." : "Trimite cererea"}
            </Button>
          )}
        </div>
      </div>
    </>
  );

  // Inline mode: no Dialog wrapper
  if (inline) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <RotateCcw className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold">Formular Retur — Comanda #{orderDisplay}</h2>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5" />Formular Retur — Comanda #{orderDisplay}</DialogTitle>
          <DialogDescription>Completează pașii de mai jos pentru a trimite cererea de retur.</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
