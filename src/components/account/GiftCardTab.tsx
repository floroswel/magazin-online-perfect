import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

export default function GiftCardTab() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<any>(null);

  const redeemCard = async () => {
    if (!code.trim() || !user) return;
    setRedeeming(true);
    setResult(null);

    const { data: card } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (!card) {
      toast.error("Cod invalid sau inexistent.");
      setRedeeming(false);
      return;
    }

    const gc = card as any;
    if (gc.status !== "active") {
      toast.error("Acest card a fost deja utilizat sau expirat.");
      setRedeeming(false);
      return;
    }
    if (gc.current_balance <= 0) {
      toast.error("Card fără sold.");
      setRedeeming(false);
      return;
    }

    // Link card to user
    await supabase.from("gift_cards").update({ redeemed_by: user.id, redeemed_at: new Date().toISOString() } as any).eq("id", gc.id);
    setResult(gc);
    toast.success(`Card activat! Sold: ${gc.current_balance} RON`);
    setCode("");
    setRedeeming(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Activează Card Cadou</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Introdu codul de pe cardul cadou pentru a-l activa în contul tău.</p>
          <div className="flex gap-2">
            <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="GC-XXXX-XXXX-XXXX" className="font-mono" />
            <Button onClick={redeemCard} disabled={redeeming || !code.trim()}>Activează</Button>
          </div>
          {result && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Card activat cu succes!</p>
                <p className="text-xs text-green-600">Sold disponibil: {format(result.current_balance)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
