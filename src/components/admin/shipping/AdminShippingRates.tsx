import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Weight, DollarSign, MapPin, Truck } from "lucide-react";

interface PricingRule {
  type: "weight" | "value" | "flat" | "free_above";
  ranges?: { min: number; max: number; price: number }[];
  price?: number;
  threshold?: number;
}

export default function AdminShippingRates() {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [editRules, setEditRules] = useState<PricingRule[]>([]);

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

  const saveMutation = useMutation({
    mutationFn: async ({ id, rules }: { id: string; rules: PricingRule[] }) => {
      const { error } = await supabase
        .from("courier_configs")
        .update({ pricing_rules: rules as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-configs"] });
      setEditId(null);
      toast({ title: "Tarife salvate" });
    },
  });

  const openEdit = (carrier: any) => {
    setEditId(carrier.id);
    setEditRules(Array.isArray(carrier.pricing_rules) ? [...carrier.pricing_rules] : []);
  };

  const addRule = (type: PricingRule["type"]) => {
    if (type === "weight" || type === "value") {
      setEditRules([...editRules, { type, ranges: [{ min: 0, max: 5, price: 15 }] }]);
    } else if (type === "flat") {
      setEditRules([...editRules, { type, price: 20 }]);
    } else if (type === "free_above") {
      setEditRules([...editRules, { type, threshold: 200 }]);
    }
  };

  const removeRule = (idx: number) => {
    setEditRules(editRules.filter((_, i) => i !== idx));
  };

  const updateRange = (ruleIdx: number, rangeIdx: number, field: string, value: number) => {
    const updated = [...editRules];
    const rule = { ...updated[ruleIdx] };
    if (rule.ranges) {
      rule.ranges = [...rule.ranges];
      rule.ranges[rangeIdx] = { ...rule.ranges[rangeIdx], [field]: value };
    }
    updated[ruleIdx] = rule;
    setEditRules(updated);
  };

  const addRange = (ruleIdx: number) => {
    const updated = [...editRules];
    const rule = { ...updated[ruleIdx] };
    const lastRange = rule.ranges?.[rule.ranges.length - 1];
    rule.ranges = [...(rule.ranges || []), { min: lastRange?.max || 0, max: (lastRange?.max || 0) + 5, price: (lastRange?.price || 15) + 5 }];
    updated[ruleIdx] = rule;
    setEditRules(updated);
  };

  const typeLabel: Record<string, string> = {
    weight: "După greutate (kg)",
    value: "După valoare comandă (RON)",
    flat: "Preț fix",
    free_above: "Transport gratuit peste prag",
  };

  const typeIcon: Record<string, any> = {
    weight: Weight,
    value: DollarSign,
    flat: Truck,
    free_above: Truck,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Se încarcă...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Tarife Transport</h1>
        <p className="text-sm text-muted-foreground">Configurare reguli de tarifare pentru fiecare curier.</p>
      </div>

      <div className="grid gap-4">
        {carriers.map((c: any) => {
          const rules: PricingRule[] = Array.isArray(c.pricing_rules) ? c.pricing_rules : [];
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    {c.display_name}
                    {!c.is_active && <Badge variant="secondary" className="text-[10px]">Inactiv</Badge>}
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                    Editează tarife
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rules.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nu are reguli de tarifare configurate.</p>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                        <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                          {typeLabel[rule.type] || rule.type}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {rule.type === "flat" && <span>{rule.price} RON — preț fix</span>}
                          {rule.type === "free_above" && <span>Transport gratuit peste {rule.threshold} RON</span>}
                          {(rule.type === "weight" || rule.type === "value") && rule.ranges && (
                            <div className="flex flex-wrap gap-1">
                              {rule.ranges.map((r, ri) => (
                                <Badge key={ri} variant="secondary" className="text-[10px] font-mono">
                                  {r.min}-{r.max}{rule.type === "weight" ? "kg" : " RON"}: {r.price} RON
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      {editId && (
        <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editare Tarife — {carriers.find((c: any) => c.id === editId)?.display_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editRules.map((rule, ruleIdx) => (
                <Card key={ruleIdx}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>{typeLabel[rule.type]}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRule(ruleIdx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {rule.type === "flat" && (
                      <div>
                        <Label className="text-xs">Preț fix (RON)</Label>
                        <Input
                          type="number"
                          value={rule.price ?? 0}
                          onChange={(e) => {
                            const updated = [...editRules];
                            updated[ruleIdx] = { ...rule, price: Number(e.target.value) };
                            setEditRules(updated);
                          }}
                        />
                      </div>
                    )}

                    {rule.type === "free_above" && (
                      <div>
                        <Label className="text-xs">Prag valoric (RON)</Label>
                        <Input
                          type="number"
                          value={rule.threshold ?? 0}
                          onChange={(e) => {
                            const updated = [...editRules];
                            updated[ruleIdx] = { ...rule, threshold: Number(e.target.value) };
                            setEditRules(updated);
                          }}
                        />
                      </div>
                    )}

                    {(rule.type === "weight" || rule.type === "value") && (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Min</TableHead>
                              <TableHead className="text-xs">Max</TableHead>
                              <TableHead className="text-xs">Preț (RON)</TableHead>
                              <TableHead className="w-8" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rule.ranges?.map((range, ri) => (
                              <TableRow key={ri}>
                                <TableCell>
                                  <Input type="number" className="h-8 text-xs" value={range.min} onChange={(e) => updateRange(ruleIdx, ri, "min", Number(e.target.value))} />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" className="h-8 text-xs" value={range.max} onChange={(e) => updateRange(ruleIdx, ri, "max", Number(e.target.value))} />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" className="h-8 text-xs" value={range.price} onChange={(e) => updateRange(ruleIdx, ri, "price", Number(e.target.value))} />
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                                    const updated = [...editRules];
                                    const r = { ...updated[ruleIdx] };
                                    r.ranges = r.ranges?.filter((_, i) => i !== ri);
                                    updated[ruleIdx] = r;
                                    setEditRules(updated);
                                  }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => addRange(ruleIdx)}>
                          <Plus className="w-3 h-3 mr-1" /> Adaugă interval
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => addRule("weight")}><Weight className="w-3.5 h-3.5 mr-1" /> Greutate</Button>
                <Button variant="outline" size="sm" onClick={() => addRule("value")}><DollarSign className="w-3.5 h-3.5 mr-1" /> Valoare</Button>
                <Button variant="outline" size="sm" onClick={() => addRule("flat")}><Truck className="w-3.5 h-3.5 mr-1" /> Preț fix</Button>
                <Button variant="outline" size="sm" onClick={() => addRule("free_above")}>🎁 Transport gratuit</Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditId(null)}>Anulează</Button>
              <Button onClick={() => saveMutation.mutate({ id: editId, rules: editRules })} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Se salvează..." : "Salvează"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
