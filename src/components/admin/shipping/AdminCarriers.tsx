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
import { toast } from "@/hooks/use-toast";
import { Truck, Settings2, Plus, Trash2, CheckCircle2, XCircle, MapPin, TestTube } from "lucide-react";

const courierLogos: Record<string, string> = {
  fan_courier: "🟠",
  sameday: "🔵",
  cargus: "🟡",
  dpd: "🔴",
  gls: "🟢",
};

export default function AdminCarriers() {
  const queryClient = useQueryClient();
  const [editCarrier, setEditCarrier] = useState<any>(null);

  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ["courier-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courier_configs")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("courier_configs").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-configs"] });
      toast({ title: "Status actualizat" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (carrier: any) => {
      const { error } = await supabase
        .from("courier_configs")
        .update({
          display_name: carrier.display_name,
          config_json: carrier.config_json,
          default_pickup_address: carrier.default_pickup_address,
        })
        .eq("id", carrier.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-configs"] });
      setEditCarrier(null);
      toast({ title: "Configurare salvată" });
    },
  });

  const activeCount = carriers.filter((c: any) => c.is_active).length;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Se încarcă...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Curieri</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} curieri activi din {carriers.length} configurați
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {carriers.map((c: any) => {
          const logo = courierLogos[c.courier] || "📦";
          const configKeys = Object.keys(c.config_json || {}).filter(k => k !== "webhook_secret");
          const hasConfig = configKeys.some(k => (c.config_json as any)[k]?.toString().trim());

          return (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                  {logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{c.display_name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{c.courier}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {hasConfig ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Credențiale configurate
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Necesită configurare
                      </span>
                    )}
                    {c.default_pickup_address && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Adresă ridicare setată
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {c.is_active ? (
                    <Badge className="bg-green-500/10 text-green-700 border-green-200 text-[10px]">Activ</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Inactiv</Badge>
                  )}
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: c.id, is_active: checked })}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCarrier({ ...c })}>
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      {editCarrier && (
        <Dialog open={!!editCarrier} onOpenChange={(o) => !o && setEditCarrier(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurare {editCarrier.display_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nume afișat</Label>
                <Input
                  value={editCarrier.display_name}
                  onChange={(e) => setEditCarrier({ ...editCarrier, display_name: e.target.value })}
                />
              </div>

              {/* API Credentials */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Credențiale API</Label>
                {Object.entries(editCarrier.config_json || {})
                  .filter(([k]) => k !== "webhook_secret")
                  .map(([key, val]) => (
                    <div key={key}>
                      <Label className="text-xs capitalize">{key.replace(/_/g, " ")}</Label>
                      <Input
                        value={String(val || "")}
                        type={key.includes("password") || key.includes("secret") || key.includes("key") ? "password" : "text"}
                        onChange={(e) =>
                          setEditCarrier({
                            ...editCarrier,
                            config_json: { ...editCarrier.config_json, [key]: e.target.value },
                          })
                        }
                      />
                    </div>
                  ))}
              </div>

              {/* Pickup Address */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Adresă Ridicare Implicită</Label>
                {["name", "county", "city", "address", "phone"].map((field) => (
                  <div key={field}>
                    <Label className="text-xs capitalize">{field === "name" ? "Firmă" : field === "county" ? "Județ" : field === "city" ? "Oraș" : field === "address" ? "Adresă" : "Telefon"}</Label>
                    <Input
                      value={(editCarrier.default_pickup_address as any)?.[field] || ""}
                      onChange={(e) =>
                        setEditCarrier({
                          ...editCarrier,
                          default_pickup_address: {
                            ...(editCarrier.default_pickup_address || {}),
                            [field]: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCarrier(null)}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate(editCarrier)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
