import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";
import {
  RotateCcw, Package, Clock, CheckCircle2, XCircle,
  AlertTriangle, ShieldCheck, Truck, CreditCard, Info, ArrowRight, Search, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import ReturnRequestForm from "@/components/account/ReturnRequestForm";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock; color: string }> = {
  pending: { label: "În așteptare", variant: "secondary", icon: Clock, color: "text-amber-500" },
  approved: { label: "Aprobat", variant: "default", icon: CheckCircle2, color: "text-green-600" },
  rejected: { label: "Respins", variant: "destructive", icon: XCircle, color: "text-destructive" },
  completed: { label: "Finalizat", variant: "outline", icon: CheckCircle2, color: "text-primary" },
  processing: { label: "Se procesează", variant: "secondary", icon: RotateCcw, color: "text-blue-500" },
};

function ReturnPolicyInfo() {
  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 md:p-5 space-y-3">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Politica de retur — Ce trebuie să știi
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex gap-2.5">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold">14 zile calendaristice</p>
            <p className="text-[11px] text-muted-foreground">Drept de retragere de la primirea coletului</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Truck className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold">Transport retur</p>
            <p className="text-[11px] text-muted-foreground">Trimite prin curier sau solicită ridicare</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold">Rambursare rapidă</p>
            <p className="text-[11px] text-muted-foreground">În cont bancar sau Wallet, max. 14 zile</p>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
        Conform Directivei UE 2011/83/EU și OUG 34/2014, ai dreptul de retragere din contract fără a invoca un motiv.{" "}
        <Link to="/politica-de-retur" className="text-primary underline">
          Citește politica completă →
        </Link>
      </p>
    </div>
  );
}

