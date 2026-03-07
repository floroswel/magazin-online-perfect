import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Plus, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Relation = {
  id: string;
  product_id: string;
  related_product_id: string;
  relation_type: string;
  sort_order: number | null;
  source_name?: string;
  target_name?: string;
};

const typeLabels: Record<string, string> = {
  upsell: "Upsell",
  cross_sell: "Cross-sell",
  accessory: "Accesoriu",
  similar: "Similar",
  frequently_bought: "Cumpărate împreună",
};

export default function AdminUpsell() {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ source: "", target: "", type: "cross_sell" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("product_relations").select("*").order("sort_order");
    if (data) {
      const pIds = [...new Set(data.flatMap(r => [r.product_id, r.related_product_id]))];
      const { data: prods } = await supabase.from("products").select("id, name").in("id", pIds.length ? pIds : ["_"]);
      const nameMap = Object.fromEntries((prods || []).map(p => [p.id, p.name]));
      setRelations(data.map(r => ({ ...r, source_name: nameMap[r.product_id] || "?", target_name: nameMap[r.related_product_id] || "?" })));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.from("products").select("id, name").order("name").limit(200).then(({ data }) => setProducts(data || []));
  }, []);

  const handleAdd = async () => {
    if (!form.source || !form.target) return;
    const { error } = await supabase.from("product_relations").insert({
      product_id: form.source,
      related_product_id: form.target,
      relation_type: form.type,
    });
    if (error) { toast({ title: "Eroare", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Relație adăugată" });
    setDialogOpen(false);
    setForm({ source: "", target: "", type: "cross_sell" });
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("product_relations").delete().eq("id", id);
    setRelations(r => r.filter(x => x.id !== id));
    toast({ title: "Relație ștearsă" });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Upsell / Cross-sell</h1>
          <p className="text-sm text-muted-foreground">Configurare relații între produse pentru creșterea valorii coșului.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Relație nouă</Button>
      </div>

      {relations.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nu există relații între produse. Adaugă prima relație upsell/cross-sell.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {relations.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{r.source_name}</p>
                    <span className="text-muted-foreground text-xs">→</span>
                    <p className="font-semibold text-sm truncate">{r.target_name}</p>
                    <Badge variant="outline" className="text-[10px]">{typeLabels[r.relation_type] || r.relation_type}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adaugă relație produs</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Produs sursă</Label>
              <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue placeholder="Selectează produs" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Produs recomandat</Label>
              <Select value={form.target} onValueChange={v => setForm({ ...form, target: v })}>
                <SelectTrigger><SelectValue placeholder="Selectează produs" /></SelectTrigger>
                <SelectContent>{products.filter(p => p.id !== form.source).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tip relație</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAdd}>Adaugă</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
