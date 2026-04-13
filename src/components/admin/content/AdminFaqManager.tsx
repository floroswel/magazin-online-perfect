import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, Plus, Trash2, Pencil, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const CATEGORIES = ["general", "comenzi", "livrare", "retururi", "plati", "cont", "produse"];

export default function AdminFaqManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "general" });
  const [filterCat, setFilterCat] = useState("all");

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("faq_items").select("*").order("sort_order");
      if (error) throw error;
      return data as FaqItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: typeof form & { id?: string }) => {
      if (f.id) {
        const { error } = await (supabase as any).from("faq_items").update({ question: f.question, answer: f.answer, category: f.category, updated_at: new Date().toISOString() }).eq("id", f.id);
        if (error) throw error;
      } else {
        const maxOrder = faqs.length > 0 ? Math.max(...faqs.map((x) => x.sort_order)) + 1 : 0;
        const { error } = await (supabase as any).from("faq_items").insert({ question: f.question, answer: f.answer, category: f.category, sort_order: maxOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      setDialogOpen(false);
      setEditId(null);
      setForm({ question: "", answer: "", category: "general" });
      toast.success("FAQ salvat!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from("faq_items").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-faqs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("faq_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast.success("FAQ șters!");
    },
  });

  const openEdit = (faq: FaqItem) => {
    setEditId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category });
    setDialogOpen(true);
  };

  const filtered = filterCat === "all" ? faqs : faqs.filter((f) => f.category === filterCat);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" /> Manager FAQ
          </h1>
          <p className="text-sm text-muted-foreground">Gestionează întrebările frecvente afișate pe site.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditId(null); setForm({ question: "", answer: "", category: "general" }); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă FAQ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editează FAQ" : "FAQ Nou"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Categorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Întrebare</Label>
                <Input placeholder="Cum pot returna un produs?" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </div>
              <div>
                <Label>Răspuns</Label>
                <Textarea rows={4} placeholder="Răspunsul detaliat..." value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate(editId ? { ...form, id: editId } : form)} disabled={!form.question || !form.answer || saveMutation.isPending}>
                {editId ? "Actualizează" : "Salvează"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant={filterCat === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterCat("all")}>Toate ({faqs.length})</Badge>
        {CATEGORIES.map((c) => {
          const count = faqs.filter((f) => f.category === c).length;
          if (count === 0) return null;
          return (
            <Badge key={c} variant={filterCat === c ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterCat(c)}>
              {c.charAt(0).toUpperCase() + c.slice(1)} ({count})
            </Badge>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><HelpCircle className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" /><p>Niciun FAQ adăugat încă.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((faq) => (
            <Card key={faq.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-start gap-3 py-3 px-4">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-1 shrink-0 cursor-grab" />
                <Switch checked={faq.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: faq.id, active: checked })} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{faq.question}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">{faq.category}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(faq)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(faq.id)}>
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
