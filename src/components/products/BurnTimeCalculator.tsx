import { useState } from "react";
import { Flame } from "lucide-react";

interface Props {
  burnTimeHours: number;
}

export default function BurnTimeCalculator({ burnTimeHours }: Props) {
  const [hoursPerDay, setHoursPerDay] = useState(2);

  if (!burnTimeHours || burnTimeHours <= 0) return null;

  const days = Math.round(burnTimeHours / hoursPerDay);
  const weeks = Math.round(days / 7 * 10) / 10;

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Calculator durată ardere</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">Aprind lumânarea</label>
        <input
          type="number"
          min={1}
          max={24}
          value={hoursPerDay}
          onChange={e => setHoursPerDay(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
          className="w-16 h-8 text-center text-sm border border-border rounded bg-background"
        />
        <span className="text-xs text-muted-foreground">ore pe zi</span>
      </div>
      <p className="text-sm font-semibold text-foreground">
        🕯️ Lumânarea ta va dura aproximativ <strong className="text-primary">{days} zile</strong>
        {weeks >= 1 && <span className="text-muted-foreground"> ({weeks} săptămâni)</span>}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">Total: {burnTimeHours} ore de ardere</p>
    </div>
  );
}
