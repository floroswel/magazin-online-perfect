import { useState } from "react";
import { RefreshCw, Pause, Play, XCircle, Calendar, MapPin, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const FREQ_LABELS: Record<string, string> = {
  weekly: "Săptămânal", biweekly: "La 2 săptămâni", monthly: "Lunar", bimonthly: "La 2 luni", quarterly: "La 3 luni",
};
const FREQ_DAYS: Record<string, number> = {
  weekly: 7, biweekly: 14, monthly: 30, bimonthly: 60, quarterly: 90,
};

export default function MySubscriptions() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const qc = useQueryClient();
  const [cancelSub, setCancelSub] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [freqChangeSub, setFreqChangeSub] = useState<any>(null);
  const [newFreq, setNewFreq] = useState("");

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["my-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("subscriptions")
        .select("*, products(name, image_url, price)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const updateStatus = async (id: string, status: string, extra?: any) => {
    const update: any = { status, updated_at: new Date().toISOString(), ...extra };
    const { error } = await supabase.from("subscriptions").update(update).eq("id", id);
    if (error) { toast.error("Eroare"); return; }
    toast.success(status === "paused" ? "Abonament pus pe pauză" : status === "active" ? "Abonament reluat" : "Abonament anulat");
    qc.invalidateQueries({ queryKey: ["my-subscriptions"] });
  };

  const handleCancel = async () => {
    if (!cancelSub) return;
    await updateStatus(cancelSub.id, "cancelled", { cancel_reason: cancelReason || null });
    setCancelSub(null);
    setCancelReason("");
  };

  const handleFreqChange = async () => {
    if (!freqChangeSub || !newFreq) return;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (FREQ_DAYS[newFreq] || 30));
    const { error } = await supabase.from("subscriptions").update({
      frequency: newFreq,
      next_renewal_date: nextDate.toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", freqChangeSub.id);
    if (error) { toast.error("Eroare"); return; }
    toast.success("Frecvență actualizată");
    setFreqChangeSub(null);
    qc.invalidateQueries({ queryKey: ["my-subscriptions"] });
  };

  const renewNow = async (sub: any) => {
    const { error } = await supabase.from("subscriptions").update({
      next_renewal_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", sub.id);
    if (error) { toast.error("Eroare"); return; }
    toast.success("Reînnoire programată imediat!");
    qc.invalidateQueries({ queryKey: ["my-subscriptions"] });
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Se încarcă...</p>;
  if (subs.length === 0) return <p className="text-muted-foreground text-sm">Nu ai niciun abonament activ.</p>;

  return (
    <div className="space-y-3">
      {subs.map((s: any) => {
        const price = s.products?.price || 0;
        const discounted = price * (1 - (s.discount_percent || 0) / 100) * s.quantity;
        const statusLabel = s.status === "active" ? "Activ" : s.status === "paused" ? "Pauzat" : "Anulat";
        const statusColor = s.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : s.status === "paused" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

        return (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                {s.products?.image_url && (
                  <img src={s.products.image_url} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm truncate">{s.products?.name || "Produs"}</p>
                      <p className="text-xs text-muted-foreground">Cantitate: {s.quantity}</p>
                    </div>
                    <Badge className={statusColor + " text-xs"}>{statusLabel}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {FREQ_LABELS[s.frequency]}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Următoarea: {new Date(s.next_renewal_date).toLocaleDateString("ro-RO")}</span>
                    <span className="font-semibold text-foreground">{format(discounted)}/comandă</span>
                    {s.discount_percent > 0 && <span className="text-green-600">-{s.discount_percent}%</span>}
                  </div>

                  {s.status !== "cancelled" && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {s.status === "active" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => updateStatus(s.id, "paused")}>
                          <Pause className="w-3 h-3" /> Pauză
                        </Button>
                      )}
                      {s.status === "paused" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => updateStatus(s.id, "active")}>
                          <Play className="w-3 h-3" /> Reia
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setFreqChangeSub(s); setNewFreq(s.frequency); }}>
                        <Calendar className="w-3 h-3" /> Schimbă frecvența
                      </Button>
                      {s.status === "active" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => renewNow(s)}>
                          <Zap className="w-3 h-3" /> Reînnoiește acum
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive" onClick={() => setCancelSub(s)}>
                        <XCircle className="w-3 h-3" /> Anulează
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Cancel dialog */}
      <Dialog open={!!cancelSub} onOpenChange={o => { if (!o) setCancelSub(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anulează abonamentul</DialogTitle>
            <DialogDescription>Abonamentul va fi anulat permanent. Ne poți spune motivul?</DialogDescription>
          </DialogHeader>
          <Textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Motivul anulării (opțional)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelSub(null)}>Renunță</Button>
            <Button variant="destructive" onClick={handleCancel}>Anulează abonamentul</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Frequency change dialog */}
      <Dialog open={!!freqChangeSub} onOpenChange={o => { if (!o) setFreqChangeSub(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schimbă frecvența</DialogTitle>
            <DialogDescription>Noua frecvență va fi aplicată de la următoarea reînnoire.</DialogDescription>
          </DialogHeader>
          <Select value={newFreq} onValueChange={setNewFreq}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(FREQ_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreqChangeSub(null)}>Renunță</Button>
            <Button onClick={handleFreqChange}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
