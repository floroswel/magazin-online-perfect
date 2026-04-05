import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { usePricingRules } from "@/hooks/usePricingRules";
import { usePromotions } from "@/hooks/usePromotions";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useSettings } from "@/hooks/useSettings";
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
  const settings = useSettings();
  const [addedToCart, setAddedToCart] = useState(false);
  const [liked, setLiked] = useState(false);

  const FREE_SHIPPING = parseInt(settings.free_shipping_threshold || "200");
  const SHIPPING_COST = parseInt(settings.default_shipping_cost || "25");
  const lowStockThreshold = parseInt(settings.low_stock_threshold || "5");
  const siteName = settings.site_name || "LUMAX";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    await addToCart(product.id);
    setAddedToCart(true);
    toast.success("Adăugat în coș");
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    toast.success(liked ? "Eliminat din favorite" : "Adăugat la favorite");
  };

  const pricingDiscount = getProductDiscount(product);
  const promotion = getProductPromotion(product);

  const promoDiscount = pricingDiscount || (promotion ? {
    discountedPrice: promotion.discountedPrice,
  } : null);

  const effectivePrice = promoDiscount ? promoDiscount.discountedPrice : product.price;
  const showOldPrice = product.old_price && product.old_price > effectivePrice ? product.old_price : null;
  const discount = showOldPrice
    ? Math.round(((showOldPrice - effectivePrice) / showOldPrice) * 100)
    : 0;

  const isOutOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0;
  const isLowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock < lowStockThreshold;
  const isNew = (product as any).badge_new;

  return (
    <Link
      to={`/product/${product.slug}`}
      onMouseEnter={() => prefetchProduct(product.slug)}
      className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 hover:border-primary"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name || "Produs"}
          width={400}
          height={400}
          loading={eager ? "eager" : "lazy"}
          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.07]"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-[2]">
          {discount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm">
              -{discount}%
            </span>
          )}
          {isNew && (
            <span className="bg-lumax-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              NOU
            </span>
          )}
          {isLowStock && (
            <span className="bg-lumax-yellow text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              Stoc limitat
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-muted-foreground text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              Stoc epuizat
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-sm flex items-center justify-center z-[2] transition-colors ${
            liked ? "bg-destructive text-white" : "bg-card text-muted-foreground hover:bg-destructive hover:text-white"
          }`}
        >
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
        </button>

        {/* Quick actions overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-foreground/75 flex flex-col gap-1 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200 z-[3]">
          <Link
            to={`/product/${product.slug}`}
            className="bg-card text-foreground text-xs font-semibold text-center py-2 rounded-sm hover:bg-secondary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="inline h-3.5 w-3.5 mr-1.5" />Vizualizare rapidă
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-sm hover:bg-lumax-blue-dark transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            {addedToCart ? (
              <><Check className="inline h-3.5 w-3.5 mr-1" />Adăugat</>
            ) : isOutOfStock ? (
              "Stoc epuizat"
            ) : (
              <><ShoppingCart className="inline h-3.5 w-3.5 mr-1" />Adaugă în coș</>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
          {(product as any).brand?.name || (product as any).brand || siteName}
        </span>
        <h3 className="text-[13px] font-medium text-foreground leading-snug mb-1.5 flex-1 line-clamp-2 hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {(product as any).avg_rating > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-lumax-yellow text-[11px]">
              {"★".repeat(Math.round((product as any).avg_rating))}
              {"☆".repeat(5 - Math.round((product as any).avg_rating))}
            </span>
            <span className="text-[11px] text-muted-foreground">
              ({(product as any).review_count || 0})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline flex-wrap gap-1.5 mb-1">
          <span className="text-lg font-extrabold text-destructive">{format(effectivePrice)}</span>
          {showOldPrice && (
            <>
              <span className="text-xs text-muted-foreground line-through">{format(showOldPrice)}</span>
              <span className="text-[11px] font-semibold text-lumax-green">
                -{format(showOldPrice - effectivePrice)}
              </span>
            </>
          )}
        </div>

        {/* Shipping hint */}
        <p className="text-[10px] font-semibold text-lumax-green mb-2">
          {effectivePrice >= FREE_SHIPPING ? "🚚 Transport gratuit" : `🚚 Transport ${SHIPPING_COST} lei`}
        </p>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full bg-primary text-primary-foreground text-[13px] font-bold py-2 rounded-md hover:bg-lumax-blue-dark transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed mt-auto"
        >
          {isOutOfStock ? "Stoc Epuizat" : addedToCart ? "✓ Adăugat" : "+ Adaugă în Coș"}
        </button>
      </div>
    </Link>
  );
}

const ProductCard = memo((props: Props) => <ProductCardInner {...props} />);
ProductCard.displayName = "ProductCard";
export default ProductCard;
