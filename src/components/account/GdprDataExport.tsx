import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

export default function GdprDataExport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all user data in parallel
      const [profileRes, addressesRes, ordersRes, favoritesRes, loyaltyRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("addresses").select("*").eq("user_id", user.id),
        supabase.from("orders").select("id, order_number, status, total, payment_method, created_at, shipping_address").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("favorites").select("product_id, products(name, slug)").eq("user_id", user.id),
        supabase.from("loyalty_points").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const exportObj = {
        export_date: new Date().toISOString(),
        profile: {
          email: user.email,
          full_name: profileRes.data?.full_name,
          phone: profileRes.data?.phone,
          created_at: user.created_at,
        },
        addresses: (addressesRes.data || []).map((a: any) => ({
          label: a.label,
          full_name: a.full_name,
          address: a.address,
          city: a.city,
          county: a.county,
          postal_code: a.postal_code,
          phone: a.phone,
        })),
        orders: (ordersRes.data || []).map((o: any) => ({
          order_number: o.order_number,
          status: o.status,
          total: o.total,
          payment_method: o.payment_method,
          date: o.created_at,
        })),
        wishlist: (favoritesRes.data || []).map((f: any) => ({
          product: (f as any).products?.name,
          slug: (f as any).products?.slug,
        })),
        loyalty_points: (loyaltyRes.data || []).map((l: any) => ({
          points: l.points,
          action: l.action,
          description: l.description,
          date: l.created_at,
        })),
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `datele_mele_mamalucica_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Datele tale au fost descărcate!");
    } catch (err) {
      console.error("GDPR export error:", err);
      toast.error("Eroare la exportul datelor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={exportData} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
      Descarcă datele mele personale
    </Button>
  );
}
