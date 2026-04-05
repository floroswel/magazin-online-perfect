import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useCurrency } from "@/hooks/useCurrency";
import { usePageSeo } from "@/components/SeoHead";
import { Check } from "lucide-react";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const { format } = useCurrency();

  usePageSeo({ title: "Comandă confirmată | LUMAX", noindex: true });

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-confirmation", orderId],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, items:order_items(*)").eq("id", orderId!).maybeSingle();
      return data;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return <Layout><div className="lumax-container py-20 text-center"><div className="h-16 w-16 mx-auto skeleton rounded-full mb-4" /><div className="h-6 skeleton rounded w-48 mx-auto" /></div></Layout>;
  }

  if (!order) {
    return <Layout><div className="lumax-container py-20 text-center"><p className="text-lg font-bold">Comanda nu a fost găsită</p></div></Layout>;
  }

  const addr = order.shipping_address as any;

  return (
    <Layout>
      <div className="lumax-container py-12 max-w-xl mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-lumax-green text-white flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Comandă confirmată!</h1>
        <p className="text-sm text-muted-foreground mb-1">Mulțumim pentru comanda ta!</p>
        <p className="text-primary font-bold text-lg mb-1">#{(order as any).order_number || order.id.slice(0, 8)}</p>
        <p className="text-xs text-muted-foreground mb-8">Am trimis confirmarea pe {order.user_email}</p>

        <div className="bg-card rounded-xl border border-border p-5 text-left space-y-3 mb-6">
          <h3 className="text-sm font-bold">Detalii comandă</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">{format(order.total || 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plată</span><span>{order.payment_method}</span></div>
            {addr && <div className="flex justify-between"><span className="text-muted-foreground">Adresa</span><span className="text-right text-xs">{addr.street}, {addr.city}</span></div>}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/account" className="h-11 px-6 border border-border rounded-lg text-sm font-semibold flex items-center hover:bg-secondary">Comenzile mele</Link>
          <Link to="/catalog" className="h-11 px-6 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center hover:bg-lumax-blue-dark">Continuă cumpărăturile</Link>
        </div>
      </div>
    </Layout>
  );
}