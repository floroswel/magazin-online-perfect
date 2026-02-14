import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, MapPin, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function Account() {
  const { user } = useAuth();
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

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Contul meu</h1>
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-1" /> Comenzi</TabsTrigger>
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
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{o.total.toLocaleString("ro-RO")} lei</p>
                    <p className="text-xs font-medium">{statusLabels[o.status] || o.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
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
