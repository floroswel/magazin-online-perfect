import { useState, useMemo } from "react";
import { Calculator, Clock, CalendarDays, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Props {
  burnHours: number; // total burn hours of the candle
  productName: string;
}

export default function CandleCalculator({ burnHours, productName }: Props) {
  const [hoursPerDay, setHoursPerDay] = useState(3);

  const result = useMemo(() => {
    if (hoursPerDay <= 0) return null;
    const totalDays = Math.floor(burnHours / hoursPerDay);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + totalDays);
    const reorderDate = new Date();
    reorderDate.setDate(reorderDate.getDate() + Math.max(0, totalDays - 7));
    return { totalDays, endDate, reorderDate };
  }, [burnHours, hoursPerDay]);

  const handleReminder = () => {
    toast.success("Te vom notifica cu 7 zile înainte să se termine lumânarea! 🕯️");
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Calculator Durată Ardere</h3>
        </div>

        <div className="flex items-end gap-3 mb-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Ore pe zi aprinsă</Label>
            <Input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="h-9 mt-1"
            />
          </div>
          <div className="text-xs text-muted-foreground pb-2">
            din {burnHours}h total
          </div>
        </div>

        {result && result.totalDays > 0 && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <Clock className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{result.totalDays}</p>
                <p className="text-[10px] text-muted-foreground">zile de ardere</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <CalendarDays className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">
                  {result.endDate.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                </p>
                <p className="text-[10px] text-muted-foreground">se termină aprox.</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReminder}
              className="w-full text-xs gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              Amintește-mi să recomand ({result.reorderDate.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
