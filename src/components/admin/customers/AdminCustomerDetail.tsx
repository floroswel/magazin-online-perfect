import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, Ban, Trash2, Award, Plus, Save, ShoppingCart, MapPin, RefreshCw, RotateCcw, Star, StickyNote, Activity, User } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminCustomerDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingPoints, setAddingPoints] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [profileRes, ordersRes, addrRes, subsRes, retRes, revRes, notesRes, loyaltyRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("orders").select("id, order_number, created_at, status, total, payment_method, user_email").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("addresses").select("*").eq("user_id", userId),
        supabase.from("subscriptions").select("*, products(name, images)").eq("customer_id", userId),
        supabase.from("returns").select("*, orders(id, order_number)").eq("user_id", userId),
        supabase.from("reviews").select("*, products(name)").eq("user_id", userId),
        supabase.from("customer_notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("loyalty_points").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      ]);
      setProfile(profileRes.data);
      setOrders(ordersRes.data || []);
      setAddresses(addrRes.data || []);
      setSubscriptions(subsRes.data || []);
      setReturns(retRes.data || []);
      setReviews(revRes.data || []);
      setNotes(notesRes.data || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-12 text-muted-foreground">Client negăsit.</div>;

  const totalSpent = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const avgOrder = orders.length > 0 ? totalSpent / orders.length : 0;
  const email = orders[0]?.user_email || profile.full_name || "—";

  const abcColor = (cls: string) => cls === "A" ? "bg-green-500/20 text-green-600" : cls === "B" ? "bg-yellow-500/20 text-yellow-600" : "bg-muted text-muted-foreground";

  const toggleBlock = async () => {
    const newVal = !profile.is_blocked;
    await supabase.from("profiles").update({ is_blocked: newVal }).eq("user_id", userId);
    setProfile({ ...profile, is_blocked: newVal });
    toast.success(newVal ? "Client blocat" : "Client deblocat");
  };

  const addNote = async () => {
    if (!newNote.trim() || !userId) return;
    const { data } = await supabase.from("customer_notes").insert({ user_id: userId, note: newNote }).select().single();
    if (data) setNotes(prev => [data, ...prev]);
    setNewNote("");
    toast.success("Notă adăugată");
  };

  const addLoyaltyPoints = async () => {
    if (!pointsToAdd || !userId || !pointsReason.trim()) {
      toast.error("Completează punctele și motivul.");
      return;
    }
    setAddingPoints(true);
    const pts = Number(pointsToAdd);
    await supabase.from("loyalty_points").insert({
      user_id: userId,
      points: pts,
      action: "manual_adjustment",
      description: pointsReason.trim(),
    });
    toast.success(`${pts > 0 ? "+" : ""}${pts} puncte ${pts > 0 ? "adăugate" : "retrase"}`);
    setPointsToAdd("");
    setPointsReason("");
    // Refresh loyalty points
    const { data: lp } = await supabase.from("loyalty_points").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    setLoyaltyPoints(lp || []);
    setAddingPoints(false);
  };

  const statusLabels: Record<string, string> = { pending: "În așteptare", processing: "Procesare", shipped: "Expediată", delivered: "Livrată", cancelled: "Anulată" };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/customers")} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Înapoi la clienți
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {(profile.full_name || email || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold">{profile.full_name || "Fără nume"}</h1>
              <p className="text-sm text-muted-foreground">{email}</p>
              {profile.phone && <p className="text-xs text-muted-foreground">{profile.phone}</p>}
              <p className="text-xs text-muted-foreground">Înregistrat: {format(new Date(profile.created_at), "dd MMM yyyy", { locale: ro })}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-sm ${abcColor(profile.abc_class || "C")}`}>
                Clasa {profile.abc_class || "C"}
              </Badge>
              {profile.is_blocked && <Badge variant="destructive">Blocat</Badge>}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={toggleBlock}>
                <Ban className="w-3 h-3 mr-1" /> {profile.is_blocked ? "Deblochează" : "Blochează"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary">
        <TabsList className="flex-wrap">
          <TabsTrigger value="summary"><User className="w-3 h-3 mr-1" />Sumar</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="w-3 h-3 mr-1" />Comenzi ({orders.length})</TabsTrigger>
          <TabsTrigger value="addresses"><MapPin className="w-3 h-3 mr-1" />Adrese ({addresses.length})</TabsTrigger>
          <TabsTrigger value="subscriptions"><RefreshCw className="w-3 h-3 mr-1" />Abonamente</TabsTrigger>
          <TabsTrigger value="returns"><RotateCcw className="w-3 h-3 mr-1" />Retururi</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="w-3 h-3 mr-1" />Recenzii</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="w-3 h-3 mr-1" />Note admin</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="w-3 h-3 mr-1" />Activitate</TabsTrigger>
        </TabsList>

        {/* SUMMARY */}
        <TabsContent value="summary" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{totalSpent.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} lei</p>
              <p className="text-[10px] text-muted-foreground">Total cheltuit (LTV)</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{avgOrder.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} lei</p>
              <p className="text-[10px] text-muted-foreground">Valoare medie comandă</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{orders.length}</p>
              <p className="text-[10px] text-muted-foreground">Total comenzi</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <Badge variant="outline" className={`text-lg px-3 py-1 ${abcColor(profile.abc_class || "C")}`}>
                {profile.abc_class || "C"}
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-1">Clasificare ABC</p>
            </CardContent></Card>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded p-3 text-sm">
              <span className="text-muted-foreground">Prima comandă:</span>{" "}
              <span className="font-medium">{orders.length > 0 ? format(new Date(orders[orders.length - 1].created_at), "dd MMM yyyy", { locale: ro }) : "—"}</span>
            </div>
            <div className="bg-muted/30 rounded p-3 text-sm">
              <span className="text-muted-foreground">Ultima comandă:</span>{" "}
              <span className="font-medium">{orders.length > 0 ? format(new Date(orders[0].created_at), "dd MMM yyyy", { locale: ro }) : "—"}</span>
            </div>
          </div>
          {/* Add loyalty points */}
          <Card>
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><Award className="w-4 h-4" /> Ajustare puncte loialitate</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Sold curent: <strong>{loyaltyPoints.reduce((s, p) => s + (p.points || 0), 0)}</strong> puncte
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input type="number" placeholder="+/- puncte" value={pointsToAdd} onChange={e => setPointsToAdd(e.target.value)} className="w-32 h-8" />
                  <Input placeholder="Motiv (obligatoriu)" value={pointsReason} onChange={e => setPointsReason(e.target.value)} className="flex-1 h-8" />
                  <Button size="sm" onClick={addLoyaltyPoints} disabled={addingPoints || !pointsToAdd || !pointsReason.trim()}>
                    <Plus className="w-3 h-3 mr-1" /> Aplică
                  </Button>
                </div>
              </div>
              {loyaltyPoints.length > 0 && (
                <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground">Istoric recent</p>
                  {loyaltyPoints.slice(0, 10).map((p: any) => (
                    <div key={p.id} className="flex justify-between text-xs border-b border-border/30 pb-1">
                      <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ro-RO")} — {p.description || p.action}</span>
                      <span className={p.points >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                        {p.points >= 0 ? "+" : ""}{p.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders" className="mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comandă</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Plată</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/orders")}>
                  <TableCell className="font-mono text-xs">#{o.order_number || o.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs">{format(new Date(o.created_at), "dd.MM.yy HH:mm")}</TableCell>
                  <TableCell className="text-sm font-medium">{Number(o.total).toFixed(2)} lei</TableCell>
                  <TableCell className="text-xs capitalize">{o.payment_method || "ramburs"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{statusLabels[o.status] || o.status}</Badge></TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nicio comandă.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ADDRESSES */}
        <TabsContent value="addresses" className="mt-3 space-y-2">
          {addresses.length === 0 ? <p className="text-sm text-muted-foreground">Nicio adresă salvată.</p> : addresses.map(a => (
            <Card key={a.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{a.label || "Adresă"}</p>
                  {a.is_default && <Badge className="text-[10px]">Implicită</Badge>}
                </div>
                <p className="text-sm">{a.full_name} · {a.phone}</p>
                <p className="text-xs text-muted-foreground">{a.address}, {a.city}, {a.county} {a.postal_code}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* SUBSCRIPTIONS */}
        <TabsContent value="subscriptions" className="mt-3 space-y-2">
          {subscriptions.length === 0 ? <p className="text-sm text-muted-foreground">Niciun abonament.</p> : subscriptions.map(s => (
            <Card key={s.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{s.products?.name || "Produs"}</p>
                  <p className="text-xs text-muted-foreground">Frecvență: {s.frequency} · Cantitate: {s.quantity}</p>
                </div>
                <Badge variant="outline" className="text-xs">{s.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* RETURNS */}
        <TabsContent value="returns" className="mt-3 space-y-2">
          {returns.length === 0 ? <p className="text-sm text-muted-foreground">Niciun retur.</p> : returns.map(r => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Retur #{r.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">Comandă: #{r.orders?.order_number || r.order_id?.slice(0, 8)} · {r.reason}</p>
                </div>
                <Badge variant="outline" className="text-xs">{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* REVIEWS */}
        <TabsContent value="reviews" className="mt-3 space-y-2">
          {reviews.length === 0 ? <p className="text-sm text-muted-foreground">Nicio recenzie.</p> : reviews.map(r => (
            <Card key={r.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{r.products?.name || "Produs"}</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ADMIN NOTES */}
        <TabsContent value="notes" className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Textarea placeholder="Adaugă o notă internă..." value={newNote} onChange={e => setNewNote(e.target.value)} className="min-h-[60px]" />
            <Button onClick={addNote} disabled={!newNote.trim()} className="self-end"><Save className="w-4 h-4 mr-1" /> Salvează</Button>
          </div>
          {notes.length === 0 ? <p className="text-sm text-muted-foreground">Nicio notă.</p> : notes.map(n => (
            <Card key={n.id}>
              <CardContent className="p-3">
                <p className="text-sm">{n.note}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "dd MMM yyyy HH:mm", { locale: ro })}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="mt-3">
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Log-ul de activitate va fi disponibil pe baza sesiunilor și evenimentelor viitoare.</p>
            {profile.last_login_at && (
              <p className="text-xs mt-2">Ultima logare: {format(new Date(profile.last_login_at), "dd MMM yyyy HH:mm", { locale: ro })}</p>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
