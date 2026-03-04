import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

export default function Cart() {
  const { user } = useAuth();
  const { items, totalPrice, updateQuantity, removeFromCart } = useCart();

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Coșul tău de cumpărături</h1>
          <p className="text-muted-foreground mb-4">Autentifică-te pentru a vedea coșul.</p>
          <Link to="/auth"><Button>Autentifică-te</Button></Link>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Coșul tău este gol</h1>
          <p className="text-muted-foreground mb-4">Descoperă produsele noastre!</p>
          <Link to="/catalog"><Button>Vezi produse</Button></Link>
        </div>
      </Layout>
    );
  }

  const shipping = totalPrice >= 200 ? 0 : 19.99;

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Coșul de cumpărături</h1>
        <Link to="/catalog" className="text-sm text-primary hover:underline mb-4 inline-block">← Continuă cumpărăturile</Link>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-card rounded-lg border p-4 flex gap-4">
                <img src={item.product.image_url || "/placeholder.svg"} alt={item.product.name} className="w-20 h-20 object-contain rounded" />
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.slug}`} className="font-medium text-sm hover:text-primary line-clamp-2">
                    {item.product.name}
                  </Link>
                  <p className="text-primary font-bold mt-1">{item.product.price.toLocaleString("ro-RO")} lei</p>
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
                  <p className="font-bold">{(item.product.price * item.quantity).toLocaleString("ro-RO")} lei</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-lg border p-6 h-fit sticky top-24 space-y-3">
            <h2 className="font-bold text-lg">Sumar comandă</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{totalPrice.toLocaleString("ro-RO")} lei</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livrare</span>
              <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "GRATUITĂ" : `${shipping} lei`}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{(totalPrice + shipping).toLocaleString("ro-RO")} lei</span>
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
