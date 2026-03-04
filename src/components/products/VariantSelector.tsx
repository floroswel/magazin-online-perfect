import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  sku: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  attributes: Record<string, string>;
  image_url: string | null;
  is_active: boolean;
}

interface VariantSelectorProps {
  productId: string;
  basePrice: number;
  lowStockThreshold?: number;
  onVariantSelect: (variant: ProductVariant | null) => void;
  onHasVariants?: (has: boolean) => void;
}

export default function VariantSelector({ productId, basePrice, lowStockThreshold = 5, onVariantSelect, onHasVariants }: VariantSelectorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [attributeMap, setAttributeMap] = useState<Record<string, string[]>>({});
  const [colorHexMap, setColorHexMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true);

      if (!data?.length) {
        onHasVariants?.(false);
        return;
      }

      onHasVariants?.(true);

      const parsed: ProductVariant[] = data.map((v: any) => ({
        ...v,
        attributes: (typeof v.attributes === "object" && v.attributes) ? v.attributes as Record<string, string> : {},
        stock: v.stock || 0,
        old_price: v.old_price || null,
      }));
      setVariants(parsed);

      // Build attribute map
      const map: Record<string, Set<string>> = {};
      parsed.forEach((v) => {
        Object.entries(v.attributes).forEach(([key, val]) => {
          if (!map[key]) map[key] = new Set();
          map[key].add(String(val));
        });
      });
      const result: Record<string, string[]> = {};
      Object.entries(map).forEach(([k, s]) => { result[k] = Array.from(s); });
      setAttributeMap(result);

      // Load color hex values from attribute_values table
      const colorAttrs = Object.keys(result).filter((k) =>
        k.toLowerCase().includes("culoare") || k.toLowerCase().includes("color") || k.toLowerCase().includes("colour")
      );
      if (colorAttrs.length > 0) {
        const allValues = colorAttrs.flatMap((a) => result[a]);
        const { data: avData } = await supabase
          .from("attribute_values")
          .select("value, color_hex")
          .in("value", allValues)
          .not("color_hex", "is", null);
        if (avData) {
          const hexMap: Record<string, string> = {};
          avData.forEach((av: any) => { if (av.color_hex) hexMap[av.value] = av.color_hex; });
          setColorHexMap(hexMap);
        }
      }
    }
    load();
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

  const isAvailable = (attr: string, val: string) => {
    const testSelections = { ...selections, [attr]: val };
    return variants.some((v) =>
      Object.entries(testSelections).every(([k, sv]) => !sv || v.attributes[k] === sv) && v.stock > 0
    );
  };

  const isColorAttr = (attr: string) =>
    attr.toLowerCase().includes("culoare") || attr.toLowerCase().includes("color") || attr.toLowerCase().includes("colour");

  // Check low stock for selected variant
  const attrKeys = Object.keys(attributeMap);
  const allSelected = attrKeys.every((k) => selections[k]);
  const selectedVariant = allSelected
    ? variants.find((v) => attrKeys.every((k) => v.attributes[k] === selections[k]))
    : null;

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
              const hex = colorHexMap[val];
              const isColor = isColorAttr(attr);

              if (isColor && hex) {
                return (
                  <button
                    key={val}
                    onClick={() => handleSelect(attr, val)}
                    disabled={!available}
                    title={val}
                    className={cn(
                      "w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : available
                          ? "border-border hover:border-primary/50"
                          : "border-border/50 opacity-30 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn("w-6 h-6 rounded-full", !available && "relative")}
                      style={{ backgroundColor: hex }}
                    >
                      {!available && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-[2px] bg-destructive rotate-45 rounded" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              }

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
                  {isColor && hex && (
                    <span className="inline-block w-3 h-3 rounded-full mr-1.5 border border-border" style={{ backgroundColor: hex }} />
                  )}
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Low stock warning */}
      {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= lowStockThreshold && (
        <p className="text-sm font-medium text-orange-600 dark:text-orange-400 animate-pulse">
          ⚡ Doar {selectedVariant.stock} {selectedVariant.stock === 1 ? "bucată" : "bucăți"} în stoc!
        </p>
      )}

      {/* Must select all variants warning */}
      {!allSelected && variants.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selectează {attrKeys.filter((k) => !selections[k]).join(", ")} pentru a continua.
        </p>
      )}
    </div>
  );
}