function ReturnTimeline({ ret }: { ret: any }) {
  const steps = [
    { key: "submitted", label: "Cerere trimisă", done: true, date: ret.created_at },
    { key: "approved", label: "Aprobat", done: ["approved", "completed"].includes(ret.status), date: ret.approved_at },
    { key: "shipped", label: "Colet trimis", done: ret.status === "completed", date: null },
    { key: "completed", label: "Rambursare efectuată", done: ret.status === "completed", date: ret.completed_at },
  ];
  if (ret.status === "rejected") {
    steps[1] = { key: "rejected", label: "Respins", done: true, date: ret.updated_at };
  }

  return (
    <div className="flex items-center gap-0 mt-3">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full border-2 ${step.done ? (step.key === "rejected" ? "bg-destructive border-destructive" : "bg-primary border-primary") : "bg-background border-muted-foreground/30"}`} />
            <p className={`text-[10px] mt-1 text-center leading-tight ${step.done ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </p>
            {step.done && step.date && (
              <p className="text-[9px] text-muted-foreground">{new Date(step.date).toLocaleDateString("ro-RO")}</p>
            )}
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mt-[-16px] ${step.done ? "bg-primary" : "bg-muted-foreground/20"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Guest Order Lookup ─────────────── */
function GuestOrderLookup({ onOrderFound }: { onOrderFound: (order: any, email: string) => void }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("guest-return", {
        body: { action: "lookup", order_number: orderNumber.trim(), email: email.trim() },
      });

      // Handle edge function errors - fnErr may contain the response body with error message
      if (fnErr) {
        // Try to extract error message from the FunctionsHttpError context
        let errorMsg = "Eroare la căutare. Încearcă din nou.";
        try {
          if (typeof fnErr === "object" && fnErr.context) {
            const body = await fnErr.context.json();
            if (body?.error) errorMsg = body.error;
          } else if (fnErr.message) {
            errorMsg = fnErr.message;
          }
        } catch { /* use default */ }
        setError(errorMsg);
      } else if (data?.error) {
        setError(data.error);
      } else if (data?.order) {
        onOrderFound(data.order, email.trim());
      }
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
    }
    setLoading(false);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Search className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold">Caută comanda ta</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Introdu numărul comenzii și adresa de email folosită la plasarea comenzii.
      </p>
      <form onSubmit={handleLookup} className="space-y-3">
        <div>
          <Label className="text-xs">Număr comandă</Label>
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ex: 12345"
            maxLength={20}
          />
        </div>
        <div>
          <Label className="text-xs">Email comandă</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplu.ro"
            maxLength={255}
          />
        </div>
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading || !orderNumber.trim() || !email.trim()}>
          {loading ? "Se caută..." : "Caută comanda"}
        </Button>
      </form>
    </div>
  );
}

/* ─────────────── Guest Return Form (simplified) ─────────────── */
function GuestReturnForm({ order, guestEmail, onSuccess }: { order: any; guestEmail: string; onSuccess: () => void }) {
  return (
    <ReturnRequestForm
      order={order}
      open={true}
      onClose={onSuccess}
      onSuccess={onSuccess}
      userId={order.user_id || ""}
      guestEmail={guestEmail}
    />
  );
}

/* ─────────────── Main Page ─────────────── */
export default function Returns() {
  const { user } = useAuth();
  usePageSeo({ title: "Retururi | LUMAX", noindex: true });

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  // Guest state
  const [guestOrder, setGuestOrder] = useState<any>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestSubmitted, setGuestSubmitted] = useState(false);

  // Logged-in queries
  const { data: returns, isLoading: returnsLoading, refetch } = useQuery({
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

   const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders-for-return", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(id, product_id, quantity, price)")
        .eq("user_id", user!.id)
        .in("status", ["delivered", "completed", "livrat"])
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });
      
      // Enrich order_items with product names
      if (data && data.length > 0) {
        const allProductIds = data.flatMap((o: any) => (o.order_items || []).map((i: any) => i.product_id)).filter(Boolean);
        const uniqueIds = [...new Set(allProductIds)];
        if (uniqueIds.length > 0) {
          const { data: products } = await supabase.from("products").select("id, name, image_url").in("id", uniqueIds);
          const pMap: Record<string, any> = {};
          (products || []).forEach((p: any) => { pMap[p.id] = p; });
          for (const order of data) {
            order.order_items = (order.order_items || []).map((item: any) => ({
              ...item,
              product_name: pMap[item.product_id]?.name || "Produs",
              image_url: pMap[item.product_id]?.image_url || null,
              unit_price: item.price,
            }));
          }
        }
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const ordersWithReturns = new Set((returns || []).map((r: any) => r.order_id));
  const eligibleOrders = (orders || []).filter((o: any) => !ordersWithReturns.has(o.id));
  const activeReturns = (returns || []).filter((r: any) => ["pending", "approved", "processing"].includes(r.status));
  const pastReturns = (returns || []).filter((r: any) => ["completed", "rejected"].includes(r.status));

  const isGuest = !user;

  return (
    <Layout>
      <div className="lumax-container py-6 pb-12 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-extrabold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Formular de Retur
          </h1>
          {!isGuest && returns && returns.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeReturns.length} activ{activeReturns.length !== 1 ? "e" : ""}
            </Badge>
          )}
        </div>

        <ReturnPolicyInfo />

        {/* ───── GUEST FLOW ───── */}
        {isGuest && (
          <div className="mt-5 space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
              <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Nu ai cont? Nicio problemă!</p>
                <p className="text-xs text-muted-foreground">
                  Poți iniția un retur folosind numărul comenzii și emailul cu care ai plasat comanda.
                  Dacă ai cont, <Link to="/auth" className="text-primary underline">autentifică-te</Link> pentru a vedea și istoricul retururilor.
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Cum funcționează</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { step: "1", text: "Caută comanda" },
                  { step: "2", text: "Alege produsele și motivul" },
                  { step: "3", text: "Trimite coletul retur" },
                  { step: "4", text: "Primești rambursarea" },
                ].map((s) => (
                  <div key={s.step} className="flex sm:flex-col items-center sm:items-center gap-2 text-center">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {s.step}
                    </div>
                    <p className="text-xs font-medium">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

             {guestSubmitted ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h2 className="text-lg font-bold mb-1">Cererea de retur a fost trimisă!</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Vei primi un email de confirmare la adresa {guestEmail}. Vom procesa cererea în cel mai scurt timp.
                </p>
                <Button variant="outline" onClick={() => { setGuestSubmitted(false); setGuestOrder(null); setGuestEmail(""); }}>
                  Fă un alt retur
                </Button>
              </div>
            ) : !guestOrder ? (
              <GuestOrderLookup onOrderFound={(order, email) => { setGuestOrder(order); setGuestEmail(email); }} />
            ) : (
              <>
                {/* Found order summary */}
                <div className="bg-card border border-primary/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <p className="text-sm font-bold">Comanda #{guestOrder.order_number || guestOrder.id?.slice(0, 8)}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setGuestOrder(null); setGuestEmail(""); }}>
                      Altă comandă
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(guestOrder.created_at).toLocaleDateString("ro-RO")} · {guestOrder.order_items?.length || 0} produs(e) · {Number(guestOrder.total || 0).toFixed(2)} RON
                  </p>
                  {guestOrder.return_deadline && (
                    <p className="text-xs mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span className="text-muted-foreground">Termen limită retur:</span>{" "}
                      <span className="font-semibold">{new Date(guestOrder.return_deadline).toLocaleDateString("ro-RO")}</span>
                      <span className="text-muted-foreground">({guestOrder.return_window_days} zile de la livrare)</span>
                    </p>
                  )}
                </div>
                <ReturnRequestForm
                  order={guestOrder}
                  open={true}
                  onClose={() => { setGuestOrder(null); setGuestEmail(""); }}
                  onSuccess={() => { setGuestSubmitted(true); }}
                  userId={guestOrder.user_id || ""}
                  guestEmail={guestEmail}
                  inline
                />
              </>
            )}
          </div>
        )}

        {/* ───── LOGGED-IN FLOW ───── */}
        {!isGuest && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mt-5 mb-4 border-b border-border">
              <button
                onClick={() => setActiveTab("new")}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === "new" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Retur nou
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Istoric retururi
                {returns && returns.length > 0 && (
                  <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{returns.length}</span>
                )}
              </button>
            </div>

            {/* TAB: New return */}
            {activeTab === "new" && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Cum funcționează</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {[
                      { step: "1", text: "Selectează comanda" },
                      { step: "2", text: "Alege produsele și motivul" },
                      { step: "3", text: "Trimite coletul retur" },
                      { step: "4", text: "Primești rambursarea" },
                    ].map((s) => (
                      <div key={s.step} className="flex sm:flex-col items-center sm:items-center gap-2 text-center">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {s.step}
                        </div>
                        <p className="text-xs font-medium">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-sm font-bold mb-1">Selectează comanda pentru retur</h2>
                  <p className="text-xs text-muted-foreground mb-4">Sunt afișate comenzile livrate din ultimele 30 de zile.</p>

                  {ordersLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                    </div>
                  ) : eligibleOrders.length > 0 ? (
                    <div className="space-y-2">
                      {eligibleOrders.map((order: any) => {
                        const itemCount = order.order_items?.length || 0;
                        const totalValue = order.total || 0;
                        const deliveredDate = order.delivered_at || order.updated_at || order.created_at;
                        const daysLeft = Math.max(0, 14 - Math.floor((Date.now() - new Date(deliveredDate).getTime()) / 86400000));

                        return (
                          <button
                            key={order.id}
                            onClick={() => { setSelectedOrder(order); setShowForm(true); }}
                            className="w-full flex items-center justify-between gap-3 border border-border rounded-lg p-3 md:p-4 hover:bg-secondary hover:border-primary/30 transition-all text-left group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">Comanda #{order.order_number || order.id?.slice(0, 8)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString("ro-RO")} · {itemCount} produs{itemCount !== 1 ? "e" : ""} · {Number(totalValue).toFixed(2)} RON
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {daysLeft <= 5 && daysLeft > 0 && (
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">
                                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                                  {daysLeft} zile rămase
                                </Badge>
                              )}
                              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                       <p className="text-sm font-medium mb-1">Nu ai comenzi eligibile pentru retur</p>
                      <p className="text-xs text-muted-foreground mb-3">Comenzile livrate în ultimele 30 de zile sunt eligibile.</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.href = "/account"}>
                        <Package className="h-3.5 w-3.5 mr-1" /> Vezi comenzile mele
                      </Button>
                    </div>
                  )}

                  {ordersWithReturns.size > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {ordersWithReturns.size} comandă/comenzi au deja cerere de retur activă.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: History */}
            {activeTab === "history" && (
              <div className="space-y-4">
                {activeReturns.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Retururi active</h3>
                    <div className="space-y-3">
                      {activeReturns.map((ret: any) => {
                        const st = statusConfig[ret.status] || statusConfig.pending;
                        const StatusIcon = st.icon;
                        return (
                          <div key={ret.id} className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <p className="text-sm font-semibold flex items-center gap-1.5">
                                  <StatusIcon className={`h-4 w-4 ${st.color}`} />
                                  Retur #{ret.id?.slice(0, 8)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(ret.created_at).toLocaleDateString("ro-RO")} · {ret.type === "return" ? "Rambursare" : ret.type === "same_exchange" ? "Schimb același produs" : "Schimb alt produs"}
                                </p>
                              </div>
                              <Badge variant={st.variant}>{st.label}</Badge>
                            </div>
                            {ret.return_request_items && ret.return_request_items.length > 0 && (
                              <div className="mt-2 bg-muted/40 rounded-lg p-2.5 space-y-1">
                                {ret.return_request_items.map((item: any) => (
                                  <p key={item.id} className="text-xs flex justify-between">
                                    <span>• {item.product_name} × {item.quantity}</span>
                                    <span className="text-muted-foreground">{Number(item.total_value || 0).toFixed(2)} RON</span>
                                  </p>
                                ))}
                              </div>
                            )}
                            {ret.reason && <p className="text-[11px] text-muted-foreground mt-2">Motiv: {ret.reason}</p>}
                            <ReturnTimeline ret={ret} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pastReturns.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Istoric finalizat</h3>
                    <div className="space-y-2">
                      {pastReturns.map((ret: any) => {
                        const st = statusConfig[ret.status] || statusConfig.pending;
                        const StatusIcon = st.icon;
                        return (
                          <div key={ret.id} className="bg-card border border-border rounded-xl p-4 opacity-80">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium flex items-center gap-1.5">
                                  <StatusIcon className={`h-3.5 w-3.5 ${st.color}`} />
                                  Retur #{ret.id?.slice(0, 8)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(ret.created_at).toLocaleDateString("ro-RO")} · {ret.type === "return" ? "Rambursare" : "Schimb"}
                                </p>
                              </div>
                              <Badge variant={st.variant}>{st.label}</Badge>
                            </div>
                            {ret.return_request_items && ret.return_request_items.length > 0 && (
                              <div className="mt-2 space-y-0.5">
                                {ret.return_request_items.map((item: any) => (
                                  <p key={item.id} className="text-[11px] text-muted-foreground">• {item.product_name} × {item.quantity}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {returnsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                  </div>
                ) : (!returns || returns.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium mb-1">Nu ai niciun retur</p>
                    <p className="text-xs text-muted-foreground mb-4">Când vei iniția un retur, acesta va apărea aici.</p>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("new")}>
                      Inițiază un retur
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Return form dialog for logged-in users */}
            {selectedOrder && (
              <ReturnRequestForm
                order={selectedOrder}
                open={showForm}
                onClose={() => { setShowForm(false); setSelectedOrder(null); }}
                onSuccess={() => { refetch(); setActiveTab("history"); }}
                userId={user?.id || ""}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
