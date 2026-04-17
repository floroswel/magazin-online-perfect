import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"blog_posts">;

export default function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", body_html: "", featured_image: "", status: "draft" });
  const [htmlMode, setHtmlMode] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", slug: "", excerpt: "", body_html: "", featured_image: "", status: "draft" });
    setDialogOpen(true);
  };

  const openEdit = (p: Post) => {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt || "", body_html: p.body_html || "", featured_image: p.featured_image || "", status: p.status });
    setDialogOpen(true);
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const save = async () => {
    if (!form.title || !form.slug) { toast.error("Titlu și slug sunt obligatorii"); return; }
    const payload = {
      title: form.title, slug: form.slug, excerpt: form.excerpt || null,
      body_html: form.body_html || null, featured_image: form.featured_image || null,
      status: form.status, published_at: form.status === "published" ? new Date().toISOString() : null,
    };
    if (editing) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Articol actualizat");
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Articol creat");
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ștergi acest articol?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast.success("Articol șters");
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Blog</CardTitle>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Articol Nou</Button>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-muted-foreground">Se încarcă...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titlu</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.slug}</TableCell>
                  <TableCell><Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ro")}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Niciun articol</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editează Articol" : "Articol Nou"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Titlu</Label><Input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value, slug: editing ? f.slug : slugify(e.target.value) })); }} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
            <div><Label>Imagine Featured (URL)</Label><Input value={form.featured_image} onChange={e => setForm(f => ({ ...f, featured_image: e.target.value }))} /></div>
            <div><Label>Extras</Label><Textarea rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} /></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Conținut</Label>
                <Button variant="ghost" size="sm" onClick={() => setHtmlMode(!htmlMode)}>{htmlMode ? "Vizual" : "HTML"}</Button>
              </div>
              <Textarea rows={12} value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))} className={htmlMode ? "font-mono text-xs" : ""} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>{editing ? "Salvează" : "Creează"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
