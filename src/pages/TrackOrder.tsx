import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/orderStatusLabels";

interface OrderResult {
  order_number: string;
  status: string;
  payment_status: string | null;
  total: number;
  created_at: string;
  awb_number: string | null;
  courier: string | null;
  delivered_at: string | null;
}

const statusIcon = (status: string) => {
  if (["delivered", "livrat"].includes(status)) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (["shipping", "expediata", "in_transit"].includes(status)) return <Truck className="h-5 w-5 text-blue-600" />;
  if (["cancelled", "anulata"].includes(status)) return <XCircle className="h-5 w-5 text-destructive" />;
  return <Clock className="h-5 w-5 text-amber-600" />;
};

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("orders")
        .select("order_number, status, payment_status, total, created_at, awb_number, courier, delivered_at, user_email")
        .eq("order_number", orderNumber.trim())
        .maybeSingle();

      if (dbErr || !data) {
        setError("Comanda nu a fost găsită. Verifică numărul și emailul folosit la comandă.");
      } else if (data.user_email && email && data.user_email.toLowerCase() !== email.trim().toLowerCase()) {
        setError("Emailul nu corespunde cu cel folosit la comandă.");
      } else {
        setResult(data as OrderResult);
      }
    } catch {
      setError("A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StorefrontLayout>
      <SeoHead
        title="Urmărire comandă — Mama Lucica"
        description="Verifică statusul comenzii tale folosind numărul de comandă și emailul. Urmărire AWB curier în timp real."
      />
      <main className="container max-w-2xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-8">
          <Package className="h-12 w-12 mx-auto text-primary mb-3" />
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">Urmărire comandă</h1>
          <p className="text-muted-foreground mt-2">Introdu numărul comenzii pentru a vedea statusul livrării.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalii comandă</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="order-num">Număr comandă *</Label>
                <Input
                  id="order-num"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  placeholder="ex: 12345"
                  required
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email folosit la comandă (opțional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemplu.ro"
                />
              </div>
              <Button type="submit" disabled={loading || !orderNumber.trim()} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Se caută..." : "Caută comandă"}
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Comanda</p>
                    <p className="font-mono font-semibold">#{result.order_number}</p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    {statusIcon(result.status)}
                    {ORDER_STATUS_LABELS[result.status] || result.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Plasată la</p>
                    <p>{new Date(result.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{Number(result.total).toFixed(2)} RON</p>
                  </div>
                  {result.payment_status && (
                    <div>
                      <p className="text-xs text-muted-foreground">Plată</p>
                      <p className="capitalize">{result.payment_status}</p>
                    </div>
                  )}
                  {result.delivered_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Livrată la</p>
                      <p>{new Date(result.delivered_at).toLocaleDateString("ro-RO")}</p>
                    </div>
                  )}
                </div>

                {result.awb_number && (
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground mb-1">AWB {result.courier || "Curier"}</p>
                    <p className="font-mono text-sm font-semibold">{result.awb_number}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Probleme cu comanda? <a href="/contact" className="text-primary underline">Contactează-ne</a>
        </p>
      </main>
    </StorefrontLayout>
  );
}
