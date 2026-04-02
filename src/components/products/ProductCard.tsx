import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Star, Truck, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { usePricingRules } from "@/hooks/usePricingRules";
import { usePromotions } from "@/hooks/usePromotions";
import { useLoyalty } from "@/hooks/useLoyalty";
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
  const { calcPointsForPrice, config } = useLoyalty();
  const { prefetchProduct } = usePrefetch();
  const taxSettings = useTaxSettings();
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

  const rating = (product as any).avg_rating || 4.5;
  const reviewCount = (product as any).review_count || Math.floor(Math.random() * 200 + 10);
  const vendorName = (product as any).vendor_name || "Mama Lucica";
  const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      onMouseEnter={() => prefetchProduct(product.slug)}
      className="group flex flex-col bg-background overflow-hidden border border-border hover:shadow-lg transition-all duration-200 h-full"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-background">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">
              -{discount}%
            </span>
          )}
          {(product as any).badge_new && (
            <span className="bg-[hsl(var(--store-success))] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">NOU</span>
          )}
          {(product as any).badge_bestseller && (
            <span className="bg-secondary text-secondary-foreground text-[11px] font-bold px-2 py-0.5 rounded-sm">BEST</span>
          )}
          {promotion && !pricingDiscount && (
            <span className="text-[11px] font-bold px-2 py-0.5 text-white rounded-sm"
              style={{ backgroundColor: promotion.badgeColor || "hsl(var(--primary))" }}>
              {promotion.badgeText}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-background rounded-full shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"}`} />
        </button>

        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name || "Produs"}
          width={400}
          height={400}
          loading={eager ? "eager" : "lazy"}
          decoding={eager ? "sync" : "async"}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info */}
      <div className="px-3 pb-3 pt-2 flex flex-col flex-1 border-t border-border">
        {/* Title */}
        <h3 className="text-[13px] text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors font-medium min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? "fill-[hsl(var(--store-warning))] text-[hsl(var(--store-warning))]" : "text-border"}`} />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Price block */}
        <div className="mb-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-primary leading-tight">
              {format(effectivePrice)}
            </span>
          </div>
          {showOldPrice && showOldPrice > effectivePrice && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground line-through">
                {format(showOldPrice)}
              </span>
              {discount > 0 && (
                <span className="text-xs font-bold text-primary">-{discount}%</span>
              )}
            </div>
          )}
        </div>

        {taxSettings.show_tax_included_message && (
          <p className="text-[10px] text-muted-foreground">{taxSettings.tax_included_message}</p>
        )}

        {promoDiscount && promoDiscount.savings > 0 && (
          <p className="text-[11px] text-primary font-semibold mb-1">
            Economisești {format(promoDiscount.savings)}
          </p>
        )}

        {promotion?.showCountdown && promotion?.endsAt && (
          <CountdownTimer endsAt={promotion.endsAt} />
        )}

        {/* Delivery / stock info */}
        {(() => {
          const threshold = (product as any).low_stock_threshold || 5;
          if (isOutOfStock) {
            return (
              <p className="text-[11px] font-semibold text-destructive mt-1">✗ Stoc epuizat</p>
            );
          }
          if (product.stock !== null && product.stock !== undefined && product.stock <= threshold) {
            return (
              <p className="text-[11px] font-semibold text-primary mt-1 animate-pulse">⚠️ Doar {product.stock} în stoc!</p>
            );
          }
          return (
            <div className="flex items-center gap-1 text-[11px] text-[hsl(var(--store-success))] mt-1 font-medium">
              <Truck className="w-3 h-3" />
              <span>Livrare gratuită</span>
            </div>
          );
        })()}

        {/* Add to cart */}
        <div className="mt-auto pt-2.5">
          {isOutOfStock ? (
            <button disabled className="w-full h-11 bg-muted text-muted-foreground text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed rounded uppercase tracking-wide">
              Stoc epuizat
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full h-11 bg-primary text-primary-foreground text-sm font-extrabold flex items-center justify-center gap-2 rounded hover:bg-secondary hover:shadow-md transition-all uppercase tracking-wide"
            >
              {addedToCart ? (
                <><Check className="h-4 w-4" /> Adăugat!</>
              ) : (
                <><ShoppingBag className="h-4 w-4" /> Adaugă în coș</>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

const ProductCard = memo((props: Props) => <ProductCardInner {...props} />);
ProductCard.displayName = "ProductCard";
export default ProductCard;