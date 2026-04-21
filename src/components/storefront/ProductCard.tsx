import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Star } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price?: number | null;
  image_url?: string | null;
  stock?: number;
  rating?: number | null;
  review_count?: number | null;
  badge_promo?: boolean | null;
  badge_new?: boolean | null;
  badge_bestseller?: boolean | null;
  category_name?: string | null;
}

const ProductCard = forwardRef<HTMLElement, { p: ProductCardData }>(function ProductCard({ p }, ref) {
  const { addItem } = useCart();
  const { toggle, isFav } = useFavorites();
  const fav = isFav?.(p.id) ?? false;
  const discount = p.old_price && p.old_price > p.price
    ? Math.round((1 - p.price / p.old_price) * 100)
    : 0;
  const outOfStock = (p.stock ?? 1) <= 0;

  return (
    <article ref={ref} className="wm-card group flex flex-col">
      <Link to={`/produs/${p.slug}`} className="relative wm-card-img overflow-hidden">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-6xl opacity-50">🕯️</div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {p.badge_new && <span className="wm-badge wm-badge-new">NEW</span>}
          {discount > 0 && <span className="wm-badge wm-badge-sale">-{discount}%</span>}
          {p.badge_bestseller && <span className="wm-badge wm-badge-hot">HOT</span>}
        </div>

        {/* Wishlist circle */}
        <button
          onClick={(e) => { e.preventDefault(); toggle?.(p.id); }}
          aria-label={fav ? "Elimină din favorite" : "Adaugă la favorite"}
          aria-pressed={fav}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-sm border border-border/50 transition-all ${
            fav ? "opacity-100 bg-primary text-primary-foreground" : "opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
        </button>
      </Link>

      <div className="wm-card-body flex-1 flex flex-col">
        {p.category_name && <div className="wm-card-cat">{p.category_name}</div>}
        <Link to={`/produs/${p.slug}`} className="wm-card-title hover:text-primary transition-colors min-h-[2.5rem]">
          {p.name}
        </Link>

        {(p.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-current" style={{ color: "hsl(var(--star-color))" }} />
            <span className="font-semibold text-foreground">{Number(p.rating).toFixed(1)}</span>
            <span>({p.review_count ?? 0})</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {p.old_price && p.old_price > p.price && (
              <div className="text-xs text-muted-foreground line-through">{Number(p.old_price).toFixed(2)} lei</div>
            )}
            <div className="wm-card-price">{Number(p.price).toFixed(2)} lei</div>
          </div>
          <button
            disabled={outOfStock}
            onClick={() => addItem({ product_id: p.id, name: p.name, slug: p.slug, image_url: p.image_url, price: Number(p.price) })}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105"
            aria-label={outOfStock ? "Stoc epuizat" : `Adaugă ${p.name} în coș`}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
        {outOfStock && <div className="mt-2 text-[10px] text-destructive font-bold uppercase">Stoc epuizat</div>}
      </div>
    </article>
  );
});

export default ProductCard;
