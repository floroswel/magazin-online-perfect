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
  const [hovered, setHovered] = useState(false);

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
  const images = (product as any).images as string[] | null;
  const secondImage = images && images.length > 1 ? images[1] : null;

  return (
    <Link
      to={`/product/${product.slug}`}
      onMouseEnter={() => { prefetchProduct(product.slug); setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      className="group block"
    >
      <div className="h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary mb-3">
          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {discount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-sans font-medium px-2 py-0.5">
                -{discount}%
              </span>
            )}
            {(product as any).badge_new && (
              <span className="bg-foreground text-background text-[10px] font-sans font-medium px-2 py-0.5">NOU</span>
            )}
            {(product as any).badge_bestseller && (
              <span className="bg-foreground text-background text-[10px] font-sans font-medium px-2 py-0.5">BEST</span>
            )}
            {(product as any).badge_custom_text && (
              <span className="text-white text-[10px] font-sans font-medium px-2 py-0.5" style={{ backgroundColor: (product as any).badge_custom_color || '#6b7280' }}>
                {(product as any).badge_custom_text}
              </span>
            )}
            {promotion && !pricingDiscount && (
              <span className="text-[10px] font-sans font-medium px-2 py-0.5 text-primary-foreground"
                style={{ backgroundColor: promotion.badgeColor || "hsl(var(--primary))" }}>
                {promotion.badgeText}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart
              className={`h-5 w-5 transition-all ${liked ? "fill-destructive text-destructive animate-heart-pop" : "text-foreground/70"}`}
            />
          </button>

          {/* Primary image */}
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name || "Produs"}
            width={600}
            height={800}
            loading={eager ? "eager" : "lazy"}
            decoding={eager ? "sync" : "async"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hovered && secondImage ? "opacity-0" : "opacity-100"}`}
          />

          {/* Secondary image on hover */}
          {secondImage && (
            <img
              src={secondImage}
              alt={`${product.name} - 2`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
            />
          )}

          {/* Add to cart overlay - desktop */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 md:block hidden">
            <button
              onClick={handleAddToCart}
              className="w-full bg-foreground text-background font-sans text-[11px] font-medium tracking-[1px] uppercase py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
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
            className="md:hidden absolute bottom-2 right-2 z-10 w-9 h-9 flex items-center justify-center bg-foreground text-background"
          >
            {addedToCart ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-sans text-sm text-foreground mb-1 leading-snug line-clamp-2">{product.name}</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            {showOldPrice && showOldPrice > effectivePrice && (
              <span className="font-sans text-sm text-muted-foreground line-through">
                {format(showOldPrice)}
              </span>
            )}
            <span className={`font-sans text-sm ${discount > 0 ? "text-destructive font-medium" : "text-foreground"}`}>
              {format(effectivePrice)}
            </span>
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
