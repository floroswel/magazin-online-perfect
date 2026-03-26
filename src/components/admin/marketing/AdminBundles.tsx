import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Package, Plus, Trash2, Edit, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminBundles() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", price_mode: "fixed", fixed_price: 0, discount_percent: 10, is_active: true });

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const { data } = await supabase.from("product_bundles").select("*, product_bundle_items(*, products(name, price, image_url))").order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["all-products-list"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, price, image_url").order("name").limit(500);
      return (data as any[]) || [];
    },
  });

  const createBundle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_bundles").insert({
        name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        price_mode: form.price_mode, fixed_price: form.fixed_price, discount_percent: form.discount_percent,
        is_active: form.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      setDialogOpen(false);
      setForm({ name: "", slug: "", price_mode: "fixed", fixed_price: 0, discount_percent: 10, is_active: true });
      toast.success("Bundle creat!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("product_bundles").update({ is_active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
    toast.success(active ? "Bundle dezactivat" : "Bundle activat");
  };

  const deleteBundle = async (id: string) => {
    await supabase.from("product_bundle_items").delete().eq("bundle_id", id);
    await supabase.from("product_bundles").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
    toast.success("Bundle șters!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5" /> Pachete & Kit-uri (Bundles)</h1>
          <p className="text-sm text-muted-foreground">Creează și gestionează pachete de produse cu discount.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Bundle nou</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Creare pachet nou</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nume pachet</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pachet Gaming Complet" /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="pachet-gaming-complet" /></div>
              <div><Label>Mod preț</Label>
                <Select value={form.price_mode} onValueChange={v => setForm(f => ({ ...f, price_mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Preț fix</SelectItem>
                    <SelectItem value="dynamic">Dinamic (sumă - discount%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.price_mode === "fixed" ? (
                <div><Label>Preț fix (RON)</Label><Input type="number" value={form.fixed_price} onChange={e => setForm(f => ({ ...f, fixed_price: +e.target.value }))} /></div>
              ) : (
                <div><Label>Discount (%)</Label><Input type="number" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: +e.target.value }))} /></div>
              )}
              <div className="flex items-center justify-between"><Label>Activ</Label><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /></div>
            </div>
            <DialogFooter><Button onClick={() => createBundle.mutate()} disabled={!form.name.trim()}>Creează</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{bundles.length}</p><p className="text-xs text-muted-foreground">Total pachete</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{bundles.filter((b: any) => b.is_active).length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-2xl font-bold">{bundles.reduce((s: number, b: any) => s + (b.product_bundle_items?.length || 0), 0)}</p><p className="text-xs text-muted-foreground">Total produse în pachete</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Toate pachetele</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Pachet</TableHead><TableHead>Produse</TableHead><TableHead>Mod preț</TableHead><TableHead>Preț/Discount</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Acțiuni</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : bundles.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Niciun pachet creat.</TableCell></TableRow>
              ) : bundles.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell><Badge variant="secondary">{b.product_bundle_items?.length || 0} produse</Badge></TableCell>
                  <TableCell className="text-sm">{b.price_mode === "fixed" ? "Fix" : "Dinamic"}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {b.price_mode === "fixed" ? `${b.fixed_price} RON` : `-${b.discount_percent}%`}
                  </TableCell>
                  <TableCell>
                    <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBundle(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
