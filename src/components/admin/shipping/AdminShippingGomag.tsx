import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Truck, Loader2 } from "lucide-react";

const JUDETE = [
  "Alba","Arad","Arges","Bacau","Bihor","Bistrita-Nasaud","Botosani","Braila","Brasov","Buzau",
  "Calarasi","Cluj","Constanta","Covasna","Dambovita","Dolj","Galati","Giurgiu","Gorj","Harghita",
  "Hunedoara","Ialomita","Iasi","Ilfov","Maramures","Mehedinti","Mures","Neamt","Olt","Prahova",
  "Salaj","Satu Mare","Sibiu","Suceava","Teleorman","Timis","Tulcea","Valcea","Vaslui","Vrancea",
  "Municipiul Bucuresti"
];

interface ShippingMethod {
  id?: string;
  name: string;
  counties: string[];
  locality_mode: string;
  payment_method: string;
  cash_on_delivery: boolean;
  calc_mode: string;
  calc_criteria: string;
  order_min: number;
  order_max: number;
  cost: number;
  max_weight: number;
  extra_cost_kg: number;
  description: string;
  categories: string[];
  category_condition: string;
  display_mode: string;
  use_on_product: boolean;
  is_active: boolean;
}

const EMPTY_METHOD: ShippingMethod = {
  name: "", counties: [], locality_mode: "all", payment_method: "all",
  cash_on_delivery: false, calc_mode: "fixed", calc_criteria: "order_total",
  order_min: 0, order_max: 99999, cost: 25, max_weight: 30,
  extra_cost_kg: 0, description: "", categories: [],
  category_condition: "contains_any", display_mode: "show_all",
  use_on_product: false, is_active: true,
};

export default function AdminShippingGomag() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ShippingMethod | null>(null);
  const [selectAllCounties, setSelectAllCounties] = useState(false);

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["shipping-methods-gomag"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", "shipping_methods_gomag").maybeSingle();
      return Array.isArray(data?.value_json) ? data.value_json : [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newMethods: ShippingMethod[]) => {
      await supabase.from("app_settings").upsert(
        { key: "shipping_methods_gomag", value_json: newMethods as any, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-methods-gomag"] });
      setEditing(null);
      toast.success("Metode de livrare salvate!");
    },
  });

  const saveMethod = (method: ShippingMethod) => {
    let updated: ShippingMethod[];
    if (method.id) {
      updated = methods.map((m: any) => m.id === method.id ? method : m);
    } else {
      updated = [...methods, { ...method, id: crypto.randomUUID() }];
    }
    saveMutation.mutate(updated);
  };

  const deleteMethod = (id: string) => {
    saveMutation.mutate(methods.filter((m: any) => m.id !== id));
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectAllCounties(checked);
    if (editing) {
      setEditing({ ...editing, counties: checked ? [...JUDETE] : [] });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  // EDIT / ADD FORM
  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{editing.id ? "Editare" : "Adaugă"} Metodă de Livrare</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Înapoi</Button>
            <Button onClick={() => saveMethod(editing)} disabled={saveMutation.isPending}>Salvează</Button>
          </div>
        </div>

        <Tabs defaultValue="general">
          <TabsList><TabsTrigger value="general">Generalitati</TabsTrigger><TabsTrigger value="display">Afisare</TabsTrigger></TabsList>

          <TabsContent value="general">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div><Label>Denumire *</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>

                <div>
                  <Label>Judet *</Label>
                  <div className="border rounded-lg p-3 max-h-60 overflow-y-auto mt-1 space-y-1">
                    <label className="flex items-center gap-2 text-sm font-semibold pb-2 border-b">
                      <Checkbox checked={selectAllCounties} onCheckedChange={v => toggleSelectAll(!!v)} />
                      Selecteaza toate
                    </label>
                    {JUDETE.map(j => (
                      <label key={j} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={editing.counties.includes(j)} onCheckedChange={checked => {
                          setEditing({ ...editing, counties: checked ? [...editing.counties, j] : editing.counties.filter(c => c !== j) });
                        }} />
                        {j}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Localitate</Label>
                  <Select value={editing.locality_mode} onValueChange={v => setEditing({ ...editing, locality_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate localitatile</SelectItem>
                      <SelectItem value="only">Doar localitatile</SelectItem>
                      <SelectItem value="except">Toate localitatile cu exceptia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Metoda de plata</Label>
                    <Select value={editing.payment_method} onValueChange={v => setEditing({ ...editing, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox checked={editing.cash_on_delivery} onCheckedChange={v => setEditing({ ...editing, cash_on_delivery: !!v })} />
                    <Label>Numerar sau Ramburs</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mod de calcul</Label>
                    <Select value={editing.calc_mode} onValueChange={v => setEditing({ ...editing, calc_mode: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Cost fix</SelectItem>
                        <SelectItem value="weight">Dupa greutate</SelectItem>
                        <SelectItem value="value">Dupa valoare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Criteriu de calcul</Label>
                    <Select value={editing.calc_criteria} onValueChange={v => setEditing({ ...editing, calc_criteria: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="order_total">Valoarea totala a comenzii</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Valoare Comanda intre (min)</Label><Input type="number" value={editing.order_min} onChange={e => setEditing({ ...editing, order_min: Number(e.target.value) })} /></div>
                  <div><Label>Valoare Comanda intre (max)</Label><Input type="number" value={editing.order_max} onChange={e => setEditing({ ...editing, order_max: Number(e.target.value) })} /></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Cost (Lei) *</Label><Input type="number" value={editing.cost} onChange={e => setEditing({ ...editing, cost: Number(e.target.value) })} /></div>
                  <div><Label>Greutate maxima (kg)</Label><Input type="number" value={editing.max_weight} onChange={e => setEditing({ ...editing, max_weight: Number(e.target.value) })} /></div>
                  <div><Label>Cost extra/kg (Lei)</Label><Input type="number" value={editing.extra_cost_kg} onChange={e => setEditing({ ...editing, extra_cost_kg: Number(e.target.value) })} /></div>
                </div>

                <div><Label>Descriere</Label><Textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label>Afisare transport</Label>
                  <Select value={editing.display_mode} onValueChange={v => setEditing({ ...editing, display_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="show_all">Afiseaza toate metodele de transport disponibile</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.use_on_product} onCheckedChange={v => setEditing({ ...editing, use_on_product: v })} />
                  <Label>Foloseste la estimarea costului pe detaliul produsului</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Metode de Livrare</h1>
          <p className="text-sm text-muted-foreground">Configurare metode de transport — stil Gomag</p>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY_METHOD })}><Plus className="w-4 h-4 mr-1" /> Adauga Metoda de Livrare</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Denumire</TableHead>
                <TableHead>Judete</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nicio metodă de livrare configurată.</TableCell></TableRow>
              ) : (
                methods.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.counties?.length === 41 ? "Toate" : `${m.counties?.length || 0} judete`}</Badge></TableCell>
                    <TableCell>{m.cost} Lei</TableCell>
                    <TableCell>
                      <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Activ" : "Inactiv"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing({ ...m })}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMethod(m.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
