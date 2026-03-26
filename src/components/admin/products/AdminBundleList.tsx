import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Package, Plus, Trash2, Edit, ImageIcon, Settings } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AdminBundleEditor from "./AdminBundleEditor";

export default function AdminBundleList() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["bundle-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("bundle_settings" as any).select("*").limit(1).maybeSingle();
      return data as any;
    },
  });

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ["admin-bundles-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bundle_products" as any)
        .select("*, bundle_components(id, product_id, quantity)")
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("bundle_products" as any).update({ status: newStatus } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles-list"] });
      toast.success("Status actualizat!");
    },
  });

  const deleteBundle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bundle_products" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles-list"] });
      toast.success("Pachet șters!");
    },
  });

  if (!settings?.enabled) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="pt-8 pb-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Modul Pachete Dezactivat</h3>
          <p className="text-sm text-muted-foreground mb-4">Activează modulul de pachete din setări pentru a folosi această funcție.</p>
          <Link to="/admin/settings/bundles">
            <Button variant="outline"><Settings className="w-4 h-4 mr-1" /> Setări Pachete</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (creating || editingId) {
    return (
      <AdminBundleEditor
        bundleId={editingId || undefined}
        onBack={() => {
          setEditingId(null);
          setCreating(false);
          queryClient.invalidateQueries({ queryKey: ["admin-bundles-list"] });
        }}
      />
    );
  }

  const activeCount = bundles.filter((b: any) => b.status === "active").length;
  const totalComponents = bundles.reduce((s: number, b: any) => s + (b.bundle_components?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Pachete de Produse (Bundles)
          </h1>
          <p className="text-sm text-muted-foreground">Creează și gestionează pachete de produse cu discount</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/settings/bundles">
            <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1" /> Setări</Button>
          </Link>
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-1" /> Adaugă Pachet
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{bundles.length}</p>
            <p className="text-xs text-muted-foreground">Total pachete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-foreground">{totalComponents}</p>
            <p className="text-xs text-muted-foreground">Total componente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toate pachetele</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pachet</TableHead>
                <TableHead>Componente</TableHead>
                <TableHead>Tip preț</TableHead>
                <TableHead>Preț / Discount</TableHead>
                <TableHead>Disponibilitate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : bundles.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Niciun pachet creat.</TableCell></TableRow>
              ) : bundles.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                        {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{b.name}</p>
                        <p className="text-xs text-muted-foreground">/{b.slug}</p>
                      </div>
                      <Badge variant="outline" className="ml-1 text-xs bg-primary/10 text-primary border-primary/30">PACHET</Badge>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{b.bundle_components?.length || 0} produse</Badge></TableCell>
                  <TableCell className="text-sm">{b.price_type === "fixed" ? "Fix" : "Procentual"}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {b.price_type === "fixed" ? `${b.price_value} RON` : `${b.price_value}% din total`}
                    {b.original_total_value > 0 && (
                      <span className="text-xs text-muted-foreground ml-1 line-through">{b.original_total_value} RON</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {b.availability_rule === "regardless" ? "Oricând" : "Toate disp."}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={b.status === "active"}
                      onCheckedChange={() => toggleStatus.mutate({ id: b.id, status: b.status })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(b.id)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBundle.mutate(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
