import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, User as UserIcon, Award, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty } from "@/hooks/useLoyalty";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function Account() {
  const { user } = useAuth();
  const { totalPoints, currentLevel, nextLevel, levels, loading: loyaltyLoading } = useLoyalty();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [orders, setOrders] = useState<Tables<"orders">[]>([]);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setEditName(data.full_name || ""); setEditPhone(data.phone || ""); }
    });
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: editName, phone: editPhone }).eq("user_id", user.id);
    if (error) { toast.error("Eroare la actualizare"); return; }
    toast.success("Profil actualizat!");
  };

  if (!user) return <Layout><div className="container py-16 text-center"><p>Autentifică-te.</p><Link to="/auth"><Button className="mt-4">Autentifică-te</Button></Link></div></Layout>;

  const statusLabels: Record<string, string> = { pending: "În așteptare", processing: "Se procesează", shipped: "Expediată", delivered: "Livrată", cancelled: "Anulată" };

  const progressToNext = nextLevel
    ? Math.min(100, ((totalPoints - (currentLevel?.min_points || 0)) / (nextLevel.min_points - (currentLevel?.min_points || 0))) * 100)
    : 100;

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Contul meu</h1>
        <Tabs defaultValue="orders">
          <TabsList className="flex-wrap">
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-1" /> Comenzi</TabsTrigger>
            <TabsTrigger value="loyalty"><Award className="h-4 w-4 mr-1" /> Fidelitate</TabsTrigger>
            <TabsTrigger value="profile"><UserIcon className="h-4 w-4 mr-1" /> Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <p className="text-muted-foreground">Nu ai nicio comandă.</p>
            ) : orders.map(o => (
              <Card key={o.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Comanda #{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")}</p>
                    {o.payment_method && (
                      <p className="text-xs text-muted-foreground capitalize">{o.payment_method}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{o.total.toLocaleString("ro-RO")} lei</p>
                    <p className="text-xs font-medium">{statusLabels[o.status] || o.status}</p>
                    {(o as any).loyalty_points_earned > 0 && (
                      <p className="text-xs text-emag-yellow">+{(o as any).loyalty_points_earned} puncte</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="loyalty" className="mt-4 space-y-4">
            {/* Current level card */}
            <Card className="overflow-hidden">
              <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${currentLevel?.color || '#CD7F32'}22, ${currentLevel?.color || '#CD7F32'}11)` }}>
                <span className="text-5xl">{currentLevel?.icon || '🥉'}</span>
                <h2 className="text-2xl font-bold mt-2">{currentLevel?.name || 'Bronze'}</h2>
                <p className="text-3xl font-bold text-primary mt-1">{totalPoints} puncte</p>
                {currentLevel && currentLevel.discount_percentage > 0 && (
                  <p className="text-sm font-medium mt-1">Reducere permanentă: {currentLevel.discount_percentage}%</p>
                )}
              </div>
              {nextLevel && (
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Încă <span className="font-bold text-foreground">{nextLevel.min_points - totalPoints} puncte</span> până la {nextLevel.icon} {nextLevel.name}
                  </p>
                  <Progress value={progressToNext} className="h-3" />
                </CardContent>
              )}
            </Card>

            {/* Benefits */}
            {currentLevel && (
              <Card>
                <CardHeader><CardTitle className="text-base">Beneficiile tale</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(currentLevel.benefits || []).map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Gift className="h-4 w-4 text-emag-yellow flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* All levels */}
            <Card>
              <CardHeader><CardTitle className="text-base">Toate nivelurile</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {levels.map(l => (
                    <div
                      key={l.id}
                      className={`rounded-lg border p-3 text-center ${l.id === currentLevel?.id ? 'ring-2 ring-primary' : ''}`}
                    >
                      <span className="text-3xl">{l.icon}</span>
                      <p className="font-semibold mt-1">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.min_points}+ puncte</p>
                      {l.discount_percentage > 0 && (
                        <p className="text-xs font-medium text-primary">{l.discount_percentage}% reducere</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Cum câștigi puncte?</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>🛒 <strong>1 punct</strong> pentru fiecare 10 lei cheltuiți</li>
                  <li>⭐ <strong>10 puncte</strong> pentru o recenzie</li>
                  <li>👥 <strong>50 puncte</strong> pentru recomandarea unui prieten</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Editare profil</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Email</Label><Input value={user.email || ""} disabled /></div>
                <div><Label>Nume complet</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                <div><Label>Telefon</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} /></div>
                <Button onClick={updateProfile}>Salvează</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
