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
import { MessageSquare, Plus, Trash2, Pencil, Zap, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

interface Popup {
  id: string;
  name: string;
  popup_type: string;
  title: string | null;
  body_html: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string | null;
  coupon_code: string | null;
  trigger_type: string;
  trigger_value: number | null;
  display_frequency: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

const POPUP_TYPES = [
  { value: "welcome", label: "Welcome" },
  { value: "exit_intent", label: "Exit Intent" },
  { value: "newsletter", label: "Newsletter" },
  { value: "promotion", label: "Promoție" },
  { value: "announcement", label: "Anunț" },
];

const TRIGGER_TYPES = [
  { value: "delay", label: "După X secunde" },
  { value: "scroll", label: "La scroll %" },
  { value: "exit_intent", label: "La exit intent" },
  { value: "immediate", label: "Imediat" },
];

const FREQUENCIES = [
  { value: "once_per_session", label: "O dată per sesiune" },
  { value: "once_per_day", label: "O dată pe zi" },
  { value: "once_ever", label: "O singură dată" },
  { value: "always", label: "Mereu" },
];

const emptyForm = { name: "", popup_type: "welcome", title: "", body_html: "", cta_text: "", cta_link: "", image_url: "", coupon_code: "", trigger_type: "delay", trigger_value: "3", display_frequency: "once_per_session" };

export default function AdminPopupsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: popups = [], isLoading } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("site_popups").select("*").order("sort_order");
      if (error) throw error;
      return data as Popup[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: typeof form & { id?: string }) => {
      const payload = {
        name: f.name,
        popup_type: f.popup_type,
        title: f.title || null,
        body_html: f.body_html || null,
        cta_text: f.cta_text || null,
        cta_link: f.cta_link || null,
        image_url: f.image_url || null,
        coupon_code: f.coupon_code || null,
        trigger_type: f.trigger_type,
        trigger_value: parseInt(f.trigger_value) || 3,
        display_frequency: f.display_frequency,
        updated_at: new Date().toISOString(),
      };
      if (f.id) {
        const { error } = await (supabase as any).from("site_popups").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const maxOrder = popups.length > 0 ? Math.max(...popups.map((p) => p.sort_order || 0)) + 1 : 0;
        const { error } = await (supabase as any).from("site_popups").insert({ ...payload, sort_order: maxOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success("Popup salvat!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from("site_popups").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-popups"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("site_popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-popups"] });
      toast.success("Popup șters!");
    },
  });

  const openEdit = (p: Popup) => {
    setEditId(p.id);
    setForm({
      name: p.name, popup_type: p.popup_type, title: p.title || "", body_html: p.body_html || "",
      cta_text: p.cta_text || "", cta_link: p.cta_link || "", image_url: p.image_url || "",
      coupon_code: p.coupon_code || "", trigger_type: p.trigger_type,
      trigger_value: String(p.trigger_value || 3), display_frequency: p.display_frequency,
    });
    setDialogOpen(true);
  };

  const typeLabel = (t: string) => POPUP_TYPES.find((x) => x.value === t)?.label || t;
  const triggerLabel = (t: string) => TRIGGER_TYPES.find((x) => x.value === t)?.label || t;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Manager Popups
          </h1>
          <p className="text-sm text-muted-foreground">Gestionează centralizat toate popup-urile site-ului.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1.5">
            <Eye className="w-3.5 h-3.5 mr-1" /> {popups.filter((p) => p.is_active).length} / {popups.length} active
          </Badge>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Adaugă Popup</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Editează Popup" : "Popup Nou"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nume intern</Label>
                    <Input placeholder="Welcome popup" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tip</Label>
                    <Select value={form.popup_type} onValueChange={(v) => setForm({ ...form, popup_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {POPUP_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Titlu</Label>
                  <Input placeholder="Bun venit!" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Conținut (HTML)</Label>
                  <Textarea rows={3} placeholder="<p>Text popup...</p>" value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Text buton CTA</Label>
                    <Input placeholder="Vezi oferta" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} />
                  </div>
                  <div>
                    <Label>Link CTA</Label>
                    <Input placeholder="/oferte" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>URL Imagine</Label>
                    <Input placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  </div>
                  <div>
                    <Label>Cod Cupon</Label>
                    <Input placeholder="WELCOME10" value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Trigger</Label>
                    <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valoare trigger</Label>
                    <Input type="number" value={form.trigger_value} onChange={(e) => setForm({ ...form, trigger_value: e.target.value })} />
                  </div>
                  <div>
                    <Label>Frecvență</Label>
                    <Select value={form.display_frequency} onValueChange={(v) => setForm({ ...form, display_frequency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={() => saveMutation.mutate(editId ? { ...form, id: editId } : form)} disabled={!form.name || saveMutation.isPending}>
                  {editId ? "Actualizează" : "Salvează"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
      ) : popups.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><MessageSquare className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" /><p>Niciun popup configurat.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {popups.map((p) => (
            <Card key={p.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <Switch checked={p.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: p.id, active: checked })} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    <Badge variant="secondary" className="text-[10px]">{typeLabel(p.popup_type)}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{triggerLabel(p.trigger_type)}{p.trigger_value ? ` (${p.trigger_value})` : ""}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{FREQUENCIES.find((f) => f.value === p.display_frequency)?.label}</span>
                    {p.coupon_code && <Badge variant="outline" className="text-[10px]">🎁 {p.coupon_code}</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
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
