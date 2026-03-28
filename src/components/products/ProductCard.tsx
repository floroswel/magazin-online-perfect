import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Award, Check } from "lucide-react";
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
  eager?: boolean;
}

function ProductCardInner({ product, eager = false }: Props) {
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const { getProductDiscount } = usePricingRules();
  const { getProductPromotion } = usePromotions();
  const { calcPointsForPrice, config } = useLoyalty();
  const { prefetchProduct } = usePrefetch();
  const [addedToCart, setAddedToCart] = useState(false);
  const [liked, setLiked] = useState(false);

  const pointsEarned = config.program_enabled ? calcPointsForPrice(product.price) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id);
    setAddedToCart(true);
    toast.success("Adăugat în coș");
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
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

  // Get category name from product if available
  const categoryName = (product as any).category_name || (product as any).categories?.name;

  return (
    <Link
      to={`/product/${product.slug}`}
      onMouseEnter={() => prefetchProduct(product.slug)}
      className="group block"
    >
      <div className="h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary mb-3">
          {/* Badges */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-primary text-accent-foreground text-[10px] font-sans font-medium px-2.5 py-1 z-10 rounded-full tracking-wide">
              -{discount}%
            </span>
          )}
          {promotion && !pricingDiscount && (
            <span className="absolute top-3 left-3 text-[10px] font-sans font-medium px-2.5 py-1 z-10 rounded-full text-accent-foreground"
              style={{ backgroundColor: promotion.badgeColor || "hsl(var(--primary))" }}>
              {promotion.badgeText}
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
          >
            <Heart
              className={`h-4 w-4 transition-all ${liked ? "fill-destructive text-destructive animate-heart-pop" : "text-muted-foreground"}`}
            />
          </button>

          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name || "Lumânare"}
            width={600}
            height={600}
            loading={eager ? "eager" : "lazy"}
            decoding={eager ? "sync" : "async"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
          />

          {/* Add to cart overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 md:block hidden">
            <button
              onClick={handleAddToCart}
              className="btn-cta w-full bg-primary text-accent-foreground font-sans font-medium text-xs py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-ventuza-amber-dark transition-colors"
            >
              {addedToCart ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Adăugat!
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Adaugă în coș
                </>
              )}
            </button>
          </div>

          {/* Mobile always-visible button */}
          <button
            onClick={handleAddToCart}
            className="md:hidden absolute bottom-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-accent-foreground shadow-lg"
          >
            {addedToCart ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col">
          {categoryName && (
            <p className="font-sans font-light text-[11px] text-muted-foreground uppercase tracking-[2px] mb-1">{categoryName}</p>
          )}
          <h3 className="font-sans font-medium text-[15px] text-foreground mb-1.5 leading-snug line-clamp-2">{product.name}</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="font-serif text-xl text-primary">
              {format(effectivePrice)}
            </span>
            {showOldPrice && showOldPrice > effectivePrice && (
              <span className="font-sans text-xs text-muted-foreground line-through">
                {format(showOldPrice)}
              </span>
            )}
          </div>
          {promoDiscount && promoDiscount.savings > 0 && (
            <p className="font-sans text-[11px] text-primary mt-0.5">
              Economisești {format(promoDiscount.savings)}
            </p>
          )}
          {promotion?.showCountdown && promotion?.endsAt && (
            <CountdownTimer endsAt={promotion.endsAt} />
          )}
          {pointsEarned > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-primary mt-1 font-sans">
              <Award className="h-3 w-3" />
              <span>+{pointsEarned} puncte</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

const ProductCard = memo((props: Props) => <ProductCardInner {...props} />);
ProductCard.displayName = "ProductCard";
export default ProductCard;
