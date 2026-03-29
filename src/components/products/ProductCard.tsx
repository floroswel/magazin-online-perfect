import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Award, Check, Star } from "lucide-react";
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

  const categoryName = (product as any).category_name || (product as any).categories?.name;
  const rating = (product as any).average_rating || 0;
  const reviewCount = (product as any).review_count || 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      onMouseEnter={() => prefetchProduct(product.slug)}
      className="group block"
    >
      <div className="h-full flex flex-col bg-background">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {discount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-sans font-medium px-2.5 py-1">
                -{discount}%
              </span>
            )}
            {(product as any).badge_new && (
              <span className="bg-foreground text-background text-[10px] font-sans font-medium px-2.5 py-1">NOU</span>
            )}
            {(product as any).badge_bestseller && (
              <span className="bg-primary text-primary-foreground text-[10px] font-sans font-medium px-2.5 py-1">BESTSELLER</span>
            )}
            {(product as any).badge_exclusive && (
              <span className="bg-foreground text-background text-[10px] font-sans font-medium px-2.5 py-1">EXCLUSIV</span>
            )}
            {(product as any).badge_gift && (
              <span className="bg-primary text-primary-foreground text-[10px] font-sans font-medium px-2.5 py-1">CADOU PERFECT</span>
            )}
            {(product as any).badge_low_stock && product.stock !== null && product.stock > 0 && product.stock < 10 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-sans font-medium px-2.5 py-1">EPUIZAT CURÂND</span>
            )}
            {(product as any).badge_custom_text && (
              <span className="text-white text-[10px] font-sans font-medium px-2.5 py-1" style={{ backgroundColor: (product as any).badge_custom_color || '#6b7280' }}>
                {(product as any).badge_custom_text}
              </span>
            )}
            {promotion && !pricingDiscount && (
              <span className="text-[10px] font-sans font-medium px-2.5 py-1 text-primary-foreground"
                style={{ backgroundColor: promotion.badgeColor || "hsl(var(--primary))" }}>
                {promotion.badgeText}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Heart
              className={`h-4 w-4 transition-all ${liked ? "fill-destructive text-destructive animate-heart-pop" : "text-muted-foreground"}`}
            />
          </button>

          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name || "Produs"}
            width={600}
            height={600}
            loading={eager ? "eager" : "lazy"}
            decoding={eager ? "sync" : "async"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />

          {/* Add to cart overlay - desktop */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 md:block hidden">
            <button
              onClick={handleAddToCart}
              className="btn-cta w-full bg-foreground text-background font-sans font-medium text-xs py-3 flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors"
            >
              {addedToCart ? (
                <><Check className="h-3.5 w-3.5" /> Adăugat!</>
              ) : (
                <><ShoppingBag className="h-3.5 w-3.5" /> Adaugă în coș</>
              )}
            </button>
          </div>

          {/* Mobile always-visible button */}
          <button
            onClick={handleAddToCart}
            className="md:hidden absolute bottom-3 right-3 z-10 w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground shadow-lg"
          >
            {addedToCart ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col pt-4 pb-2">
          {categoryName && (
            <p className="font-sans font-light text-[11px] text-muted-foreground uppercase tracking-[2px] mb-1">{categoryName}</p>
          )}
          <h3 className="font-sans font-medium text-sm text-foreground mb-2 leading-snug line-clamp-2">{product.name}</h3>

          {/* Rating stars */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-border"}`} />
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">({reviewCount})</span>
            </div>
          )}

          <div className="flex items-baseline gap-2 mt-auto">
            <span className={`font-sans text-base font-semibold ${discount > 0 ? "text-primary" : "text-foreground"}`}>
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
