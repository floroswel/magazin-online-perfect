import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useCurrency } from "@/hooks/useCurrency";
import { usePageSeo } from "@/components/SeoHead";
import { useSettings } from "@/hooks/useSettings";
import { Check, Package, MapPin, CreditCard, Calendar, ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { format } = useCurrency();
  const { settings } = useSettings();

  usePageSeo({ title: "Comandă confirmată | Mama Lucica", noindex: true });

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-confirmation", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", orderId!)
        .maybeSingle();
      return data;
    },
    enabled: !!orderId,
  });

  // Cross-sell: popular products
  const { data: popular } = useQuery({
    queryKey: ["post-purchase-recs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("visible", true)
        .gt("stock", 0)
        .order("total_sold", { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="ml-container py-20 text-center">
          <div className="h-16 w-16 mx-auto skeleton rounded-full mb-4" />
          <div className="h-6 skeleton rounded w-48 mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="ml-container py-20 text-center">
          <p className="text-lg font-bold">Comanda nu a fost găsită</p>
        </div>
      </Layout>
    );
  }

  const addr = order.shipping_address as any;
  const items = (order as any).items || [];
  const deliveryDays = settings.delivery_time || "2-3 zile lucrătoare";

  const paymentLabels: Record<string, string> = {
    card: "Card bancar (Netopia)",
    ramburs: "Ramburs la livrare",
    transfer: "Transfer bancar",
    mokka: "Mokka (rate)",
    paypo: "PayPo (BNPL)",
  };

  return (
    <Layout>
      <div className="ml-container py-10 max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-ml-success text-white flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">Comandă confirmată!</h1>
          <p className="text-sm text-muted-foreground mb-1">Mulțumim pentru comanda ta!</p>
          <p className="text-primary font-bold text-xl mb-1">
            #{(order as any).order_number || order.id.slice(0, 8)}
          </p>
          <p className="text-xs text-muted-foreground">
            Vei primi un email de confirmare la <strong>{order.user_email}</strong>
          </p>
        </div>

        {/* Order items */}
        {items.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-5 mb-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> Produse comandate
            </h3>
            <div className="divide-y divide-border">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold">{format(item.total_price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Plată
            </h3>
            <p className="text-sm font-semibold">{paymentLabels[order.payment_method] || order.payment_method}</p>
            <p className="text-lg font-extrabold text-primary mt-1">{format(order.total || 0)}</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Livrare
            </h3>
            {addr && (
              <p className="text-sm">{addr.street || addr.address}, {addr.city}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Estimare: {deliveryDays}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            to="/tracking"
            className="h-11 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-ml-primary-dark"
          >
            Urmărește comanda <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/account"
            className="h-11 px-6 border border-border rounded-lg text-sm font-semibold flex items-center justify-center hover:bg-secondary"
          >
            Comenzile mele
          </Link>
          <Link
            to="/catalog"
            className="h-11 px-6 border border-border rounded-lg text-sm font-semibold flex items-center justify-center hover:bg-secondary"
          >
            Continuă cumpărăturile
          </Link>
        </div>

        {/* Cross-sell */}
        {popular && popular.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 text-center">💡 Ți-ar putea plăcea</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {popular.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
