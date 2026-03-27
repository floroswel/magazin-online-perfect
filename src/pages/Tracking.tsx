import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Tracking() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) { toast.error("Introduceți numărul comenzii"); return; }
    setLoading(true);
    setSearched(true);
    const { data } = await supabase.from("orders").select("id, status, created_at, tracking_number, tracking_url, courier, total, shipping_address").or(`id.eq.${orderId.trim()},id.ilike.${orderId.trim()}%`).maybeSingle();
    setOrder(data);
    if (!data) toast.error("Comanda nu a fost găsită");
    setLoading(false);
  };

  const statusLabels: Record<string, string> = { pending: "Plasată", processing: "Se Procesează", shipped: "Expediată", delivered: "Livrată", cancelled: "Anulată" };
  const statusSteps = ["pending", "processing", "shipped", "delivered"];

  return (
    <Layout>
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20">
        <div className="container max-w-xl text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-ventuza-gold mb-4 font-medium">Livrare</p>
          <h1 className="font-serif text-4xl font-medium mb-4">Urmărire Comandă</h1>
          <p className="text-secondary-foreground/60">Introdu numărul comenzii pentru a vedea statusul</p>
        </div>
      </section>

      <div className="container py-16 max-w-xl">
        <form onSubmit={handleSearch} className="space-y-4 mb-12">
          <Input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Numărul comenzii (ex: abc12345)" className="rounded-none border-foreground/20 h-12" />
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Adresa de email (opțional)" type="email" className="rounded-none border-foreground/20 h-12" />
          <Button type="submit" disabled={loading} className="w-full rounded-none h-12 bg-primary text-primary-foreground text-xs tracking-wider uppercase">
            {loading ? "Se caută..." : "Urmărește Comanda"}
          </Button>
        </form>

        {searched && order && (
          <div className="space-y-8">
            <div className="border border-border p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">Comanda</p>
                  <p className="font-mono text-sm font-medium">#{order.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">Status</p>
                  <p className="text-sm font-medium text-primary">{statusLabels[order.status] || order.status}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                {statusSteps.map((step, i) => {
                  const currentIdx = statusSteps.indexOf(order.status);
                  const isActive = i <= currentIdx;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 flex items-center justify-center text-xs font-medium border-2 ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                        {i + 1}
                      </div>
                      <p className={`text-[10px] mt-2 tracking-wide uppercase ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {statusLabels[step]}
                      </p>
                    </div>
                  );
                })}
              </div>

              {order.tracking_number && (
                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">Tracking</p>
                  <p className="font-mono text-sm">{order.tracking_number}</p>
                  {order.courier && <p className="text-xs text-muted-foreground capitalize">Curier: {order.courier}</p>}
                  {order.tracking_url && (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Urmărește la curier →
                    </a>
                  )}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Probleme cu comanda? <a href="mailto:contact@ventuza.ro" className="text-primary">Contactează-ne</a>
            </p>
          </div>
        )}

        {searched && !order && !loading && (
          <div className="text-center py-8">
            <p className="font-serif text-xl text-foreground mb-2">Comanda nu a fost găsită</p>
            <p className="text-sm text-muted-foreground">Verifică numărul comenzii și încearcă din nou.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
