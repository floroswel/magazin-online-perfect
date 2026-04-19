import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Puzzle, Search, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProdLite { id: string; name: string; sku: string | null; }
interface CompatRow {
  id: string;
  product_id: string;
  compatible_with_id: string;
  notes: string | null;
  product: ProdLite | null;
  compatible_with: ProdLite | null;
}

export default function AdminCompatibility() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [compatId, setCompatId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["compat-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, sku").order("name").limit(500);
      return (data || []) as ProdLite[];
    },
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["product-compatibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_compatibility")
        .select("id, product_id, compatible_with_id, notes, product:products!product_compatibility_product_id_fkey(id,name,sku), compatible_with:products!product_compatibility_compatible_with_id_fkey(id,name,sku)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CompatRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!productId || !compatId) throw new Error("Selectează ambele produse");
      if (productId === compatId) throw new Error("Produsele trebuie să fie diferite");
      const { error } = await supabase.from("product_compatibility").insert({
        product_id: productId, compatible_with_id: compatId, notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-compatibility"] });
      toast.success("Regulă adăugată");
      setOpen(false); setProductId(""); setCompatId(""); setNotes("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_compatibility").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["product-compatibility"] }); toast.success("Regulă ștearsă"); },
  });

  const filtered = rules.filter(r =>
    !search ||
    r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.compatible_with?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Puzzle className="w-5 h-5" /> Compatibilități</h1>
          <p className="text-sm text-muted-foreground">Definește produse compatibile (accesorii, piese de schimb, recomandări).</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Regulă nouă</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Caută produs..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produs</TableHead>
                <TableHead>Compatibil cu</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin inline" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">{rules.length === 0 ? "Nu există reguli de compatibilitate." : "Niciun rezultat."}</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{r.product?.name || "—"}</div>
                    {r.product?.sku && <Badge variant="outline" className="text-xs mt-0.5">{r.product.sku}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{r.compatible_with?.name || "—"}</div>
                    {r.compatible_with?.sku && <Badge variant="outline" className="text-xs mt-0.5">{r.compatible_with.sku}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.notes || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Ștergi această regulă?")) remove.mutate(r.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Regulă de compatibilitate</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Produs</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Alege produsul..." /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Compatibil cu</Label>
              <Select value={compatId} onValueChange={setCompatId}>
                <SelectTrigger><SelectValue placeholder="Alege produsul compatibil..." /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {products.filter(p => p.id !== productId).map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notă (opțional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Necesită adaptor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Anulează</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Adaugă regulă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
