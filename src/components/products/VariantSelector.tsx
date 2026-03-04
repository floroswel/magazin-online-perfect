import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  sku: string | null;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  image_url: string | null;
  is_active: boolean;
}

interface VariantSelectorProps {
  productId: string;
  basePrice: number;
  onVariantSelect: (variant: ProductVariant | null) => void;
}

export default function VariantSelector({ productId, basePrice, onVariantSelect }: VariantSelectorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [attributeMap, setAttributeMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .then(({ data }) => {
        if (!data?.length) return;
        const parsed = data.map((v: any) => ({
          ...v,
          attributes: (typeof v.attributes === "object" && v.attributes) ? v.attributes as Record<string, string> : {},
        }));
        setVariants(parsed);

        // Build attribute map: { "Culoare": ["Roșu", "Albastru"], "Mărime": ["S", "M", "L"] }
        const map: Record<string, Set<string>> = {};
        parsed.forEach((v) => {
          Object.entries(v.attributes).forEach(([key, val]) => {
            if (!map[key]) map[key] = new Set();
            map[key].add(val);
          });
        });
        const result: Record<string, string[]> = {};
        Object.entries(map).forEach(([k, s]) => { result[k] = Array.from(s); });
        setAttributeMap(result);
      });
  }, [productId]);

  useEffect(() => {
    if (!variants.length) return;
    const attrKeys = Object.keys(attributeMap);
    const allSelected = attrKeys.every((k) => selections[k]);
    if (!allSelected) { onVariantSelect(null); return; }

    const match = variants.find((v) =>
      attrKeys.every((k) => v.attributes[k] === selections[k])
    );
    onVariantSelect(match || null);
  }, [selections, variants, attributeMap]);

  if (!variants.length) return null;

  const handleSelect = (attr: string, val: string) => {
    setSelections((s) => ({ ...s, [attr]: s[attr] === val ? "" : val }));
  };

  // Check if a value is available given current selections
  const isAvailable = (attr: string, val: string) => {
    const testSelections = { ...selections, [attr]: val };
    return variants.some((v) =>
      Object.entries(testSelections).every(([k, sv]) => !sv || v.attributes[k] === sv) && v.stock > 0
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(attributeMap).map(([attr, values]) => (
        <div key={attr} className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            {attr}: {selections[attr] && <span className="text-primary">{selections[attr]}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {values.map((val) => {
              const available = isAvailable(attr, val);
              const selected = selections[attr] === val;
              return (
                <button
                  key={val}
                  onClick={() => handleSelect(attr, val)}
                  disabled={!available}
                  className={cn(
                    "px-3 py-1.5 rounded-md border text-sm font-medium transition-all",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : available
                        ? "border-border bg-card text-foreground hover:border-primary/50"
                        : "border-border/50 bg-muted text-muted-foreground/50 line-through cursor-not-allowed"
                  )}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
