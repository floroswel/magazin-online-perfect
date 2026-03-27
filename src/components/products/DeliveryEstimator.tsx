import { useMemo } from "react";

interface DeliveryEstimatorProps {
  isCustom?: boolean;
}

export default function DeliveryEstimator({ isCustom = false }: DeliveryEstimatorProps) {
  const estimate = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    // Prep time: 1-2 days for standard, 3-5 for custom
    const prepDays = isCustom ? 5 : 2;
    // Shipping: 1-3 business days
    const shipDays = 3;

    // Calculate ready date (skip weekends)
    let readyDate = new Date(now);
    let daysAdded = 0;
    // If ordered before 14:00, same day counts
    if (hour >= 14) daysAdded = 1;
    while (daysAdded < prepDays) {
      readyDate.setDate(readyDate.getDate() + 1);
      if (readyDate.getDay() !== 0 && readyDate.getDay() !== 6) daysAdded++;
    }

    // Calculate delivery date
    let deliveryDate = new Date(readyDate);
    let shipAdded = 0;
    while (shipAdded < shipDays) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) shipAdded++;
    }

    const formatDate = (d: Date) => d.toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });

    return {
      readyBy: formatDate(readyDate),
      deliveryBy: formatDate(deliveryDate),
      orderBefore14: hour < 14,
    };
  }, [isCustom]);

  return (
    <div className="bg-primary/5 rounded-lg p-3 space-y-1.5 text-sm">
      <p className="font-semibold text-foreground flex items-center gap-1">📦 Estimare livrare</p>
      {estimate.orderBefore14 && !isCustom && (
        <p className="text-xs text-primary font-medium">Comandat azi înainte de 14:00!</p>
      )}
      <p className="text-muted-foreground">Gata de expediere: <span className="text-foreground font-medium">{estimate.readyBy}</span></p>
      <p className="text-muted-foreground">Livrare estimată: <span className="text-foreground font-medium">{estimate.deliveryBy}</span></p>
    </div>
  );
}
