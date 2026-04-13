import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowRight, Plus, Trash2, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

interface Redirect {
  id: string;
  source_path: string;
  target_url: string;
  redirect_type: number;
  is_active: boolean;
  hit_count: number;
  last_hit_at: string | null;
  note: string | null;
}

export default function AdminSeoRedirects() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ source_path: "", target_url: "", redirect_type: "301", note: "" });

  const { data: redirects = [], isLoading } = useQuery({
    queryKey: ["seo-redirects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("seo_redirects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Redirect[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (r: typeof form) => {
      const { error } = await (supabase as any).from("seo_redirects").insert({
        source_path: r.source_path.startsWith("/") ? r.source_path : "/" + r.source_path,
        target_url: r.target_url,
        redirect_type: parseInt(r.redirect_type),
        note: r.note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-redirects"] });
      setDialogOpen(false);
      setForm({ source_path: "", target_url: "", redirect_type: "301", note: "" });
      toast.success("Redirect creat!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from("seo_redirects").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seo-redirects"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("seo_redirects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-redirects"] });
      toast.success("Redirect șters!");
    },
  });

  const filtered = redirects.filter(
    (r) => r.source_path.toLowerCase().includes(search.toLowerCase()) || r.target_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" /> Manager Redirecturi SEO
          </h1>
          <p className="text-sm text-muted-foreground">Gestionează redirectări 301/302 pentru URL-uri vechi sau schimbate.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă Redirect</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Redirect Nou</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Sursă (calea veche)</Label>
                <Input placeholder="/produse/old-slug" value={form.source_path} onChange={(e) => setForm({ ...form, source_path: e.target.value })} />
              </div>
              <div>
                <Label>Destinație (URL nou)</Label>
                <Input placeholder="/produse/new-slug sau https://..." value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} />
              </div>
              <div>
                <Label>Tip Redirect</Label>
                <Select value={form.redirect_type} onValueChange={(v) => setForm({ ...form, redirect_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301 — Permanent</SelectItem>
                    <SelectItem value="302">302 — Temporar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notă (opțional)</Label>
                <Input placeholder="Motivul redirectului" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.source_path || !form.target_url || createMutation.isPending}>
                Salvează
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Caută redirect..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Niciun redirect configurat.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <Switch checked={r.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: r.id, active: checked })} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]">{r.source_path}</code>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]">{r.target_url}</code>
                  </div>
                  {r.note && <p className="text-xs text-muted-foreground mt-0.5">{r.note}</p>}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{r.redirect_type}</Badge>
                <span className="text-xs text-muted-foreground shrink-0">{r.hit_count} accesări</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
