import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface SizeRow {
  id: string;
  label: string;
  weight_grams: number;
  price: number;
  sort_order: number;
  _isNew?: boolean;
}

interface Props {
  productId: string;
}

export default function ProductSizesEditor({ productId }: Props) {
  const [sizes, setSizes] = useState<SizeRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    supabase
      .from("product_sizes" as any)
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setSizes((data || []) as unknown as SizeRow[]);
      });
  }, [productId]);

  const addRow = () => {
    setSizes((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        label: "",
        weight_grams: 0,
        price: 0,
        sort_order: prev.length,
        _isNew: true,
      },
    ]);
  };

  const update = (idx: number, field: keyof SizeRow, value: any) => {
    setSizes((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const remove = async (idx: number) => {
    const row = sizes[idx];
    if (!row._isNew) {
      await (supabase.from("product_sizes" as any) as any).delete().eq("id", row.id);
    }
    setSizes((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    for (let i = 0; i < sizes.length; i++) {
      const s = sizes[i];
      const payload = {
        product_id: productId,
        label: s.label,
        weight_grams: s.weight_grams,
        price: s.price,
        sort_order: i,
      };
      if (s._isNew) {
        await (supabase.from("product_sizes" as any) as any).insert(payload);
      } else {
        await (supabase.from("product_sizes" as any) as any).update(payload).eq("id", s.id);
      }
    }
    // Reload
    const { data } = await supabase
      .from("product_sizes" as any)
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });
    setSizes((data || []) as unknown as SizeRow[]);
    setSaving(false);
    toast.success("Dimensiuni salvate!");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Dimensiuni (gramaj & preț)</Label>
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adaugă
        </Button>
      </div>

      {sizes.length === 0 && (
        <p className="text-xs text-muted-foreground">Nicio dimensiune definită. Produsul va folosi prețul de bază.</p>
      )}

      {sizes.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 bg-muted/30 rounded-md p-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Ex: Mic, Mediu, Mare"
            value={s.label}
            onChange={(e) => update(i, "label", e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="g"
              value={s.weight_grams || ""}
              onChange={(e) => update(i, "weight_grams", Number(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="Preț"
              value={s.price || ""}
              onChange={(e) => update(i, "price", Number(e.target.value))}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground">lei</span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}

      {sizes.length > 0 && (
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          {saving ? "Se salvează..." : "Salvează dimensiunile"}
        </Button>
      )}
    </div>
  );
}
