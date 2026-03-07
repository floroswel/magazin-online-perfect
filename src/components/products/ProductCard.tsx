import { memo } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { usePricingRules } from "@/hooks/usePricingRules";
import { usePromotions } from "@/hooks/usePromotions";
import { useLoyalty } from "@/hooks/useLoyalty";
import CountdownTimer from "./CountdownTimer";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  product: Tables<"products">;
}

function ProductCardInner({ product }: Props) {
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const { getProductDiscount } = usePricingRules();
  const { getProductPromotion } = usePromotions();
  const { calcPointsForPrice, config } = useLoyalty();

  const pointsEarned = config.program_enabled ? calcPointsForPrice(product.price) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id);
    toast.success("Produs adăugat în coș!");
  };

  // Try pricing rules first, then promotions engine
  const pricingDiscount = getProductDiscount(product);
  const promotion = getProductPromotion(product);

  // Use whichever gives a better price
  const promoDiscount = pricingDiscount || (promotion ? {
    originalPrice: product.price,
    discountedPrice: promotion.discountedPrice,
    savings: promotion.savings,
    savingsPercent: promotion.savingsPercent,
    badgeText: promotion.badgeText,
    endsAt: promotion.endsAt,
    rules: [],
  } : null);

  const effectivePrice = promoDiscount ? promoDiscount.discountedPrice : product.price;
  const showOldPrice = promoDiscount ? product.price : product.old_price;
  const discount = showOldPrice && showOldPrice > effectivePrice
    ? Math.round(((showOldPrice - effectivePrice) / showOldPrice) * 100)
    : 0;

  return (
    <Link to={`/product/${product.slug}`}>
      <Card className="group h-full hover:shadow-lg transition-all duration-200 border-border overflow-hidden bg-card">
        <div className="relative aspect-square overflow-hidden bg-white p-4">
          {/* Promotion badge with custom color */}
          {promotion && !pricingDiscount && (
            <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded z-10 text-white"
              style={{ backgroundColor: promotion.badgeColor }}>
              {promotion.badgeText}
            </span>
          )}
          {pricingDiscount && (
            <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
              {pricingDiscount.badgeText}
            </span>
          )}
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
            <span className={`text-lg font-bold ${promoDiscount ? "text-destructive" : "text-foreground"}`}>
              {format(effectivePrice)}
            </span>
            {showOldPrice && showOldPrice > effectivePrice && (
              <span className="text-xs text-muted-foreground line-through">
                {format(showOldPrice)}
              </span>
            )}
          </div>
          {/* Savings message */}
          {promoDiscount && promoDiscount.savings > 0 && (
            <p className="text-[11px] font-medium text-green-600">
              Economisești {format(promoDiscount.savings)}
            </p>
          )}
          {/* Countdown */}
          {promotion?.showCountdown && promotion?.endsAt && (
            <CountdownTimer endsAt={promotion.endsAt} />
          )}
          {promoDiscount?.endsAt && !promotion && (
            <CountdownTimer endsAt={promoDiscount.endsAt} />
          )}
          {pointsEarned > 0 && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Award className="h-3 w-3" />
              <span>+{pointsEarned} {config.program_name || "puncte"}</span>
            </div>
          )}
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
