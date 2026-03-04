import { memo } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  product: Tables<"products">;
}

function ProductCardInner({ product }: Props) {
  const { addToCart } = useCart();
  const { format } = useCurrency();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id);
    toast.success("Produs adăugat în coș!");
  };

  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  return (
    <Link to={`/product/${product.slug}`}>
      <Card className="group h-full hover:shadow-lg transition-all duration-200 border-border overflow-hidden bg-card">
        <div className="relative aspect-square overflow-hidden bg-white p-4">
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-sm z-10">
              -{discount}%
            </span>
          )}
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] text-foreground">
            {product.name}
          </h3>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.round(product.rating || 0) ? "fill-emag-yellow text-emag-yellow" : "text-muted"}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({product.review_count})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              {product.price.toLocaleString("ro-RO")} lei
            </span>
            {product.old_price && (
              <span className="text-xs text-muted-foreground line-through">
                {product.old_price.toLocaleString("ro-RO")} lei
              </span>
            )}
          </div>
          <Button
            onClick={handleAddToCart}
            className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Cumpără Acum
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

const ProductCard = memo(ProductCardInner);
export default ProductCard;
