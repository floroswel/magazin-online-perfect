import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Settings2, Package } from "lucide-react";

export default function AdminExtraServices() {
  const queryClient = useQueryClient();
  const [editService, setEditService] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["extra-services-admin"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("extra_services" as any).select("*").order("display_order") as any);
      if (error) throw error;
      return data || [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from("extra_services" as any).update({ is_active }).eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-services-admin"] });
      toast.success("Status actualizat");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (service: any) => {
      const payload = {
        name: service.name,
        description: service.description || null,
        price: service.price || 0,
        icon: service.icon || "📦",
        display_order: service.display_order || 0,
        is_active: service.is_active ?? false,
      };
      if (service.id) {
        const { error } = await (supabase.from("extra_services" as any).update(payload).eq("id", service.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("extra_services" as any).insert(payload) as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-services-admin"] });
      setEditService(null);
      setShowAdd(false);
      toast.success("Serviciu salvat");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("extra_services" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-services-admin"] });
      setEditService(null);
      toast.success("Serviciu șters");
    },
  });

  const emptyService = { name: "", description: "", price: 0, icon: "📦", display_order: 0, is_active: false };
  const currentForm = editService || (showAdd ? emptyService : null);

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Servicii Extra Checkout</h1>
          <p className="text-sm text-muted-foreground">Serviciile active apar în pagina de checkout pentru client.</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adaugă serviciu
        </Button>
      </div>

      <div className="grid gap-3">
        {services.map((s: any) => (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <span className="text-2xl">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{s.name}</span>
                  <Badge variant="outline" className="text-[10px]">{s.price} RON</Badge>
                </div>
                {s.description && <p className="text-xs text-muted-foreground truncate">{s.description}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">
                  {s.is_active ? "Activ" : "Inactiv"}
                </Badge>
                <Switch
                  checked={s.is_active}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: s.id, is_active: checked })}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditService({ ...s })}>
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {services.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nu există servicii extra. Adaugă unul nou.</p>
          </div>
        )}
      </div>

      {/* Edit/Add dialog */}
      {currentForm && (
        <Dialog open={!!currentForm} onOpenChange={(o) => { if (!o) { setEditService(null); setShowAdd(false); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{currentForm.id ? "Editare" : "Adaugă"} serviciu extra</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nume</Label>
                <Input value={currentForm.name} onChange={e => setEditService((p: any) => ({ ...(p || emptyService), name: e.target.value }))} />
              </div>
              <div>
                <Label>Descriere</Label>
                <Textarea value={currentForm.description || ""} onChange={e => setEditService((p: any) => ({ ...(p || emptyService), description: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preț (RON)</Label>
                  <Input type="number" step="0.01" value={currentForm.price} onChange={e => setEditService((p: any) => ({ ...(p || emptyService), price: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Icon (emoji)</Label>
                  <Input value={currentForm.icon || ""} onChange={e => setEditService((p: any) => ({ ...(p || emptyService), icon: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={currentForm.is_active || false} onCheckedChange={v => setEditService((p: any) => ({ ...(p || emptyService), is_active: v }))} />
                <Label>Activ în checkout</Label>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <div>
                {currentForm.id && (
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(currentForm.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Șterge
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditService(null); setShowAdd(false); }}>Anulează</Button>
                <Button onClick={() => saveMutation.mutate(currentForm)} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Se salvează..." : "Salvează"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
