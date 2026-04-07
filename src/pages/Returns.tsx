import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";
import { RotateCcw, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReturnRequestForm from "@/components/account/ReturnRequestForm";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "În așteptare", variant: "secondary" },
  approved: { label: "Aprobat", variant: "default" },
  rejected: { label: "Respins", variant: "destructive" },
  completed: { label: "Finalizat", variant: "outline" },
};

export default function Returns() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  usePageSeo({ title: "Retururi | LUMAX", noindex: true });

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // Fetch existing return requests
  const { data: returns, refetch } = useQuery({
    queryKey: ["my-returns", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("returns")
        .select("*, return_request_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch orders eligible for return
  const { data: orders } = useQuery({
    queryKey: ["my-orders-for-return", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user!.id)
        .in("status", ["delivered", "completed", "livrat"])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <Layout>
      <div className="lumax-container py-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Retururile mele
          </h1>
        </div>

        {/* Start new return */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="text-sm font-bold mb-3">Inițiază un retur nou</h2>
          {orders && orders.length > 0 ? (
            <div className="space-y-2">
              {orders.map((order: any) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowForm(true);
                  }}
                  className="w-full flex items-center justify-between gap-3 border border-border rounded-lg p-3 hover:bg-secondary transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Comanda #{order.id?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("ro-RO")} · {order.order_items?.length || 0} produse
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nu ai comenzi eligibile pentru retur.</p>
          )}
        </div>

        {/* Existing returns */}
        <h2 className="text-sm font-bold mb-3">Istoricul retururilor</h2>
        {returns && returns.length > 0 ? (
          <div className="space-y-3">
            {returns.map((ret: any) => {
              const st = statusLabels[ret.status] || statusLabels.pending;
              return (
                <div key={ret.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">Retur #{ret.id?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ret.created_at).toLocaleDateString("ro-RO")} · {ret.type === "return" ? "Rambursare" : "Schimb"}
                      </p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  {ret.reason && <p className="text-xs text-muted-foreground">Motiv: {ret.reason}</p>}
                  {ret.return_request_items && ret.return_request_items.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {ret.return_request_items.map((item: any) => (
                        <p key={item.id} className="text-xs">
                          • {item.product_name} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nu ai niciun retur.</p>
          </div>
        )}

        {/* Return form dialog */}
        {selectedOrder && (
          <ReturnRequestForm
            order={selectedOrder}
            open={showForm}
            onClose={() => {
              setShowForm(false);
              setSelectedOrder(null);
            }}
            onSuccess={() => refetch()}
            userId={user?.id || ""}
          />
        )}
      </div>
    </Layout>
  );
}
