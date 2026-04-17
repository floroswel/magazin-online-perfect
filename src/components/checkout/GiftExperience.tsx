import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Gift, Ribbon } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const WRAPPING_OPTIONS = [
  { id: "none", name: "Fără ambalaj cadou", price: 0 },
  { id: "kraft", name: "Cutie Kraft cu panglică", price: 12, emoji: "🎁" },
  { id: "premium", name: "Cutie Premium Neagră", price: 25, emoji: "✨" },
  { id: "lux", name: "Cutie Lux + Fundă Mătase", price: 39, emoji: "💎" },
];

export interface GiftOptions {
  isGift: boolean;
  wrappingId: string;
  wrappingPrice: number;
  message: string;
}

interface Props {
  value: GiftOptions;
  onChange: (v: GiftOptions) => void;
}

export default function GiftExperience({ value, onChange }: Props) {
  const { format } = useCurrency();

  const toggleGift = (checked: boolean) => {
    onChange({
      ...value,
      isGift: checked,
      wrappingId: checked ? "kraft" : "none",
      wrappingPrice: checked ? 12 : 0,
    });
  };

  const setWrapping = (id: string) => {
    const opt = WRAPPING_OPTIONS.find((o) => o.id === id);
    onChange({ ...value, wrappingId: id, wrappingPrice: opt?.price || 0 });
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={value.isGift} onCheckedChange={(v) => toggleGift(!!v)} />
        <span className="text-sm font-medium flex items-center gap-1">
          <Gift className="h-4 w-4 text-accent" /> Aceasta este o comandă cadou
        </span>
      </label>

      {value.isGift && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Ambalaj cadou</Label>
              <RadioGroup value={value.wrappingId} onValueChange={setWrapping} className="space-y-2">
                {WRAPPING_OPTIONS.filter((o) => o.id !== "none").map((opt) => (
                  <div
                    key={opt.id}
                    className={`flex items-center space-x-2 border rounded-lg p-3 transition-colors ${
                      value.wrappingId === opt.id ? "border-accent bg-background" : "hover:border-accent/50"
                    }`}
                  >
                    <RadioGroupItem value={opt.id} id={`wrap-${opt.id}`} />
                    <Label htmlFor={`wrap-${opt.id}`} className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {opt.emoji} {opt.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          +{format(opt.price)}
                        </Badge>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium">Mesaj cadou (opțional)</Label>
              <Textarea
                value={value.message}
                onChange={(e) => onChange({ ...value, message: e.target.value })}
                placeholder="Scrie un mesaj personalizat care va fi inclus în pachet..."
                rows={3}
                maxLength={200}
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{value.message.length}/200 caractere</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
