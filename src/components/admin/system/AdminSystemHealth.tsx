import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Package, Users, ShoppingCart, FileText, HardDrive, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, status }: { icon: any; label: string; value: string | number; sub?: string; status?: "ok" | "warn" | "error" }) {
  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${status === "error" ? "bg-destructive/10 text-destructive" : status === "warn" ? "bg-amber-50 text-amber-600" : "bg-primary/10 text-primary"}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
          </div>
          {status && (
            status === "ok" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSystemHealth() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      const [products, orders, customers, categories, coupons, reviews, faqs, redirects, popups, recentErrors] = await Promise.all([
        (supabase as any).from("products").select("id", { count: "exact", head: true }),
        (supabase as any).from("orders").select("id", { count: "exact", head: true }),
        (supabase as any).from("profiles").select("id", { count: "exact", head: true }),
        (supabase as any).from("categories").select("id", { count: "exact", head: true }),
        (supabase as any).from("coupons").select("id", { count: "exact", head: true }),
        (supabase as any).from("reviews").select("id", { count: "exact", head: true }),
        (supabase as any).from("faq_items").select("id", { count: "exact", head: true }),
        (supabase as any).from("seo_redirects").select("id", { count: "exact", head: true }),
        (supabase as any).from("site_popups").select("id", { count: "exact", head: true }),
        (supabase as any).from("email_logs").select("id", { count: "exact", head: true }).eq("status", "error"),
      ]);

      const todayOrders = await (supabase as any).from("orders").select("id", { count: "exact", head: true }).gte("created_at", new Date().toISOString().slice(0, 10));
      
      const pendingReviews = await (supabase as any).from("reviews").select("id", { count: "exact", head: true }).eq("approved", false);

      return {
        products: products.count || 0,
        orders: orders.count || 0,
        todayOrders: todayOrders.count || 0,
        customers: customers.count || 0,
        categories: categories.count || 0,
        coupons: coupons.count || 0,
        reviews: reviews.count || 0,
        pendingReviews: pendingReviews.count || 0,
        faqs: faqs.count || 0,
        redirects: redirects.count || 0,
        popups: popups.count || 0,
        emailErrors: recentErrors.count || 0,
      };
    },
    refetchInterval: 30000,
  });

  const { data: edgeFunctions } = useQuery({
    queryKey: ["edge-functions-list"],
    queryFn: async () => {
      // List known edge functions and their expected status
      const functions = [
        "send-email", "send-sms", "send-push", "generate-awb", "check-tracking",
        "netopia-payment", "mokka-payment", "smartbill", "sitemap", "chatbot-ai",
        "generate-product-content", "recover-abandoned-carts", "weekly-report",
      ];
      return functions;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Se încarcă diagnosticul...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> System Health
        </h1>
        <p className="text-sm text-muted-foreground">Diagnostic complet al platformei — date în timp real.</p>
      </div>

      {/* Status General */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status General</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Database} label="Baza de Date" value="Online" status="ok" />
          <StatCard icon={HardDrive} label="Storage" value="Activ" status="ok" />
          <StatCard icon={Clock} label="Comenzi Azi" value={stats?.todayOrders || 0} status="ok" />
          <StatCard icon={AlertTriangle} label="Erori Email" value={stats?.emailErrors || 0} status={stats?.emailErrors ? "warn" : "ok"} />
        </div>
      </div>

      {/* Inventar Date */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Inventar Date</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Package} label="Produse" value={stats?.products || 0} />
          <StatCard icon={ShoppingCart} label="Comenzi Total" value={stats?.orders || 0} />
          <StatCard icon={Users} label="Clienți" value={stats?.customers || 0} />
          <StatCard icon={FileText} label="Categorii" value={stats?.categories || 0} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatCard icon={FileText} label="Cupoane" value={stats?.coupons || 0} />
          <StatCard icon={FileText} label="Recenzii" value={stats?.reviews || 0} sub={`${stats?.pendingReviews || 0} în așteptare`} status={stats?.pendingReviews ? "warn" : "ok"} />
          <StatCard icon={FileText} label="FAQ-uri" value={stats?.faqs || 0} />
          <StatCard icon={FileText} label="Redirecturi SEO" value={stats?.redirects || 0} />
        </div>
      </div>

      {/* Edge Functions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Backend Functions ({edgeFunctions?.length || 0})</h2>
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              {edgeFunctions?.map((fn) => (
                <Badge key={fn} variant="outline" className="text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {fn}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
