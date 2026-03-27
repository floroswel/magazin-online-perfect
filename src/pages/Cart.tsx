import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, Tag, Gift, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { usePromotions } from "@/hooks/usePromotions";
import CountdownTimer from "@/components/products/CountdownTimer";
import FreeShippingBar from "@/components/cart/FreeShippingBar";
import CartCrossSell from "@/components/cart/CartCrossSell";

export default function Cart() {
  const { user } = useAuth();
  const { items, totalPrice, updateQuantity, removeFromCart } = useCart();
  const { format } = useCurrency();
  const { getCartPromotions, hasFreeShipping } = usePromotions();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-6" />
          <h1 className="font-serif text-3xl font-medium mb-3">Coșul tău este gol</h1>
          <p className="text-muted-foreground mb-6">Descoperă colecția noastră de lumânări handmade.</p>
          <Link to="/catalog"><Button className="rounded-none px-10 text-xs tracking-wider uppercase">Explorează Colecția</Button></Link>
        </div>
      </Layout>
    );
  }

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const freeShipping = hasFreeShipping(totalPrice, totalQty);
  const shipping = freeShipping ? 0 : (totalPrice >= 200 ? 0 : 19.99);

  // Get cart-level promotions
  const cartPromos = getCartPromotions(
    items.map(i => ({ product: i.product, quantity: i.quantity })),
    totalPrice
  );
  const totalSavings = cartPromos.reduce((s, p) => s + p.savings, 0);

  const promoIcon = (type: string) => {
    switch (type) {
      case "free_shipping": return <Truck className="h-3.5 w-3.5" />;
      case "buy_x_get_y": return <Gift className="h-3.5 w-3.5" />;
      case "gift_product": return <Gift className="h-3.5 w-3.5" />;
      case "spend_threshold": return <Zap className="h-3.5 w-3.5" />;
      default: return <Tag className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="font-serif text-3xl font-medium mb-2">Coșul Tău</h1>
        <Link to="/catalog" className="text-xs tracking-wide uppercase text-primary hover:text-primary/80 mb-6 inline-block transition-colors">← Continuă cumpărăturile</Link>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-card rounded-lg border p-4 flex gap-4">
                <img src={item.product.image_url || "/placeholder.svg"} alt={item.product.name} className="w-20 h-20 object-contain rounded" />
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.slug}`} className="font-medium text-sm hover:text-primary line-clamp-2">
                    {item.product.name}
                  </Link>
                  <p className="text-primary font-bold mt-1">{format(item.product.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border rounded">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.product_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{format(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))}

            {/* Active promotions in cart */}
            {cartPromos.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Promoții aplicate
                </p>
                {cartPromos.map((cp, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      {promoIcon(cp.type)}
                      {cp.label}
                      {cp.promo.ends_at && cp.promo.show_countdown && (
                        <CountdownTimer endsAt={cp.promo.ends_at} className="ml-1" />
                      )}
                    </span>
                    {cp.savings > 0 && (
                      <span className="font-semibold text-green-700 dark:text-green-400">-{format(cp.savings)}</span>
                    )}
                  </div>
                ))}
                {totalSavings > 0 && (
                  <p className="text-sm font-bold text-green-700 dark:text-green-300 pt-1 border-t border-green-200 dark:border-green-800">
                    🎉 Felicitări! Economisești {format(totalSavings)} cu promoțiile active!
                  </p>
                )}
              </div>
            )}

            {/* Free shipping progress bar */}
            <FreeShippingBar currentTotal={totalPrice} />

            {/* Cross-sell suggestions */}
            <CartCrossSell cartProductIds={items.map(i => i.product_id)} />
          </div>

          <div className="bg-card rounded-lg border p-6 h-fit sticky top-24 space-y-3">
            <h2 className="font-bold text-lg">Sumar comandă</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{format(totalPrice)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Economii promoții</span>
                <span className="font-medium">-{format(totalSavings)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livrare</span>
              <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                {shipping === 0 ? (freeShipping ? "GRATUITĂ (promoție)" : "GRATUITĂ") : format(shipping)}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{format(totalPrice - totalSavings + shipping)}</span>
            </div>
            <Link to="/checkout" className="block">
              <Button className="w-full font-semibold" size="lg">Finalizează comanda</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
