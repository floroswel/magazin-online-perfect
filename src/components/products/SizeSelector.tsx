import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Ruler } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface ProductSize {
  id: string;
  label: string;
  weight_grams: number;
  price: number;
  sort_order: number;
}

interface SizeSelectorProps {
  productId: string;
  onSizeSelect: (size: ProductSize | null) => void;
}

export default function SizeSelector({ productId, onSizeSelect }: SizeSelectorProps) {
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { format } = useCurrency();

  useEffect(() => {
    supabase
      .from("product_sizes" as any)
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const s = (data || []) as unknown as ProductSize[];
        setSizes(s);
        if (s.length > 0) {
          setSelected(s[0].id);
          onSizeSelect(s[0]);
        }
      });
  }, [productId]);

  if (sizes.length === 0) return null;

  const handleSelect = (size: ProductSize) => {
    setSelected(size.id);
    onSizeSelect(size);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <Ruler className="h-4 w-4" /> Alege dimensiunea
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sizes.map((size) => (
          <button
            key={size.id}
            onClick={() => handleSelect(size)}
            className={cn(
              "border rounded-lg p-3 text-left transition-all hover:border-primary/50",
              selected === size.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border"
            )}
          >
            <p className="text-sm font-semibold text-foreground">{size.label}</p>
            <p className="text-xs text-muted-foreground">{size.weight_grams}g</p>
            <p className="text-sm font-bold text-primary mt-1">{format(size.price)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
