import { Package } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import type { Tables } from "@/integrations/supabase/types";

interface VendorProductsProps {
  products: Tables<"products">[];
}

export default function VendorProducts({ products }: VendorProductsProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p>Acest artizan nu are încă produse listate.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
