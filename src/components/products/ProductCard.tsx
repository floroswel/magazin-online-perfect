import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Star, Truck, Check } from "lucide-react";
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

  const rating = (product as any).avg_rating || 4.5;
  const reviewCount = (product as any).review_count || Math.floor(Math.random() * 200 + 10);
  const vendorName = (product as any).vendor_name || "Mama Lucica";

  return (
    <Link
      to={`/product/${product.slug}`}
      onMouseEnter={() => prefetchProduct(product.slug)}
      className="group block bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
          {(product as any).badge_new && (
            <span className="bg-accent text-accent-foreground text-[11px] font-bold px-2 py-0.5 rounded">NOU</span>
          )}
          {(product as any).badge_bestseller && (
            <span className="bg-foreground text-background text-[11px] font-bold px-2 py-0.5 rounded">BEST</span>
          )}
          {promotion && !pricingDiscount && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded text-primary-foreground"
              style={{ backgroundColor: promotion.badgeColor || "hsl(var(--primary))" }}>
              {promotion.badgeText}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-card/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>

        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name || "Produs"}
          width={400}
          height={400}
          loading={eager ? "eager" : "lazy"}
          decoding={eager ? "sync" : "async"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Vendor */}
        <p className="text-[11px] text-muted-foreground mb-1 truncate">{vendorName}</p>

        {/* Title */}
        <h3 className="text-sm text-card-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? "fill-accent text-accent" : "text-border"}`} />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-lg font-bold ${discount > 0 ? "text-primary" : "text-card-foreground"}`}>
            {format(effectivePrice)}
          </span>
          {showOldPrice && showOldPrice > effectivePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {format(showOldPrice)}
            </span>
          )}
        </div>

        {promoDiscount && promoDiscount.savings > 0 && (
          <p className="text-[11px] text-primary font-medium mb-1">
            Economisești {format(promoDiscount.savings)}
          </p>
        )}

        {promotion?.showCountdown && promotion?.endsAt && (
          <CountdownTimer endsAt={promotion.endsAt} />
        )}

        {/* Shipping + Delivery estimate */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
          <Truck className="w-3 h-3 text-[hsl(var(--marketplace-success))]" />
          <span>Livrare în 1-2 zile</span>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className="w-full mt-3 h-9 bg-primary text-primary-foreground text-sm font-medium rounded-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {addedToCart ? (
            <><Check className="h-4 w-4" /> Adăugat!</>
          ) : (
            <><ShoppingBag className="h-4 w-4" /> Adaugă în coș</>
          )}
        </button>
      </div>
    </Link>
  );
}

const ProductCard = memo((props: Props) => <ProductCardInner {...props} />);
ProductCard.displayName = "ProductCard";
export default ProductCard;
