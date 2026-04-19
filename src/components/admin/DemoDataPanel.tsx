import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * DemoDataPanel — visible only when QA seed (`is_demo=true`) is present.
 * Lets admins purge all demo records (products, categories, brands, suppliers) in one click.
 * Hidden in pure-production state, so it doesn't clutter the dashboard.
 */
export default function DemoDataPanel() {
  const qc = useQueryClient();

  const { data: counts } = useQuery({
    queryKey: ["demo-data-counts"],
    queryFn: async () => {
      const [p, c, b, s] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_demo", true),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_demo", true),
        supabase.from("brands").select("id", { count: "exact", head: true }).eq("is_demo", true),
        supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("is_demo", true),
      ]);
      return {
        products: p.count || 0,
        categories: c.count || 0,
        brands: b.count || 0,
        suppliers: s.count || 0,
        total: (p.count || 0) + (c.count || 0) + (b.count || 0) + (s.count || 0),
      };
    },
    refetchInterval: 30000,
  });

  const purge = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("purge_demo_catalog");
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries();
      toast.success(`Date demo șterse: ${data?.products || 0} produse, ${data?.categories || 0} categorii, ${data?.brands || 0} mărci, ${data?.suppliers || 0} furnizori.`);
    },
    onError: (e: any) => toast.error(`Eroare ștergere: ${e.message}`),
  });

  if (!counts || counts.total === 0) return null;

  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Date de testare (QA seed) prezente</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px]">{counts.products} produse</Badge>
              <Badge variant="outline" className="text-[10px]">{counts.categories} categorii</Badge>
              <Badge variant="outline" className="text-[10px]">{counts.brands} mărci</Badge>
              <Badge variant="outline" className="text-[10px]">{counts.suppliers} furnizori</Badge>
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => { if (confirm(`Confirmi ștergerea a ${counts.total} înregistrări marcate DEMO? Acțiunea este ireversibilă.`)) purge.mutate(); }}
          disabled={purge.isPending}
          className="gap-1.5"
        >
          {purge.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Șterge toate datele DEMO
        </Button>
      </CardContent>
    </Card>
  );
}
