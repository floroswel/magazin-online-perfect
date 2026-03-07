import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Rocket, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type LandingPage = {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  visits: number;
  conversions: number;
  created_at: string;
};

export default function AdminLandingPages() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("landing_pages").select("*").order("created_at", { ascending: false });
    setPages((data as LandingPage[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalVisits = pages.reduce((s, p) => s + p.visits, 0);
  const totalConversions = pages.reduce((s, p) => s + p.conversions, 0);
  const conversionRate = totalVisits > 0 ? ((totalConversions / totalVisits) * 100).toFixed(1) : "0";

  const handleSave = async () => {
    if (!form.name || !form.slug) return;
    if (editingId) {
      await supabase.from("landing_pages").update({ name: form.name, slug: form.slug } as any).eq("id", editingId);
      toast({ title: "Pagină actualizată" });
    } else {
      const { error } = await supabase.from("landing_pages").insert({ name: form.name, slug: form.slug } as any);
      if (error) { toast({ title: "Eroare", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Landing page creată" });
    }
    setDialogOpen(false);
    setForm({ name: "", slug: "" });
    setEditingId(null);
    load();
  };

  const handleEdit = (p: LandingPage) => {
    setForm({ name: p.name, slug: p.slug });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("landing_pages").delete().eq("id", id);
    toast({ title: "Pagină ștearsă" });
    load();
  };

  const togglePublished = async (id: string, published: boolean) => {
    await supabase.from("landing_pages").update({ published } as any).eq("id", id);
    setPages(p => p.map(x => x.id === id ? { ...x, published } : x));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Rocket className="w-5 h-5" /> Landing Pages</h1>
          <p className="text-sm text-muted-foreground">Pagini de campanie cu tracking conversii.</p>
        </div>
        <Button size="sm" onClick={() => { setForm({ name: "", slug: "" }); setEditingId(null); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Landing page nouă</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{pages.filter(p => p.published).length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalVisits}</p><p className="text-xs text-muted-foreground">Vizite totale</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Rată conversie</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Vizite</TableHead>
                  <TableHead>Conversii</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nu există landing pages.</TableCell></TableRow>
                ) : pages.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">/lp/{p.slug}</TableCell>
                    <TableCell>{p.visits}</TableCell>
                    <TableCell>{p.conversions}</TableCell>
                    <TableCell><Switch checked={p.published} onCheckedChange={c => togglePublished(p.id, c)} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editează" : "Crează"} Landing Page</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nume pagină</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Black Friday 2025" />
            </div>
            <div>
              <Label className="text-xs">Slug (URL)</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="black-friday-2025" />
              <p className="text-xs text-muted-foreground mt-1">Accesibil la: /lp/{form.slug || "..."}</p>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave}>{editingId ? "Salvează" : "Creează"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
