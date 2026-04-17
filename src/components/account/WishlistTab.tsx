import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Heart, Trash2, Bell, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import { Link } from "react-router-dom";

export default function WishlistTab() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: wl } = await supabase.from("wishlists").select("*").eq("user_id", user!.id);
    const lists = (wl as any[]) || [];
    setWishlists(lists);

    const allItems: Record<string, any[]> = {};
    for (const list of lists) {
      const { data: wi } = await supabase
        .from("wishlist_items")
        .select("*, product:products(*)")
        .eq("wishlist_id", list.id);
      allItems[list.id] = (wi as any[]) || [];
    }
    setItems(allItems);

    const { data: alerts } = await supabase.from("price_alerts").select("*, product:products(name, price, image_url, slug)").eq("user_id", user!.id);
    setPriceAlerts((alerts as any[]) || []);
    setLoading(false);
  };

  const createList = async () => {
    if (!newListName.trim()) return;
    await supabase.from("wishlists").insert({ user_id: user!.id, name: newListName.trim() } as any);
    setNewListName("");
    setNewListOpen(false);
    loadData();
    toast.success("Listă creată!");
  };

  const togglePublic = async (id: string, val: boolean) => {
    await supabase.from("wishlists").update({ is_public: val } as any).eq("id", id);
    loadData();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("wishlist_items").delete().eq("id", itemId);
    loadData();
    toast.success("Produs eliminat");
  };

  const copyShareLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/wishlist/${token}`);
    toast.success("Link copiat!");
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Liste de dorințe</h2>
        <Button size="sm" onClick={() => setNewListOpen(true)}><Plus className="w-4 h-4 mr-1" /> Listă nouă</Button>
      </div>

      <Dialog open={newListOpen} onOpenChange={setNewListOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Listă nouă</DialogTitle></DialogHeader>
          <Input value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="Nume listă" />
          <DialogFooter><Button onClick={createList}>Creează</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {wishlists.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nu ai nicio listă. Creează una pentru a salva produsele preferate.</p>
          </CardContent>
        </Card>
      ) : wishlists.map(wl => (
        <Card key={wl.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{wl.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Publică</Label>
                <Switch checked={wl.is_public} onCheckedChange={v => togglePublic(wl.id, v)} />
                {wl.is_public && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyShareLink(wl.share_token)}>
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(items[wl.id] || []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Lista e goală.</p>
            ) : (
              <div className="space-y-2">
                {(items[wl.id] || []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <img src={item.product?.image_url || "/placeholder.svg"} alt="" className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product?.slug}`} className="text-sm font-medium hover:text-primary truncate block">{item.product?.name}</Link>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{format(item.product?.price)}</span>
                        {item.price_at_add && item.product?.price < item.price_at_add && (
                          <Badge variant="destructive" className="text-xs">↓ {Math.round((1 - item.product.price / item.price_at_add) * 100)}%</Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Price Alerts */}
      {priceAlerts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Alerte de preț</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priceAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <img src={alert.product?.image_url || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.product?.name}</p>
                    <p className="text-xs text-muted-foreground">Preț original: {format(alert.original_price)} → Acum: {format(alert.product?.price)}</p>
                  </div>
                  {alert.notified && <Badge>Notificat</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
