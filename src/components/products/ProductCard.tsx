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
      className="group flex flex-col bg-card overflow-hidden rounded-xl border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-t-xl">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[11px] font-bold px-2.5 py-1 rounded-md">
              -{discount}%
            </span>
          )}
          {(product as any).badge_new && (
            <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-md">NOU</span>
          )}
          {(product as any).badge_bestseller && (
            <span className="text-[11px] font-bold px-2.5 py-1 bg-accent text-accent-foreground rounded-md">BEST</span>
          )}
          {promotion && !pricingDiscount && (
            <span className="text-[11px] font-bold px-2.5 py-1 text-primary-foreground rounded-md"
              style={{ backgroundColor: promotion.badgeColor || "hsl(var(--primary))" }}>
              {promotion.badgeText}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-card/90 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"}`} />
        </button>

        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name || "Produs"}
          width={400}
          height={500}
          loading={eager ? "eager" : "lazy"}
          decoding={eager ? "sync" : "async"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Vendor */}
        <p className="text-[11px] text-muted-foreground mb-1.5 truncate uppercase tracking-widest">{vendorName}</p>

        {/* Title */}
        <h3 className="text-sm text-card-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors font-medium">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? "fill-accent text-accent" : "text-border"}`} />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-lg font-bold text-primary">
            {format(effectivePrice)}
          </span>
          {showOldPrice && showOldPrice > effectivePrice && (
            <span className="text-[13px] text-muted-foreground line-through">
              {format(showOldPrice)}
            </span>
          )}
        </div>

        {taxSettings.show_tax_included_message && (
          <p className="text-[10px] text-muted-foreground">{taxSettings.tax_included_message}</p>
        )}

        {promoDiscount && promoDiscount.savings > 0 && (
          <p className="text-[11px] text-primary font-medium mb-1">
            Economisești {format(promoDiscount.savings)}
          </p>
        )}

        {promotion?.showCountdown && promotion?.endsAt && (
          <CountdownTimer endsAt={promotion.endsAt} />
        )}

        {/* Stock urgency */}
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
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
              <Truck className="w-3 h-3 text-[hsl(var(--store-success,142_71%_45%))]" />
              <span>Livrare în 1-2 zile</span>
            </div>
          );
        })()}

        {/* Add to cart */}
        <div className="mt-auto pt-3">
          {isOutOfStock ? (
            <button disabled className="w-full h-11 min-h-[44px] bg-muted text-muted-foreground text-[13px] font-medium flex items-center justify-center gap-2 cursor-not-allowed rounded-lg">
              Stoc epuizat
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full h-11 min-h-[44px] bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all md:opacity-0 md:group-hover:opacity-100"
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