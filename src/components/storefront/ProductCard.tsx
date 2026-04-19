import { Link } from "react-router-dom";
import { ShoppingBag, Heart } from "lucide-react";
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
}

export default function ProductCard({ p }: { p: ProductCardData }) {
  const { addItem } = useCart();
  const { toggle, isFav } = useFavorites();
  const fav = isFav?.(p.id) ?? false;
  const discount = p.old_price && p.old_price > p.price
    ? Math.round((1 - p.price / p.old_price) * 100)
    : 0;
  const outOfStock = (p.stock ?? 1) <= 0;

  return (
    <div className="group bg-card border border-border rounded-md overflow-hidden hover:shadow-editorial transition-all flex flex-col">
      <Link to={`/produs/${p.slug}`} className="relative block aspect-square overflow-hidden bg-muted">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-accent/10">🕯️</div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && <span className="px-2 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-sm">-{discount}%</span>}
          {p.badge_new && <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-sm">NOU</span>}
          {p.badge_bestseller && <span className="px-2 py-0.5 bg-highlight text-on-dark text-[10px] font-bold rounded-sm">TOP</span>}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); toggle?.(p.id); }}
          aria-label={fav ? "Elimină din favorite" : "Adaugă la favorite"}
          aria-pressed={fav}
          className="absolute top-2 right-2 p-1.5 bg-card/90 rounded-full hover:bg-card transition-colors min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 flex items-center justify-center"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-accent text-accent" : ""}`} />
        </button>
      </Link>
      <div className="p-3 flex-1 flex flex-col gap-2">
        <Link to={`/produs/${p.slug}`} className="text-sm font-medium line-clamp-2 hover:text-accent transition-colors min-h-[2.5rem]">
          {p.name}
        </Link>
        {(p.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="text-highlight" aria-hidden="true">★</span>
            <span className="sr-only">Rating:</span>
            {Number(p.rating).toFixed(1)} ({p.review_count ?? 0})
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            {p.old_price && p.old_price > p.price && (
              <div className="text-[11px] text-muted-foreground line-through">{Number(p.old_price).toFixed(2)} lei</div>
            )}
            <div className="text-base font-bold text-accent">{Number(p.price).toFixed(2)} lei</div>
          </div>
          <button
            disabled={outOfStock}
            onClick={() => addItem({ product_id: p.id, name: p.name, slug: p.slug, image_url: p.image_url, price: Number(p.price) })}
            className="p-2 bg-primary text-primary-foreground rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label={outOfStock ? "Stoc epuizat" : `Adaugă ${p.name} în coș`}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {outOfStock && <div className="text-[10px] text-destructive font-semibold uppercase">Stoc epuizat</div>}
      </div>
    </div>
  );
}
