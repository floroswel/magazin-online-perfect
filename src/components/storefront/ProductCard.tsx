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
  short_description?: string | null;
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
          <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="text-6xl opacity-50">🕯️</div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {discount > 0 && <span className="wm-badge wm-badge-sale">-{discount}%</span>}
          {p.badge_bestseller && <span className="wm-badge wm-badge-best">BESTSELLER</span>}
          {p.badge_new && <span className="wm-badge wm-badge-new">NOU</span>}
          {outOfStock && <span className="wm-badge" style={{ background: "#6b7280" }}>STOC LIMITAT</span>}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); toggle?.(p.id); }}
          aria-label={fav ? "Elimină din favorite" : "Adaugă la favorite"}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm border transition-all ${
            fav ? "opacity-100 bg-blue-600 text-white border-blue-600" : "opacity-0 group-hover:opacity-100 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} />
        </button>
      </Link>

      <div className="wm-card-body flex-1 flex flex-col">
        {p.category_name && <div className="wm-card-cat">{p.category_name}</div>}
        <Link to={`/produs/${p.slug}`} className="wm-card-title hover:text-blue-600 transition-colors min-h-[2.5rem]">
          {p.name}
        </Link>

        {/* Short description */}
        {p.short_description && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-1">{p.short_description}</p>
        )}

        {/* Rating */}
        {(p.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-3 w-3" style={{ color: i <= Math.round(Number(p.rating)) ? "#facc15" : "#d1d5db", fill: i <= Math.round(Number(p.rating)) ? "#facc15" : "none" }} />
              ))}
            </div>
            <span className="text-[11px] text-gray-400">({p.review_count ?? 0})</span>
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {p.old_price && p.old_price > p.price && (
              <div className="text-xs line-through text-gray-400">{Number(p.old_price).toFixed(0)} RON</div>
            )}
            <div className="text-lg font-bold text-orange-500">{Number(p.price).toFixed(0)} RON</div>
          </div>
          <button
            disabled={outOfStock}
            onClick={() => addItem({ product_id: p.id, name: p.name, slug: p.slug, image_url: p.image_url, price: Number(p.price) })}
            className="h-9 px-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 rounded-md"
            aria-label={outOfStock ? "Stoc epuizat" : `Adaugă ${p.name} în coș`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adaugă</span>
          </button>
        </div>
      </div>
    </article>
  );
});

export default ProductCard;
