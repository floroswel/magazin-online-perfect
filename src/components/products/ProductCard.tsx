import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Check, Truck } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { usePricingRules } from "@/hooks/usePricingRules";
import { usePromotions } from "@/hooks/usePromotions";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useTaxSettings } from "@/hooks/useTaxSettings";
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
  const { prefetchProduct } = usePrefetch();
  const taxSettings = useTaxSettings();
  const [addedToCart, setAddedToCart] = useState(false);
  const [liked, setLiked] = useState(false);
  const [imgHover, setImgHover] = useState(false);

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

  const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;
  const secondImage = (product as any).images?.[1] || null;

  return (
    <Link
      to={`/product/${product.slug}`}
      onMouseEnter={() => { prefetchProduct(product.slug); setImgHover(true); }}
      onMouseLeave={() => setImgHover(false)}
      className="group flex flex-col bg-background h-full"
    >
      {/* Image — clean, no border */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {/* Badges — minimal */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {(product as any).badge_new && (
            <span className="border border-foreground text-foreground text-[10px] font-medium px-2 py-0.5 bg-background uppercase tracking-wider">
              NEW
            </span>
          )}
          {discount > 0 && (
            <span className="border border-foreground text-foreground text-[10px] font-medium px-2 py-0.5 bg-background">
              -{discount}%
            </span>
          )}
          {promotion && !pricingDiscount && (
            <span className="border border-foreground text-foreground text-[10px] font-medium px-2 py-0.5 bg-background uppercase tracking-wider">
              {promotion.badgeText}
            </span>
          )}
        </div>

        {/* Wishlist — appears on hover */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-foreground text-foreground" : "text-foreground/70 hover:text-foreground"}`} strokeWidth={1.5} />
        </button>

        {/* Quick add — appears on hover */}
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 left-3 right-3 z-10 bg-background/95 text-foreground text-xs font-medium py-2.5 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-foreground hover:text-background flex items-center justify-center gap-2"
          >
            {addedToCart ? (
              <><Check className="h-3.5 w-3.5" /> Adăugat</>
            ) : (
              "Adaugă în coș"
            )}
          </button>
        )}

        <img
          src={imgHover && secondImage ? secondImage : (product.image_url || "/placeholder.svg")}
          alt={product.name || "Produs"}
          width={400}
          height={533}
          loading={eager ? "eager" : "lazy"}
          decoding={eager ? "sync" : "async"}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
      </div>

      {/* Info — minimal Ella style */}
      <div className="pt-3 pb-4 flex flex-col flex-1">
        <h3 className="text-sm text-foreground leading-snug line-clamp-1 mb-1 font-normal">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {showOldPrice && showOldPrice > effectivePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {format(showOldPrice)}
            </span>
          )}
          <span className="text-sm font-medium text-foreground">
            {format(effectivePrice)}
          </span>
        </div>

        {promotion?.showCountdown && promotion?.endsAt && (
          <CountdownTimer endsAt={promotion.endsAt} />
        )}
      </div>
    </Link>
  );
}

const ProductCard = memo((props: Props) => <ProductCardInner {...props} />);
ProductCard.displayName = "ProductCard";
export default ProductCard;
