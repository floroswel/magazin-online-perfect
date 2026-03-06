import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rss, Plus, RefreshCw, ExternalLink, Pencil, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";

const FEED_TYPES = [
  { value: "google_shopping", label: "Google Shopping" },
  { value: "facebook", label: "Facebook Catalog" },
  { value: "emag", label: "eMAG Marketplace" },
  { value: "compari", label: "Compari.ro" },
  { value: "price_ro", label: "Price.ro" },
  { value: "custom", label: "Feed personalizat" },
];

const defaultForm = {
  name: "", feed_type: "google_shopping", format: "xml", is_active: false,
  filters: { in_stock_only: true, min_price: 0, categories: [], brands: [] },
  field_mappings: {} as Record<string, string>,
};

export default function AdminFeeds() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ["admin-feed-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feed_configs").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, feed_type: form.feed_type, format: form.format, is_active: form.is_active,
        filters: form.filters as any, field_mappings: form.field_mappings as any,
      };
      if (editId) {
        const { error } = await supabase.from("feed_configs").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("feed_configs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-feed-configs"] }); toast.success("Feed salvat!"); setDialogOpen(false); resetForm(); },
    onError: () => toast.error("Eroare la salvare."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("feed_configs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-feed-configs"] }); toast.success("Feed șters!"); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("feed_configs").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feed-configs"] }),
  });

  const regenerateFeed = async (feed: any) => {
    toast.info("Feed-ul se regenerează...");
    try {
      const fnMap: Record<string, string> = { google_shopping: "google-shopping-feed", facebook: "facebook-feed" };
      const fn = fnMap[feed.feed_type];
      if (fn) {
        await supabase.functions.invoke(fn);
        toast.success("Feed regenerat cu succes!");
      } else {
        toast.info("Generare automată indisponibilă pentru acest tip.");
      }
    } catch { toast.error("Eroare la regenerare feed."); }
  };

  const resetForm = () => { setForm(defaultForm); setEditId(null); };

  const openEdit = (f: any) => {
    setEditId(f.id);
    setForm({
      name: f.name, feed_type: f.feed_type, format: f.format || "xml", is_active: f.is_active,
      filters: f.filters || defaultForm.filters,
      field_mappings: f.field_mappings || {},
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Rss className="w-5 h-5" /> Feed-uri Marketing</h1>
          <p className="text-sm text-muted-foreground">Google Shopping, Facebook Catalog, comparatoare de prețuri, eMAG.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Feed nou</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Editează feed-ul" : "Feed nou"}</DialogTitle></DialogHeader>
            <Tabs defaultValue="general">
              <TabsList className="w-full"><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="filters">Filtre</TabsTrigger><TabsTrigger value="mapping">Mapare câmpuri</TabsTrigger></TabsList>
              <TabsContent value="general" className="space-y-4 mt-4">
                <div><Label>Nume feed</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Google Shopping RO" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tip feed</Label>
                    <Select value={form.feed_type} onValueChange={v => setForm(f => ({ ...f, feed_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FEED_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Format</Label>
                    <Select value={form.format} onValueChange={v => setForm(f => ({ ...f, format: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="xml">XML</SelectItem><SelectItem value="csv">CSV</SelectItem><SelectItem value="json">JSON</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Activ</Label></div>
              </TabsContent>
              <TabsContent value="filters" className="space-y-4 mt-4">
                <div className="flex items-center gap-3">
                  <Switch checked={form.filters.in_stock_only} onCheckedChange={v => setForm(f => ({ ...f, filters: { ...f.filters, in_stock_only: v } }))} />
                  <Label>Doar produse în stoc</Label>
                </div>
                <div><Label>Preț minim (RON)</Label><Input type="number" value={form.filters.min_price} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, min_price: Number(e.target.value) } }))} /></div>
              </TabsContent>
              <TabsContent value="mapping" className="space-y-4 mt-4">
                <p className="text-xs text-muted-foreground">Mapează câmpurile din catalog la câmpurile cerute de platformă.</p>
                {["title", "description", "price", "image_link", "brand", "gtin", "mpn", "condition", "availability"].map(field => (
                  <div key={field} className="grid grid-cols-2 gap-2 items-center">
                    <Label className="text-xs font-mono">{field}</Label>
                    <Input className="h-8 text-xs" value={(form.field_mappings as any)[field] || ""} onChange={e => setForm(f => ({ ...f, field_mappings: { ...f.field_mappings, [field]: e.target.value } }))} placeholder={`Câmp local (ex: name)`} />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>{saveMutation.isPending ? "..." : editId ? "Actualizează" : "Creează"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {isLoading ? <p className="text-center text-muted-foreground py-8">Se încarcă...</p> : feeds.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Niciun feed configurat. Creează primul feed.</CardContent></Card>
        ) : feeds.map((f: any) => {
          const typeInfo = FEED_TYPES.find(t => t.value === f.feed_type);
          return (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{f.name}</p>
                    <Badge variant="outline" className="text-[10px]">{typeInfo?.label || f.feed_type}</Badge>
                    <Badge variant="outline" className="text-[10px]">{f.format?.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {f.feed_url && <p className="text-xs text-muted-foreground font-mono">{f.feed_url}</p>}
                    {f.last_generated_at && <p className="text-xs text-muted-foreground">Ultima generare: {new Date(f.last_generated_at).toLocaleDateString("ro-RO")}</p>}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{f.product_count || 0} produse</p>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => regenerateFeed(f)} title="Regenerează"><RefreshCw className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)} title="Editează"><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(f.id)} title="Șterge"><Trash2 className="w-4 h-4" /></Button>
                <Switch checked={f.is_active} onCheckedChange={v => toggleActive.mutate({ id: f.id, active: v })} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
