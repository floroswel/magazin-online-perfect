import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useSettings } from "@/hooks/useSettings";
import { X, Minus, Plus, Truck, RotateCcw, Shield, Star } from "lucide-react";
import { toast } from "sonner";

interface Props {
  productId: string | null;
  onClose: () => void;
}

export default function QuickViewModal({ productId, onClose }: Props) {
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["quick-view-product", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(name), brand:brands(name)")
        .eq("id", productId!)
        .maybeSingle();
      return data;
    },
    enabled: !!productId,
  });

  const { data: reviewCount } = useQuery({
    queryKey: ["quick-view-reviews", productId],
    queryFn: async () => {
      const { count } = await supabase
        .from("product_reviews")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId!)
        .eq("status", "approved");
      return count || 0;
    },
    enabled: !!productId,
  });

  // Reset state when product changes
  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
  }, [productId]);

  // Close on Escape
  useEffect(() => {
    if (!productId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [productId, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (productId) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [productId]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!productId) return null;

  const images: string[] = product?.images?.length
    ? product.images
    : product?.image_url
      ? [product.image_url]
      : ["/placeholder.svg"];

  const isOutOfStock = product?.stock != null && product.stock <= 0;
  const lowStockThreshold = parseInt(settings.low_stock_threshold || "5");
  const isLowStock = product?.stock != null && product.stock > 0 && product.stock < lowStockThreshold;
  const discount = product?.old_price && product.old_price > product.price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  const handleAdd = async () => {
    if (!product || isOutOfStock) return;
    await addToCart(product.id, quantity);
    toast.success(`${product.name} adăugat în coș`);
  };

  const handleBuyNow = async () => {
    if (!product || isOutOfStock) return;
    await addToCart(product.id, quantity);
    onClose();
    navigate("/checkout");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={handleOverlayClick}
    >
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-scale-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {isLoading || !product ? (
          <div className="flex items-center justify-center w-full py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* LEFT — Images (45%) */}
            <div className="md:w-[45%] p-4 flex flex-col">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary mb-2">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {discount > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm">
                      -{discount}%
                    </span>
                  )}
                  {(product as any).badge_new && (
                    <span className="bg-lumax-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">NOU</span>
                  )}
                  {isOutOfStock && (
                    <span className="bg-muted-foreground text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">Stoc epuizat</span>
                  )}
                </div>
              </div>
              {images.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto">
                  {images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === selectedImage ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Info (55%) */}
            <div className="md:w-[55%] p-5 pt-3 md:pt-5 overflow-y-auto flex flex-col">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {(product as any).brand?.name || settings.site_name || "LUMAX"}
              </span>
              <h2 className="text-lg font-extrabold text-foreground leading-tight mt-1 mb-1">
                {product.name}
              </h2>

              {/* Rating */}
              {product.rating && product.rating > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-lumax-yellow text-xs">
                    {"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}
                  </span>
                  <span className="text-xs text-muted-foreground">({reviewCount || product.review_count || 0})</span>
                </div>
              )}

              {/* Price */}
              <div className="bg-secondary rounded-lg p-3 mb-3">
                {product.old_price && product.old_price > product.price && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-muted-foreground line-through">{format(product.old_price)}</span>
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1 py-0.5 rounded">-{discount}%</span>
                  </div>
                )}
                <p className="text-2xl font-black text-destructive">{format(product.price)}</p>
                {product.old_price && product.old_price > product.price && (
                  <p className="text-xs font-semibold text-lumax-green mt-0.5">Economisești {format(product.old_price - product.price)}</p>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Cantitate:</label>
                <div className="flex items-center border border-border rounded-lg w-fit overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-secondary"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-secondary"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <p className={`text-xs font-semibold mt-1 ${isOutOfStock ? "text-destructive" : isLowStock ? "text-lumax-yellow" : "text-lumax-green"}`}>
                  {isOutOfStock ? "❌ Stoc epuizat" : isLowStock ? `⚠️ Doar ${product.stock} bucăți` : "✅ În stoc"}
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-2 mb-3">
                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className="w-full h-11 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-lumax-blue-dark transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  {isOutOfStock ? "Stoc Epuizat" : "Adaugă în Coș"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="w-full h-11 bg-destructive text-destructive-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  Cumpără Acum
                </button>
              </div>

              <Link
                to={`/product/${product.slug}`}
                onClick={onClose}
                className="text-center text-xs text-primary font-semibold hover:underline mb-3 block"
              >
                Vezi Detalii Complete →
              </Link>

              {/* Delivery info */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2 mt-auto">
                {[
                  { icon: Truck, text: `Livrare gratuită peste ${settings.free_shipping_threshold || "200"} lei` },
                  { icon: RotateCcw, text: `Retur ${settings.return_days || "30"} zile` },
                  { icon: Shield, text: "Plată securizată SSL" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
