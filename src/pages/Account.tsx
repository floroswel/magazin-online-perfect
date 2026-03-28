import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, User as UserIcon, Award, Gift, RotateCcw, MapPin, Plus, Trash2, Star, Clock, ChevronDown, ChevronUp, Truck, CheckCircle2, XCircle, Copy, History, RefreshCw, FileText, Download, Settings, Users, Heart, Share2, Wallet, Flame, LogOut, Shield, KeyRound, DatabaseBackup, UserX, Eye, EyeOff } from "lucide-react";

import ReturnRequestForm from "@/components/account/ReturnRequestForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import AffiliateTab from "@/components/account/AffiliateTab";
import ReferralTab from "@/components/account/ReferralTab";
import WishlistTab from "@/components/account/WishlistTab";
import GiftCardTab from "@/components/account/GiftCardTab";
import WalletTab from "@/components/account/WalletTab";
import BurnLogTab from "@/components/account/BurnLogTab";

const RETURNABLE_STATUSES = ["delivered", "shipped"];
const STATUS_TIMELINE_DEFAULT = ["pending", "processing", "shipped", "delivered"];

export default function Account() {
  const { user } = useAuth();
  const { totalPoints, currentLevel, nextLevel, levels, loading: loyaltyLoading, config: loyaltyConfig, pointsToValue } = useLoyalty();
  const { format } = useCurrency();
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [existingReturns, setExistingReturns] = useState<Tables<"returns">[]>([]);
  const [addresses, setAddresses] = useState<Tables<"addresses">[]>([]);
  const [pointsHistory, setPointsHistory] = useState<Tables<"loyalty_points">[]>([]);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data: customStatuses = [] } = useQuery({
    queryKey: ["order-statuses-storefront"],
    queryFn: async () => {
      const { data } = await supabase.from("order_statuses").select("*").order("sort_order");
      return (data as any[]) || [];
    },
  });

  const STATUS_TIMELINE = customStatuses.length > 0
    ? customStatuses.filter((s: any) => !s.is_final || s.key === "delivered").map((s: any) => s.key)
    : STATUS_TIMELINE_DEFAULT;

  const statusLabelsFromDb: Record<string, string> = {};
  const statusColorsFromDb: Record<string, string> = {};
  customStatuses.forEach((s: any) => { statusLabelsFromDb[s.key] = s.name; statusColorsFromDb[s.key] = s.color; });

  // Return dialog state
  const [returnOrder, setReturnOrder] = useState<any>(null);

  // Address dialog
  const [addressDialog, setAddressDialog] = useState(false);
  const [addressForm, setAddressForm] = useState({ full_name: "", phone: "", address: "", city: "", county: "", postal_code: "", label: "Acasă" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setEditName(data.full_name || ""); setEditPhone(data.phone || ""); }
    });
    supabase.from("orders").select("*, order_items(*, products(name, images))").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
    supabase.from("returns").select("*").eq("user_id", user.id).then(({ data }) => setExistingReturns(data || []));
    supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).then(({ data }) => setAddresses(data || []));
    supabase.from("loyalty_points").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setPointsHistory(data || []));
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: editName, phone: editPhone }).eq("user_id", user.id);
    if (error) { toast.error("Eroare la actualizare"); return; }
    toast.success("Profil actualizat!");
  };

  const refreshReturns = async () => {
    if (!user) return;
    const { data } = await supabase.from("returns").select("*").eq("user_id", user.id);
    setExistingReturns(data || []);
  };

  const hasReturn = (orderId: string) => existingReturns.some(r => r.order_id === orderId);
  const getReturnStatus = (orderId: string) => {
    const r = existingReturns.find(r => r.order_id === orderId);
    if (!r) return null;
    const labels: Record<string, string> = { pending: "În așteptare", approved: "Aprobat", rejected: "Respins", shipped: "Expediat", received: "Recepționat", refunded: "Rambursat", closed: "Închis" };
    return labels[r.status] || r.status;
  };

  const saveAddress = async () => {
    if (!user) return;
    const { error } = await supabase.from("addresses").insert({ ...addressForm, user_id: user.id });
    if (error) { toast.error("Eroare la salvarea adresei"); return; }
    toast.success("Adresă salvată!");
    setAddressDialog(false);
    setAddressForm({ full_name: "", phone: "", address: "", city: "", county: "", postal_code: "", label: "Acasă" });
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setAddresses(data || []);
  };

  const deleteAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses(prev => prev.filter(a => a.id !== id));
    toast.success("Adresă ștearsă");
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setAddresses(data || []);
    toast.success("Adresă implicită actualizată");
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${user?.id?.slice(0, 8)}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiat!");
  };

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  if (!user) return <Layout><div className="container py-16 text-center"><p>Autentifică-te.</p><Link to="/auth"><Button className="mt-4">Autentifică-te</Button></Link></div></Layout>;

  const downloadInvoicePdf = (invoiceId: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(`https://${projectId}.supabase.co/functions/v1/generate-invoice-pdf`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: invoiceId }),
    }).then(r => r.text()).then(html => {
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
    }).catch(() => toast.error("Eroare la generare PDF"));
  };

  const CustomerInvoicesList = ({ userId }: { userId: string }) => {
    const { data: invoices = [], isLoading } = useQuery({
      queryKey: ["customer-invoices", userId],
      queryFn: async () => {
        // Fetch orders for user, then invoices for those orders
        const { data: userOrders } = await supabase.from("orders").select("id").eq("user_id", userId);
        if (!userOrders?.length) return [];
        const orderIds = userOrders.map(o => o.id);
        const { data } = await supabase.from("invoices").select("id, invoice_number, type, status, total, currency, issued_at, order_id").in("order_id", orderIds).order("issued_at", { ascending: false });
        return (data as any[]) || [];
      },
    });

    if (isLoading) return <p className="text-sm text-muted-foreground">Se încarcă...</p>;
    if (invoices.length === 0) return <p className="text-sm text-muted-foreground">Nu ai nicio factură.</p>;

    return (
      <div className="space-y-2">
        {invoices.map((inv: any) => (
          <Card key={inv.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-mono font-medium text-sm">{inv.invoice_number}</p>
                <p className="text-xs text-muted-foreground">
                  {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("ro-RO") : "—"} · {Number(inv.total || 0).toFixed(2)} {inv.currency || "RON"}
                </p>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {inv.type === "proforma" ? "Proformă" : inv.type === "storno" ? "Storno" : "Factură"}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadInvoicePdf(inv.id)}>
                <Download className="w-3.5 h-3.5" /> Descarcă
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const statusLabels: Record<string, string> = { pending: "În așteptare", processing: "Se procesează", shipped: "Expediată", delivered: "Livrată", cancelled: "Anulată", ...statusLabelsFromDb };
  const statusIcons: Record<string, any> = { pending: Clock, processing: Package, shipped: Truck, delivered: CheckCircle2, cancelled: XCircle };

  const progressToNext = nextLevel
    ? Math.min(100, ((totalPoints - (currentLevel?.min_points || 0)) / (nextLevel.min_points - (currentLevel?.min_points || 0))) * 100)
    : 100;




  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Parola trebuie să aibă minim 6 caractere"); return; }
    if (newPassword !== confirmPassword) { toast.error("Parolele nu coincid"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); } else { toast.success("Parola a fost schimbată!"); setShowChangePassword(false); setNewPassword(""); setConfirmPassword(""); }
    setChangingPassword(false);
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const exportData: any = { profile, addresses, orders: orders.map(o => ({ id: o.id, total: o.total, status: o.status, created_at: o.created_at, items: o.order_items?.length || 0 })), loyalty_points: pointsHistory, exported_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `ventuza-date-personale-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Datele au fost exportate!");
    } catch { toast.error("Eroare la export"); }
    setExportingData(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await supabase.rpc("anonymize_user_data", { p_user_id: user.id });
      await supabase.auth.signOut();
      toast.success("Contul a fost anonimizat și te-ai deconectat.");
      window.location.href = "/";
    } catch { toast.error("Eroare la ștergerea contului"); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <Layout>
      <div className="container py-6 max-w-6xl">
        {/* Personalized greeting */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-medium">Bună, {profile?.full_name?.split(" ")[0] || "acolo"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestionează contul, comenzile și preferințele tale.</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{orders.length}</p>
            <p className="text-[10px] text-muted-foreground">Comenzi</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{totalPoints}</p>
            <p className="text-[10px] text-muted-foreground">Puncte fidelitate</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{currentLevel?.icon || "🥉"} {currentLevel?.name || "Bronze"}</p>
            <p className="text-[10px] text-muted-foreground">Nivel</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{addresses.length}</p>
            <p className="text-[10px] text-muted-foreground">Adrese salvate</p>
          </CardContent></Card>
        </div>

        {/* Two-column layout: main content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Tabs defaultValue="orders">
          <TabsList className="flex-wrap">
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-1" /> Comenzi</TabsTrigger>
            <TabsTrigger value="invoices"><FileText className="h-4 w-4 mr-1" /> Facturi</TabsTrigger>
            
            <TabsTrigger value="addresses"><MapPin className="h-4 w-4 mr-1" /> Adrese</TabsTrigger>
            <TabsTrigger value="loyalty"><Award className="h-4 w-4 mr-1" /> Fidelitate</TabsTrigger>
            <TabsTrigger value="affiliate"><Users className="h-4 w-4 mr-1" /> Afiliere</TabsTrigger>
            <TabsTrigger value="referral"><Share2 className="h-4 w-4 mr-1" /> Recomandă</TabsTrigger>
            <TabsTrigger value="wishlists"><Heart className="h-4 w-4 mr-1" /> Wishlist</TabsTrigger>
            <TabsTrigger value="giftcards"><Gift className="h-4 w-4 mr-1" /> Card cadou</TabsTrigger>
            <TabsTrigger value="wallet"><Wallet className="h-4 w-4 mr-1" /> Wallet</TabsTrigger>
            <TabsTrigger value="burnlog"><Flame className="h-4 w-4 mr-1" /> Burn Log</TabsTrigger>
            <TabsTrigger value="profile"><UserIcon className="h-4 w-4 mr-1" /> Profil</TabsTrigger>
            <TabsTrigger value="preferences"><Settings className="h-4 w-4 mr-1" /> Preferințe</TabsTrigger>
          </TabsList>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <p className="text-muted-foreground">Nu ai nicio comandă.</p>
            ) : orders.map(o => {
              const isExpanded = expandedOrder === o.id;
              const StatusIcon = statusIcons[o.status] || Package;
              const currentStep = STATUS_TIMELINE.indexOf(o.status);
              return (
                <Card key={o.id} className="overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Comanda #{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")} • {o.payment_method || "ramburs"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-primary">{format(Number(o.total))}</p>
                        <Badge variant={o.status === "delivered" ? "default" : "secondary"} className="text-xs"
                          style={statusColorsFromDb[o.status] ? { borderColor: statusColorsFromDb[o.status], color: statusColorsFromDb[o.status], backgroundColor: `${statusColorsFromDb[o.status]}15` } : {}}>
                          {statusLabels[o.status] || o.status}
                        </Badge>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-4 space-y-4">
                      {/* Tracking info */}
                      {o.tracking_number && (
                        <div className="bg-primary/5 rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold flex items-center gap-1"><Truck className="w-3 h-3" /> Tracking</span>
                            <Badge variant="outline" className="font-mono text-[10px]">{o.tracking_number}</Badge>
                          </div>
                          {o.courier && <p className="text-xs text-muted-foreground capitalize">Curier: {o.courier.replace(/_/g, " ")}</p>}
                          {o.tracking_url && (
                            <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                              Urmărește coletul →
                            </a>
                          )}
                        </div>
                      )}

                      {/* Tracking timeline */}
                      {o.status !== "cancelled" && (
                        <div className="flex items-center justify-between px-4">
                          {STATUS_TIMELINE.map((step, i) => {
                            const isActive = i <= currentStep;
                            const labels: Record<string, string> = { pending: "Plasată", processing: "Procesare", shipped: "Expediată", delivered: "Livrată", ...statusLabelsFromDb };
                            return (
                              <div key={step} className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                  {i + 1}
                                </div>
                                <p className={`text-xs mt-1 ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{labels[step]}</p>
                                {i < STATUS_TIMELINE.length - 1 && (
                                  <div className={`hidden sm:block absolute h-0.5 w-full ${isActive && i < currentStep ? "bg-primary" : "bg-muted"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <Separator />

                      {/* Order items */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Produse comandate</p>
                        {o.order_items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.products?.images?.[0] ? (
                                <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">{item.products?.name || "Produs"}</p>
                              <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                            </div>
                            <p className="font-semibold">{format(Number(item.price) * item.quantity)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Points earned */}
                      {o.loyalty_points_earned > 0 && (
                        <div className="bg-primary/5 rounded-lg p-2 text-center text-sm">
                          <Award className="h-4 w-4 inline mr-1 text-primary" />
                          <span className="font-medium">+{o.loyalty_points_earned} puncte fidelitate</span>
                        </div>
                      )}

                      {/* Return button + Invoice download */}
                      <div className="flex justify-between items-center">
                        <div>
                          {/* Quick invoice download if order has invoices */}
                          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={(e) => {
                            e.stopPropagation();
                            supabase.from("invoices").select("id").eq("order_id", o.id).limit(1).then(({ data }) => {
                              if (data?.[0]) downloadInvoicePdf(data[0].id);
                              else toast.info("Nu există factură pentru această comandă.");
                            });
                          }}>
                            <FileText className="w-3 h-3" /> Factură
                          </Button>
                        </div>
                        <div>
                          {hasReturn(o.id) ? (
                            <Badge variant="outline" className="text-xs">
                              <RotateCcw className="w-3 h-3 mr-1" /> Retur: {getReturnStatus(o.id)}
                            </Badge>
                          ) : RETURNABLE_STATUSES.includes(o.status) ? (
                            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setReturnOrder(o); }}>
                              <RotateCcw className="w-3 h-3" /> Solicită retur
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          {/* INVOICES TAB */}
          <TabsContent value="invoices" className="mt-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Facturile mele</h2>
            <CustomerInvoicesList userId={user.id} />
          </TabsContent>


          {/* ADDRESSES TAB */}
          <TabsContent value="addresses" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Adresele mele</h2>
              <Button size="sm" onClick={() => setAddressDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Adaugă adresă
              </Button>
            </div>
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nu ai nicio adresă salvată.</p>
            ) : addresses.map(addr => (
              <Card key={addr.id} className={addr.is_default ? "ring-2 ring-primary" : ""}>
                <CardContent className="p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{addr.label || "Adresă"}</p>
                      {addr.is_default && <Badge variant="default" className="text-xs">Implicită</Badge>}
                    </div>
                    <p className="text-sm">{addr.full_name}</p>
                    <p className="text-sm text-muted-foreground">{addr.address}, {addr.city}, {addr.county}</p>
                    <p className="text-sm text-muted-foreground">{addr.phone}</p>
                  </div>
                  <div className="flex gap-1">
                    {!addr.is_default && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDefaultAddress(addr.id)}>
                        <Star className="h-3 w-3 mr-1" /> Implicită
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAddress(addr.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* LOYALTY TAB */}
          <TabsContent value="loyalty" className="mt-4 space-y-4">
            {/* Current level */}
            <Card className="overflow-hidden">
              <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${currentLevel?.color || '#CD7F32'}22, ${currentLevel?.color || '#CD7F32'}11)` }}>
                <span className="text-5xl">{currentLevel?.icon || '🥉'}</span>
                <h2 className="text-2xl font-bold mt-2">{currentLevel?.name || 'Bronze'}</h2>
                <p className="text-3xl font-bold text-primary mt-1">{totalPoints} {loyaltyConfig.program_name || "puncte"}</p>
                {loyaltyConfig.redeem_rate_points > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Valoare: {pointsToValue(totalPoints).toFixed(2)} lei</p>
                )}
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

            {/* Referral */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Gift className="h-4 w-4 text-primary" /> Recomandă un prieten</h3>
                <p className="text-sm text-muted-foreground mb-3">Primești 50 de puncte pentru fiecare prieten care se înregistrează și plasează o comandă.</p>
                <div className="flex gap-2">
                  <Input value={`${window.location.origin}/auth?ref=${user?.id?.slice(0, 8)}`} readOnly className="text-xs" />
                  <Button variant="outline" size="sm" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4 mr-1" /> Copiază
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Points history */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Istoricul punctelor</CardTitle></CardHeader>
              <CardContent>
                {pointsHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nu ai acumulat puncte încă.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pointsHistory.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{p.description || p.action}</p>
                          <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ro-RO")}</p>
                        </div>
                        <span className={`font-bold ${p.points >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {p.points >= 0 ? "+" : ""}{p.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benefits */}
            {currentLevel && (
              <Card>
                <CardHeader><CardTitle className="text-base">Beneficiile tale</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(currentLevel.benefits || []).map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Gift className="h-4 w-4 text-primary flex-shrink-0" /> {b}
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
                    <div key={l.id} className={`rounded-lg border p-3 text-center ${l.id === currentLevel?.id ? 'ring-2 ring-primary' : ''}`}>
                      <span className="text-3xl">{l.icon}</span>
                      <p className="font-semibold mt-1">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.min_points}+ puncte</p>
                      {l.discount_percentage > 0 && <p className="text-xs font-medium text-primary">{l.discount_percentage}% reducere</p>}
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

          {/* PROFILE TAB */}
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

          {/* AFFILIATE TAB */}
          <TabsContent value="affiliate" className="mt-4">
            <AffiliateTab />
          </TabsContent>

          {/* REFERRAL TAB */}
          <TabsContent value="referral" className="mt-4">
            <ReferralTab />
          </TabsContent>

          {/* WISHLISTS TAB */}
          <TabsContent value="wishlists" className="mt-4">
            <WishlistTab />
          </TabsContent>

          {/* GIFT CARDS TAB */}
          <TabsContent value="giftcards" className="mt-4">
            <GiftCardTab />
          </TabsContent>

          {/* WALLET TAB */}
          <TabsContent value="wallet" className="mt-4">
            <WalletTab />
          </TabsContent>

          {/* BURN LOG TAB */}
          <TabsContent value="burnlog" className="mt-4">
            <BurnLogTab />
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4" /> Preferințe notificări</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "order_updates", label: "Actualizări comenzi" },
                  { key: "promotions", label: "Promoții și oferte" },
                  { key: "newsletter", label: "Newsletter" },
                ].map(item => {
                  const prefs = (profile?.notification_preferences as any) || { order_updates: true, promotions: true, newsletter: true };
                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label className="text-sm">{item.label}</Label>
                      <input
                        type="checkbox"
                        checked={prefs[item.key] !== false}
                        onChange={async (e) => {
                          const newPrefs = { ...prefs, [item.key]: e.target.checked };
                          await supabase.from("profiles").update({ notification_preferences: newPrefs as any }).eq("user_id", user.id);
                          setProfile((p: any) => p ? { ...p, notification_preferences: newPrefs } : p);
                          toast.success("Preferințe actualizate");
                        }}
                        className="h-4 w-4 rounded border-input"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Limbă & Monedă</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm">Limbă preferată</Label>
                  <Select
                    value={(profile as any)?.preferred_language || "ro"}
                    onValueChange={async (v) => {
                      await supabase.from("profiles").update({ preferred_language: v } as any).eq("user_id", user.id);
                      setProfile((p: any) => p ? { ...p, preferred_language: v } : p);
                      toast.success("Limbă actualizată");
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ro">Română</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hu">Magyar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Monedă preferată</Label>
                  <Select
                    value={(profile as any)?.preferred_currency || "RON"}
                    onValueChange={async (v) => {
                      await supabase.from("profiles").update({ preferred_currency: v } as any).eq("user_id", user.id);
                      setProfile((p: any) => p ? { ...p, preferred_currency: v } : p);
                      toast.success("Monedă actualizată");
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RON">RON (Lei)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div> {/* end left column */}

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Account Info Card */}
            <Card>
              <CardContent className="p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <UserIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-sm">{profile?.full_name || "Utilizator"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Membru din {user.created_at ? new Date(user.created_at).toLocaleDateString("ro-RO", { month: "long", year: "numeric" }) : "—"}</p>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Securitate</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => setShowChangePassword(true)}>
                  <KeyRound className="w-3.5 h-3.5" /> Schimbă parola
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleLogout}>
                  <LogOut className="w-3.5 h-3.5" /> Deconectare
                </Button>
              </CardContent>
            </Card>

            {/* GDPR Card */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DatabaseBackup className="w-4 h-4" /> Datele mele (GDPR)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleExportData} disabled={exportingData}>
                  <Download className="w-3.5 h-3.5" /> {exportingData ? "Se exportă..." : "Exportă datele personale"}
                </Button>
                <p className="text-[10px] text-muted-foreground">Descarcă o copie a tuturor datelor tale personale în format JSON, conform GDPR Art. 20.</p>
                <Separator />
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs text-destructive hover:text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <UserX className="w-3.5 h-3.5" /> Șterge contul
                </Button>
                <p className="text-[10px] text-muted-foreground">Conform GDPR Art. 17 (dreptul la ștergere). Datele vor fi anonimizate ireversibil.</p>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Link-uri rapide</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <Link to="/catalog" className="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1">🛒 Continuă cumpărăturile</Link>
                <Link to="/favorites" className="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1">❤️ Lista de dorințe</Link>
                <Link to="/tracking" className="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1">📦 Urmărește o comandă</Link>
                <Link to="/quiz-parfum" className="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1">🕯️ Quiz parfum</Link>
                <Link to="/faq" className="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1">❓ Întrebări frecvente</Link>
              </CardContent>
            </Card>

            {/* Legal info */}
            <div className="text-[10px] text-muted-foreground space-y-1 px-1">
              <p>Conform legislației UE (GDPR), ai dreptul la acces, rectificare, ștergere și portabilitatea datelor tale personale.</p>
              <p>VENTUZA SRL · J40/xxxxx/2020 · CUI: ROxxxxxxx</p>
              <Link to="/page/politica-de-confidentialitate" className="hover:underline block">Politica de confidențialitate</Link>
              <Link to="/page/termeni-si-conditii" className="hover:underline block">Termeni și condiții</Link>
            </div>
          </div>
        </div> {/* end grid */}

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schimbă parola</DialogTitle>
            <DialogDescription>Introdu noua parolă (minim 6 caractere).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Label>Parola nouă</Label>
              <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-8 text-muted-foreground" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <Label>Confirmă parola</Label>
              <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>Anulează</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>{changingPassword ? "Se procesează..." : "Salvează"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirm Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Ștergere cont</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să ștergi contul? Toate datele tale personale vor fi anonimizate ireversibil conform GDPR Art. 17. Comenzile existente vor rămâne în sistem doar pentru scopuri contabile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Anulează</Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>Da, șterge contul</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Request Form */}
      {returnOrder && user && (
        <ReturnRequestForm
          order={returnOrder}
          open={!!returnOrder}
          onClose={() => setReturnOrder(null)}
          onSuccess={refreshReturns}
          userId={user.id}
        />
      )}

      {/* Add Address Dialog */}
      <Dialog open={addressDialog} onOpenChange={setAddressDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adaugă adresă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Etichetă</Label>
              <Select value={addressForm.label} onValueChange={v => setAddressForm(p => ({ ...p, label: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acasă">Acasă</SelectItem>
                  <SelectItem value="Birou">Birou</SelectItem>
                  <SelectItem value="Altul">Altul</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nume complet *</Label><Input value={addressForm.full_name} onChange={e => setAddressForm(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div><Label>Telefon *</Label><Input value={addressForm.phone} onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><Label>Adresă *</Label><Input value={addressForm.address} onChange={e => setAddressForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Oraș *</Label><Input value={addressForm.city} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div><Label>Județ *</Label><Input value={addressForm.county} onChange={e => setAddressForm(p => ({ ...p, county: e.target.value }))} /></div>
            </div>
            <div><Label>Cod poștal</Label><Input value={addressForm.postal_code} onChange={e => setAddressForm(p => ({ ...p, postal_code: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialog(false)}>Anulează</Button>
            <Button onClick={saveAddress} disabled={!addressForm.full_name || !addressForm.phone || !addressForm.address || !addressForm.city || !addressForm.county}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
