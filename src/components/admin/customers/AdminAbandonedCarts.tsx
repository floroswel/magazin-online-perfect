import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Mail, RefreshCw, Loader2, Eye, Ban, Send, Settings, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";

interface AbandonedCart {
  id: string;
  user_id: string;
  user_email: string | null;
  items: any;
  total: number | null;
  last_activity_at: string;
  created_at: string;
  recovered: boolean | null;
  recovered_at: string | null;
  recovery_email_sent: boolean | null;
  recovery_email_sent_at: string | null;
  status: string;
  email_1_sent_at: string | null;
  email_2_sent_at: string | null;
  email_3_sent_at: string | null;
  recovery_coupon_code: string | null;
  lost: boolean;
  recovery_token: string | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  abandoned: { label: "Necontactat", variant: "outline" },
  email_1_sent: { label: "Email 1 trimis", variant: "secondary" },
  email_2_sent: { label: "Email 2 trimis", variant: "secondary" },
  email_3_sent: { label: "Email 3 trimis", variant: "secondary" },
  recovered: { label: "Recuperat", variant: "default" },
  lost: { label: "Pierdut", variant: "destructive" },
};

export default function AdminAbandonedCarts() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  const { data: carts = [], isLoading } = useQuery({
    queryKey: ["admin-abandoned-carts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .order("last_activity_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as AbandonedCart[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["abandoned-cart-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", "abandoned_cart_settings").maybeSingle();
      return (data?.value_json as any) || {
        enabled: true,
        abandon_minutes: 60,
        email_1_hours: 1,
        email_2_hours: 24,
        email_3_hours: 72,
        discount_percent: 5,
        min_cart_value: 50,
        exclude_recent_hours: 24,
      };
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "abandoned_cart_settings").maybeSingle();
      if (existing) {
        const { error } = await supabase.from("app_settings").update({ value_json: newSettings as any }).eq("key", "abandoned_cart_settings");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert({ key: "abandoned_cart_settings", value_json: newSettings as any });
        if (error) throw error;
      }
      toast.success("Setări salvate!");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["abandoned-cart-settings"] }),
  });

  const markLostMutation = useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await supabase.from("abandoned_carts").update({ status: "lost", lost: true } as any).eq("id", cartId);
      if (error) throw error;
      toast.success("Coș marcat ca pierdut");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-abandoned-carts"] });
      setSelectedCart(null);
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await supabase.functions.invoke("recover-abandoned-carts", {
        body: { manual: true, cartId },
      });
      if (error) throw error;
      toast.success("Email de recuperare trimis!");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-abandoned-carts"] }),
  });

  // Filters
  const filtered = carts.filter((c) => {
    if (statusFilter !== "all") {
      if (statusFilter === "recovered" && !c.recovered) return false;
      if (statusFilter === "lost" && !c.lost) return false;
      if (statusFilter === "abandoned" && c.status !== "abandoned") return false;
      if (statusFilter === "email_sent" && !c.email_1_sent_at) return false;
    }
    if (minValue && (c.total || 0) < parseFloat(minValue)) return false;
    if (maxValue && (c.total || 0) > parseFloat(maxValue)) return false;
    return true;
  });

  // Stats
  const totalCarts = carts.filter(c => !c.recovered).length;
  const totalValue = carts.filter(c => !c.recovered).reduce((s, c) => s + (c.total || 0), 0);
  const recoveredCarts = carts.filter(c => c.recovered);
  const recoveredCount = recoveredCarts.length;
  const recoveredValue = recoveredCarts.reduce((s, c) => s + (c.total || 0), 0);
  const recoveryRate = carts.length > 0 ? ((recoveredCount / carts.length) * 100).toFixed(1) : "0";

  const getStatusInfo = (cart: AbandonedCart) => {
    if (cart.recovered) return STATUS_MAP.recovered;
    if (cart.lost) return STATUS_MAP.lost;
    if (cart.email_3_sent_at) return STATUS_MAP.email_3_sent;
    if (cart.email_2_sent_at) return STATUS_MAP.email_2_sent;
    if (cart.email_1_sent_at) return STATUS_MAP.email_1_sent;
    return STATUS_MAP.abandoned;
  };

  const cartItems = (cart: AbandonedCart) => {
    try {
      return Array.isArray(cart.items) ? cart.items : [];
    } catch { return []; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> Coșuri Abandonate
          </h1>
          <p className="text-sm text-muted-foreground">Monitorizează și recuperează coșurile abandonate</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-abandoned-carts"] })}>
          <RefreshCw className="w-4 h-4 mr-1" /> Reîncarcă
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalCarts}</p><p className="text-xs text-muted-foreground">Coșuri abandonate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalValue.toFixed(0)} RON</p><p className="text-xs text-muted-foreground">Valoare totală</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{recoveredCount}</p><p className="text-xs text-muted-foreground">Recuperate</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{recoveryRate}%</p><p className="text-xs text-muted-foreground">Rată recuperare</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{recoveredValue.toFixed(0)} RON</p><p className="text-xs text-muted-foreground">Venit recuperat</p></CardContent></Card>
      </div>

      <Tabs defaultValue="carts">
        <TabsList>
          <TabsTrigger value="carts">Coșuri ({filtered.length})</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" /> Setări</TabsTrigger>
        </TabsList>

        <TabsContent value="carts" className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="abandoned">Necontactat</SelectItem>
                  <SelectItem value="email_sent">Email trimis</SelectItem>
                  <SelectItem value="recovered">Recuperat</SelectItem>
                  <SelectItem value="lost">Pierdut</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Valoare min (RON)</Label>
              <Input className="w-24 h-8" type="number" value={minValue} onChange={e => setMinValue(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Valoare max (RON)</Label>
              <Input className="w-24 h-8" type="number" value={maxValue} onChange={e => setMaxValue(e.target.value)} placeholder="∞" />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Niciun coș abandonat.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Produse</TableHead>
                      <TableHead>Valoare</TableHead>
                      <TableHead>Ultima activitate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cupon</TableHead>
                      <TableHead>Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(cart => {
                      const items = cartItems(cart);
                      const statusInfo = getStatusInfo(cart);
                      return (
                        <TableRow key={cart.id}>
                          <TableCell className="font-medium text-sm">{cart.user_email || "Anonim"}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              {items.slice(0, 2).map((item: any, idx: number) => (
                                item.image_url ? (
                                  <img key={idx} src={item.image_url} alt="" className="w-8 h-8 rounded object-cover border" />
                                ) : (
                                  <div key={idx} className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px]">?</div>
                                )
                              ))}
                              {items.length > 2 && <span className="text-xs text-muted-foreground">+{items.length - 2}</span>}
                              <span className="text-xs text-muted-foreground ml-1">({items.length})</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{(cart.total || 0).toFixed(2)} RON</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(cart.last_activity_at).toLocaleString("ro-RO")}</TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant} className="text-[10px]">{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{cart.recovery_coupon_code || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedCart(cart)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {!cart.recovered && !cart.lost && cart.user_email && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sendEmailMutation.mutate(cart.id)} disabled={sendEmailMutation.isPending}>
                                  <Send className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {!cart.recovered && !cart.lost && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => markLostMutation.mutate(cart.id)}>
                                  <Ban className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          {settings && <AbandonedCartSettings settings={settings} onSave={(s: any) => saveSettingsMutation.mutate(s)} saving={saveSettingsMutation.isPending} />}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCart} onOpenChange={() => setSelectedCart(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalii coș abandonat</DialogTitle>
          </DialogHeader>
          {selectedCart && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedCart.user_email || "Anonim"}</span></div>
                <div><span className="text-muted-foreground">Valoare:</span> <span className="font-medium">{(selectedCart.total || 0).toFixed(2)} RON</span></div>
                <div><span className="text-muted-foreground">Creat:</span> <span>{new Date(selectedCart.created_at).toLocaleString("ro-RO")}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={getStatusInfo(selectedCart).variant} className="text-[10px]">{getStatusInfo(selectedCart).label}</Badge></div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Produse în coș</h4>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {cartItems(selectedCart).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded border text-sm">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-xs">{item.name || "Produs"}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity || 1} — {(item.price || 0).toFixed(2)} RON</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Istoric emailuri</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span>Email 1 (reminder)</span>
                    {selectedCart.email_1_sent_at ? (
                      <Badge variant="secondary" className="text-[10px]">{new Date(selectedCart.email_1_sent_at).toLocaleString("ro-RO")}</Badge>
                    ) : <span className="text-muted-foreground">Netrimis</span>}
                  </div>
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span>Email 2 (cu discount)</span>
                    {selectedCart.email_2_sent_at ? (
                      <Badge variant="secondary" className="text-[10px]">{new Date(selectedCart.email_2_sent_at).toLocaleString("ro-RO")}</Badge>
                    ) : <span className="text-muted-foreground">Netrimis</span>}
                  </div>
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span>Email 3 (urgență)</span>
                    {selectedCart.email_3_sent_at ? (
                      <Badge variant="secondary" className="text-[10px]">{new Date(selectedCart.email_3_sent_at).toLocaleString("ro-RO")}</Badge>
                    ) : <span className="text-muted-foreground">Netrimis</span>}
                  </div>
                  {selectedCart.recovery_coupon_code && (
                    <div className="flex justify-between items-center p-2 rounded border">
                      <span>Cupon generat</span>
                      <span className="font-mono font-medium">{selectedCart.recovery_coupon_code}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!selectedCart.recovered && !selectedCart.lost && selectedCart.user_email && (
                  <Button size="sm" onClick={() => sendEmailMutation.mutate(selectedCart.id)} disabled={sendEmailMutation.isPending}>
                    <Send className="w-4 h-4 mr-1" /> Trimite email acum
                  </Button>
                )}
                {!selectedCart.recovered && !selectedCart.lost && (
                  <Button size="sm" variant="destructive" onClick={() => markLostMutation.mutate(selectedCart.id)}>
                    <Ban className="w-4 h-4 mr-1" /> Marchează pierdut
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AbandonedCartSettings({ settings, onSave, saving }: { settings: any; onSave: (s: any) => void; saving: boolean }) {
  const [form, setForm] = useState(settings);
  const update = (key: string, value: any) => setForm((p: any) => ({ ...p, [key]: value }));

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-semibold">Sistem activ</Label>
            <p className="text-xs text-muted-foreground">Activează/dezactivează recuperarea coșurilor abandonate</p>
          </div>
          <Switch checked={form.enabled} onCheckedChange={(v) => update("enabled", v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Timp până la abandon (minute)</Label>
            <Select value={String(form.abandon_minutes)} onValueChange={(v) => update("abandon_minutes", parseInt(v))}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minute</SelectItem>
                <SelectItem value="60">60 minute</SelectItem>
                <SelectItem value="120">120 minute</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Valoare minimă coș (RON)</Label>
            <Input type="number" className="h-8" value={form.min_cart_value} onChange={e => update("min_cart_value", parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Email 1 după (ore)</Label>
            <Input type="number" className="h-8" value={form.email_1_hours} onChange={e => update("email_1_hours", parseFloat(e.target.value) || 1)} />
          </div>
          <div>
            <Label className="text-xs">Email 2 după (ore)</Label>
            <Input type="number" className="h-8" value={form.email_2_hours} onChange={e => update("email_2_hours", parseFloat(e.target.value) || 24)} />
          </div>
          <div>
            <Label className="text-xs">Email 3 după (ore)</Label>
            <Input type="number" className="h-8" value={form.email_3_hours} onChange={e => update("email_3_hours", parseFloat(e.target.value) || 72)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Discount Email 2 (%)</Label>
            <Input type="number" className="h-8" value={form.discount_percent} onChange={e => update("discount_percent", parseFloat(e.target.value) || 0)} />
            <p className="text-[10px] text-muted-foreground mt-1">0 = fără discount</p>
          </div>
          <div>
            <Label className="text-xs">Excludere: nu trimite dacă a cumpărat recent (ore)</Label>
            <Input type="number" className="h-8" value={form.exclude_recent_hours} onChange={e => update("exclude_recent_hours", parseFloat(e.target.value) || 24)} />
          </div>
        </div>

        <Button size="sm" onClick={() => onSave(form)} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Salvează setări
        </Button>
      </CardContent>
    </Card>
  );
}
