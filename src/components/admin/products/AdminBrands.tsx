import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag, Plus, Trash2, Loader2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
}

export default function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "", description: "" });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("brands").select("*").order("name");
    setBrands(data || []);
    setLoading(false);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const add = async () => {
    if (!form.name.trim()) { toast.error("Numele este obligatoriu"); return; }
    setAdding(true);
    const slug = form.slug || generateSlug(form.name);
    const { error } = await supabase.from("brands").insert({
      name: form.name.trim(),
      slug,
      logo_url: form.logo_url || null,
      description: form.description || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Brand adăugat!"); setForm({ name: "", slug: "", logo_url: "", description: "" }); fetch(); }
    setAdding(false);
  };

  const update = async (brand: Brand) => {
    const { error } = await supabase.from("brands").update({
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url,
      description: brand.description,
    }).eq("id", brand.id);
    if (error) toast.error(error.message);
    else { toast.success("Brand actualizat!"); setEditing(null); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { setBrands(prev => prev.filter(b => b.id !== id)); toast.success("Brand șters"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Tag className="w-6 h-6 text-primary" /> Mărci / Branduri</h1>
        <p className="text-sm text-muted-foreground">Gestionează brandurile asociate produselor</p>
      </div>

      <Card className="border-border">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Adaugă brand</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><Label>Nume *</Label><Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) })); }} placeholder="Samsung" /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="samsung" /></div>
            <div><Label>Logo URL</Label><Input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." /></div>
            <div><Label>Descriere</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Scurtă descriere" /></div>
          </div>
          <Button onClick={add} disabled={adding}>
            {adding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se adaugă...</> : <><Plus className="w-4 h-4 mr-2" /> Adaugă brand</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
          ) : brands.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Niciun brand adăugat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Nume</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Descriere</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {b.logo_url ? <img src={b.logo_url} alt={b.name} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-muted rounded" />}
                    </TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{b.slug}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{b.description || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => remove(b.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
