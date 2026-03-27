import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useEffect } from "react";

const statusSteps = [
  { key: "pending", label: "Comandă plasată", icon: Clock },
  { key: "confirmed", label: "Confirmată", icon: CheckCircle },
  { key: "processing", label: "În preparare", icon: Package },
  { key: "shipped", label: "Expediată", icon: Truck },
  { key: "delivered", label: "Livrată", icon: CheckCircle },
];

export default function Tracking() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);

    const cleanId = orderId.trim().replace(/^#/, "");

    const { data, error: err } = await supabase
      .from("orders")
      .select("id, status, created_at, total, shipping_address, tracking_number, shipping_method")
      .or(`id.eq.${cleanId},order_number.eq.${cleanId}`)
      .limit(1)
      .maybeSingle();

    if (err || !data) {
      setError("Nu am găsit nicio comandă cu aceste date. Verifică numărul comenzii și adresa de email.");
    } else {
      setOrder(data);
    }
    setLoading(false);
  };

  useEffect(() => { document.title = "Urmărire Comandă | VENTUZA"; }, []);

  const currentStepIndex = order ? statusSteps.findIndex(s => s.key === order.status) : -1;

  return (
    <Layout>
      <div className="container py-8 max-w-xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Urmărire Comandă</h1>
        <p className="text-muted-foreground mb-6">Introdu datele comenzii pentru a vedea statusul în timp real.</p>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label>Număr comandă</Label>
                <Input placeholder="ex: #12345 sau UUID" value={orderId} onChange={e => setOrderId(e.target.value)} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="email@exemplu.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Se caută..." : "Caută comanda"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="mt-6 border-destructive">
            <CardContent className="pt-6 flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {order && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Comanda #{order.id.slice(0, 8)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Plasată pe {new Date(order.created_at).toLocaleDateString("ro-RO")} • Total: {Number(order.total).toFixed(2)} RON
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusSteps.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <span className={`text-sm ${isCurrent ? "font-semibold text-foreground" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {order.tracking_number && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Număr AWB: {order.tracking_number}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Curier: {order.shipping_method || "Sameday"}
                  </p>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Ai nevoie de ajutor? <a href="mailto:contact@ventuza.ro" className="text-primary hover:underline">Contactează-ne</a>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
