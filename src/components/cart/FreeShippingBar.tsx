import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Truck } from "lucide-react";

interface Props {
  currentTotal: number;
}

export default function FreeShippingBar({ currentTotal }: Props) {
  const [threshold, setThreshold] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "free_shipping_threshold")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && typeof data.value_json === "object" && "amount" in (data.value_json as any)) {
          const amount = Number((data.value_json as any).amount);
          if (amount > 0) setThreshold(amount);
        }
      });
  }, []);

  // Fallback to default 200 lei threshold
  const effectiveThreshold = threshold ?? 200;
  const remaining = Math.max(0, effectiveThreshold - currentTotal);
  const progress = Math.min(100, (currentTotal / effectiveThreshold) * 100);
  const reached = remaining <= 0;

  const progressColor = progress < 40
    ? "bg-destructive"
    : progress < 75
    ? "bg-accent"
    : "bg-[hsl(142,71%,45%)]";

  return (
    <div className={`rounded-lg p-3 border ${reached ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/50 border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Truck className={`h-4 w-4 ${reached ? "text-green-600" : "text-primary"}`} />
        {reached ? (
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            🎉 Felicitări! Ai transport GRATUIT la această comandă!
          </p>
        ) : (
          <p className="text-sm font-medium text-foreground">
            Mai adaugă <span className="font-bold text-primary">{remaining.toFixed(2)} lei</span> pentru TRANSPORT GRATUIT! 🚚
          </p>
        )}
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
