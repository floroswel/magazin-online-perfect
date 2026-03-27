import { memo } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { usePricingRules } from "@/hooks/usePricingRules";
import { usePromotions } from "@/hooks/usePromotions";
import { useLoyalty } from "@/hooks/useLoyalty";
import { usePrefetch } from "@/hooks/usePrefetch";
import CountdownTimer from "./CountdownTimer";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  product: Tables<"products">;
}

function ProductCardInner({ product, eager = false }: Props & { eager?: boolean }) {
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const { getProductDiscount } = usePricingRules();
  const { getProductPromotion } = usePromotions();
  const { calcPointsForPrice, config } = useLoyalty();
  const { prefetchProduct } = usePrefetch();

  const pointsEarned = config.program_enabled ? calcPointsForPrice(product.price) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id);
    toast.success("Adăugat în coș");
  };

  const pricingDiscount = getProductDiscount(product);
  const promotion = getProductPromotion(product);

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
    <Link to={`/product/${product.slug}`} onMouseEnter={() => prefetchProduct(product.slug)} className="group">
      <div className="h-full flex flex-col">
        <div className="relative aspect-[3/4] overflow-hidden bg-card rounded-md mb-2 md:mb-4 neon-border">
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-foreground text-background text-[10px] tracking-wider uppercase font-medium px-2.5 py-1 z-10">
              -{discount}%
            </span>
          )}
          {promotion && !pricingDiscount && (
            <span className="absolute top-3 right-3 text-[10px] tracking-wider uppercase font-medium px-2.5 py-1 z-10 text-primary-foreground"
              style={{ backgroundColor: promotion.badgeColor }}>
              {promotion.badgeText}
            </span>
          )}
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name || "Lumânare"}
            width={600}
            height={800}
            loading={eager ? "eager" : "lazy"}
            decoding={eager ? "sync" : "async"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
          <Button
            onClick={handleAddToCart}
            className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-foreground text-background hover:bg-foreground/90 rounded-none text-xs tracking-wider uppercase font-medium h-10"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-2" />
            Adaugă în coș
          </Button>
        </div>
        <div className="flex-1 flex flex-col">
          <h3 className="font-medium text-xs md:text-sm text-foreground mb-1 md:mb-1.5 leading-snug line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className={`text-sm font-medium ${promoDiscount ? "text-destructive" : "text-foreground"}`}>
              {format(effectivePrice)}
            </span>
            {showOldPrice && showOldPrice > effectivePrice && (
              <span className="text-xs text-muted-foreground line-through">
                {format(showOldPrice)}
              </span>
            )}
          </div>
          {promoDiscount && promoDiscount.savings > 0 && (
            <p className="text-[11px] text-primary mt-0.5">
              Economisești {format(promoDiscount.savings)}
            </p>
          )}
          {promotion?.showCountdown && promotion?.endsAt && (
            <CountdownTimer endsAt={promotion.endsAt} />
          )}
          {pointsEarned > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-primary mt-1">
              <Award className="h-3 w-3" />
              <span>+{pointsEarned} puncte</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

const ProductCard = memo(ProductCardInner);
export default ProductCard;
