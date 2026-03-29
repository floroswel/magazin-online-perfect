import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, User as UserIcon, Award, Gift, RotateCcw, MapPin, Plus, Trash2, Star, Clock, ChevronDown, ChevronUp, Truck, CheckCircle2, XCircle, Copy, History, RefreshCw, FileText, Download, Settings, Users, Heart, Share2, Wallet, Flame, LogOut, Shield, KeyRound, DatabaseBackup, UserX, Eye, EyeOff, ShoppingBag, Sparkles, BookOpen, ArrowRight, TrendingUp } from "lucide-react";

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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
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

/* ──────────────── Empty state component ──────────────── */
function EmptyState({ icon: Icon, title, description, actionLabel, actionLink }: { icon: any; title: string; description: string; actionLabel?: string; actionLink?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-primary/60" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {actionLabel && actionLink && (
        <Link to={actionLink}>
          <Button size="sm" className="gap-1">{actionLabel} <ArrowRight className="w-3.5 h-3.5" /></Button>
        </Link>
      )}
    </div>
  );
}

export default function Account() {
  const { user } = useAuth();
  const { totalPoints, currentLevel, nextLevel, levels, loading: loyaltyLoading, config: loyaltyConfig, pointsToValue } = useLoyalty();
  const { format } = useCurrency();
  const { addToCart } = useCart();
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

  const [returnOrder, setReturnOrder] = useState<any>(null);
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
        const { data: userOrders } = await supabase.from("orders").select("id").eq("user_id", userId);
        if (!userOrders?.length) return [];
        const orderIds = userOrders.map(o => o.id);
        const { data } = await supabase.from("invoices").select("id, invoice_number, type, status, total, currency, issued_at, order_id").in("order_id", orderIds).order("issued_at", { ascending: false });
        return (data as any[]) || [];
      },
    });

    if (isLoading) return <p className="text-sm text-muted-foreground">Se încarcă...</p>;
    if (invoices.length === 0) return (
      <EmptyState icon={FileText} title="Nicio factură încă" description="Facturile vor apărea aici după prima ta comandă." actionLabel="Explorează produsele" actionLink="/catalog" />
    );

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

  const statusLabels: Record<string, string> = { pending: "În așteptare", processing: "Se procesează", shipped: "Expediată", delivered: "Livrată", cancelled: "Anulată", payment_failed: "Plată eșuată", refunded: "Rambursată", returned: "Returnată", on_hold: "În așteptare", pending_transfer: "Transfer în așteptare", pending_payment: "Plată în așteptare", ...statusLabelsFromDb };
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
      const a = document.createElement("a"); a.href = url; a.download = `mamalucica-date-personale-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Datele au fost exportate!");
    } catch { toast.error("Eroare la export"); }
    setExportingData(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Contul a fost șters definitiv.");
      window.location.href = "/";
    } catch { toast.error("Eroare la ștergerea contului"); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Recent order for sidebar
  const recentOrder = orders[0];
  const RecentOrderIcon = recentOrder ? (statusIcons[recentOrder.status] || Package) : Package;

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-6xl px-6 md:px-12">
        {/* Personalized greeting */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Bună, {(profile?.full_name && !profile.full_name.includes("DELETED") ? profile.full_name.split(" ")[0] : null) || "acolo"} 👋</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gestionează contul, comenzile și preferințele tale.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-destructive self-start min-h-[44px]" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Deconectare
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="group hover:border-primary/30 transition-colors overflow-hidden">
            <CardContent className="p-3 sm:p-4 text-center">
              <Package className="w-4 h-4 mx-auto mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-lg font-bold">{orders.length}</p>
              <p className="text-[10px] text-muted-foreground">Comenzi</p>
            </CardContent>
          </Card>
          <Card className="group hover:border-primary/30 transition-colors">
            <CardContent className="p-3 text-center">
              <Award className="w-4 h-4 mx-auto mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-lg font-bold">{totalPoints}</p>
              <p className="text-[10px] text-muted-foreground">Puncte fidelitate</p>
            </CardContent>
          </Card>
          <Card className="group hover:border-primary/30 transition-colors">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{currentLevel?.icon || "🥉"} {currentLevel?.name || "Bronze"}</p>
              <p className="text-[10px] text-muted-foreground">Nivel</p>
            </CardContent>
          </Card>
          <Card className="group hover:border-primary/30 transition-colors">
            <CardContent className="p-3 text-center">
              <MapPin className="w-4 h-4 mx-auto mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-lg font-bold">{addresses.length}</p>
              <p className="text-[10px] text-muted-foreground">Adrese salvate</p>
            </CardContent>
          </Card>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
          <div>
            <Tabs defaultValue="orders">
              {/* Scrollable tab bar */}
              <div className="w-full overflow-x-auto scrollbar-hide -mx-1 px-1">
                <TabsList className="inline-flex w-max gap-1 p-1 mb-1">
                  <TabsTrigger value="orders" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" /> Comenzi</TabsTrigger>
                  <TabsTrigger value="invoices" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Facturi</TabsTrigger>
                  <TabsTrigger value="addresses" className="gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" /> Adrese</TabsTrigger>
                  <TabsTrigger value="loyalty" className="gap-1.5 text-xs"><Award className="h-3.5 w-3.5" /> Fidelitate</TabsTrigger>
                  <TabsTrigger value="wishlists" className="gap-1.5 text-xs"><Heart className="h-3.5 w-3.5" /> Wishlist</TabsTrigger>
                  <TabsTrigger value="wallet" className="gap-1.5 text-xs"><Wallet className="h-3.5 w-3.5" /> Wallet</TabsTrigger>
                  <TabsTrigger value="giftcards" className="gap-1.5 text-xs"><Gift className="h-3.5 w-3.5" /> Card cadou</TabsTrigger>
                  <TabsTrigger value="referral" className="gap-1.5 text-xs"><Share2 className="h-3.5 w-3.5" /> Recomandă</TabsTrigger>
                  <TabsTrigger value="affiliate" className="gap-1.5 text-xs"><TrendingUp className="h-3.5 w-3.5" /> Afiliere</TabsTrigger>
                  <TabsTrigger value="burnlog" className="gap-1.5 text-xs"><Flame className="h-3.5 w-3.5" /> Burn Log</TabsTrigger>
                  <TabsTrigger value="profile" className="gap-1.5 text-xs"><UserIcon className="h-3.5 w-3.5" /> Profil</TabsTrigger>
                  <TabsTrigger value="preferences" className="gap-1.5 text-xs"><Settings className="h-3.5 w-3.5" /> Preferințe</TabsTrigger>
                </TabsList>
              </div>

              {/* ORDERS TAB */}
              <TabsContent value="orders" className="mt-4 space-y-3">
                {orders.length === 0 ? (
                  <EmptyState icon={ShoppingBag} title="Nicio comandă încă" description="Descoperă lumânările noastre artizanale și plasează prima ta comandă." actionLabel="Explorează colecția" actionLink="/catalog" />
                ) : orders.map(o => {
                  const isExpanded = expandedOrder === o.id;
                  const StatusIcon = statusIcons[o.status] || Package;
                  const currentStep = STATUS_TIMELINE.indexOf(o.status);
                  return (
                    <Card key={o.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <StatusIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Comanda #{o.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")} • {o.payment_method || "ramburs"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-primary">{format(Number(o.total))}</p>
                            <Badge
                              variant={o.status === "delivered" ? "default" : "secondary"}
                              className={`text-xs ${o.status === "payment_failed" ? "bg-destructive/10 text-destructive border-destructive/30" : ""}`}
                              style={statusColorsFromDb[o.status] ? { borderColor: statusColorsFromDb[o.status], color: statusColorsFromDb[o.status], backgroundColor: `${statusColorsFromDb[o.status]}15` } : {}}
                            >
                              {statusLabels[o.status] || o.status}
                            </Badge>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t px-4 py-4 space-y-4">
                          {o.tracking_number && (
                            <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold flex items-center gap-1"><Truck className="w-3 h-3" /> Tracking</span>
                                <Badge variant="outline" className="font-mono text-[10px]">{o.tracking_number}</Badge>
                              </div>
                              {((o as any).courier_name || o.courier) && (
                                <p className="text-xs text-muted-foreground">Curier: {(o as any).courier_name || o.courier?.replace(/_/g, " ")}</p>
                              )}
                              {o.tracking_url && (
                                <a href={o.tracking_url} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                                    <Truck className="w-3 h-3" /> Urmărește coletul →
                                  </Button>
                                </a>
                              )}
                            </div>
                          )}

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
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <Separator />

                          <div className="space-y-2">
                            <p className="text-sm font-semibold">Produse comandate</p>
                            {o.order_items?.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-3 text-sm">
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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

                          {o.loyalty_points_earned > 0 && (
                            <div className="bg-primary/5 rounded-lg p-2 text-center text-sm">
                              <Award className="h-4 w-4 inline mr-1 text-primary" />
                              <span className="font-medium">+{o.loyalty_points_earned} puncte fidelitate</span>
                            </div>
                          )}

                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={(e) => {
                                e.stopPropagation();
                                supabase.from("invoices").select("id").eq("order_id", o.id).limit(1).then(({ data }) => {
                                  if (data?.[0]) downloadInvoicePdf(data[0].id);
                                  else toast.info("Nu există factură pentru această comandă.");
                                });
                              }}>
                                <FileText className="w-3 h-3" /> Factură
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={async (e) => {
                                e.stopPropagation();
                                const orderItems = o.order_items || [];
                                let added = 0; const unavailable: string[] = [];
                                for (const item of orderItems) {
                                  const pid = item.product_id;
                                  const { data: prod } = await supabase.from("products").select("stock").eq("id", pid).single();
                                  if (prod && (prod.stock ?? 0) > 0) {
                                    await addToCart(pid, item.quantity);
                                    added++;
                                  } else {
                                    unavailable.push(item.products?.name || "Produs");
                                  }
                                }
                                if (added > 0) toast.success(`${added} produse adăugate în coș!`);
                                if (unavailable.length > 0) toast.error(`Indisponibile: ${unavailable.join(", ")}`);
                              }}>
                                <RefreshCw className="w-3 h-3" /> Comandă din nou
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
                  <EmptyState icon={MapPin} title="Nicio adresă salvată" description="Adaugă adrese pentru a comanda mai rapid data viitoare." />
                ) : addresses.map(addr => (
                  <Card key={addr.id} className={`hover:shadow-sm transition-shadow ${addr.is_default ? "ring-2 ring-primary" : ""}`}>
                    <CardContent className="p-4 flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{addr.label || "Adresă"}</p>
                            {addr.is_default && <Badge variant="default" className="text-xs">Implicită</Badge>}
                          </div>
                          <p className="text-sm">{addr.full_name}</p>
                          <p className="text-sm text-muted-foreground">{addr.address}, {addr.city}, {addr.county}</p>
                          <p className="text-sm text-muted-foreground">{addr.phone}</p>
                        </div>
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

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Istoricul punctelor</CardTitle></CardHeader>
                  <CardContent>
                    {pointsHistory.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nu ai acumulat puncte încă.</p>
                        <p className="text-xs mt-1">Plasează o comandă pentru a câștiga puncte!</p>
                      </div>
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

                <Card>
                  <CardHeader><CardTitle className="text-base">Toate nivelurile</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {levels.map(l => (
                        <div key={l.id} className={`rounded-xl border p-3 text-center transition-all hover:shadow-sm ${l.id === currentLevel?.id ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
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
                      <li>🛒 <strong>1 punct</strong> pentru fiecare leu cheltuit</li>
                      <li>⭐ <strong>10 puncte</strong> pentru o recenzie</li>
                      <li>👥 <strong>50 puncte</strong> pentru recomandarea unui prieten</li>
                      <li>🕯️ <strong>5 puncte</strong> pentru o sesiune în Burn Log</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PROFILE TAB */}
              <TabsContent value="profile" className="mt-4 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="w-5 h-5" /> Editare profil</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{profile?.full_name || "Utilizator"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Membru din {user.created_at ? new Date(user.created_at).toLocaleDateString("ro-RO", { month: "long", year: "numeric" }) : "—"}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label>Email</Label><Input value={user.email || ""} disabled className="mt-1" /></div>
                      <div><Label>Nume complet</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" /></div>
                      <div><Label>Telefon</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="mt-1" /></div>
                    </div>
                    <Button onClick={updateProfile}>Salvează modificările</Button>
                  </CardContent>
                </Card>

                {/* Account summary in profile tab */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Sumar cont</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Comenzi plasate:</span><span className="font-medium">{orders.length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Adrese salvate:</span><span className="font-medium">{addresses.length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Puncte fidelitate:</span><span className="font-medium">{totalPoints}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Nivel:</span><span className="font-medium">{currentLevel?.icon} {currentLevel?.name}</span></div>
                    </div>
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
                      { key: "order_updates", label: "Actualizări comenzi", desc: "Primești notificări despre statusul comenzilor tale" },
                      { key: "promotions", label: "Promoții și oferte", desc: "Primești oferte exclusive și reduceri personalizate" },
                      { key: "newsletter", label: "Newsletter", desc: "Noutăți și inspirație despre lumânări artizanale" },
                      { key: "price_alerts", label: "Alerte de preț", desc: "Fii notificat când produsele din wishlist au reducere" },
                    ].map(item => {
                      const prefs = (profile?.notification_preferences as any) || { order_updates: true, promotions: true, newsletter: true, price_alerts: true };
                      return (
                        <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div>
                            <Label className="text-sm font-medium">{item.label}</Label>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                          <button
                            role="switch"
                            aria-checked={prefs[item.key] !== false}
                            onClick={async () => {
                              const newPrefs = { ...prefs, [item.key]: prefs[item.key] === false };
                              await supabase.from("profiles").update({ notification_preferences: newPrefs as any }).eq("user_id", user.id);
                              setProfile((p: any) => p ? { ...p, notification_preferences: newPrefs } : p);
                              toast.success("Preferințe actualizate");
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${prefs[item.key] !== false ? 'bg-primary' : 'bg-input'}`}
                          >
                            <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${prefs[item.key] !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
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
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ro">🇷🇴 Română</SelectItem>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="hu">🇭🇺 Magyar</SelectItem>
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
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RON">RON (Lei)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="USD">USD (Dollar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile-only: Security & GDPR (sidebar hidden on mobile) */}
                <div className="lg:hidden space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Securitate</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => setShowChangePassword(true)}>
                        <KeyRound className="w-3.5 h-3.5" /> Schimbă parola
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DatabaseBackup className="w-4 h-4" /> Datele mele (GDPR)</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleExportData} disabled={exportingData}>
                        <Download className="w-3.5 h-3.5" /> {exportingData ? "Se exportă..." : "Exportă datele personale"}
                      </Button>
                      <Separator />
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs text-destructive hover:text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                        <UserX className="w-3.5 h-3.5" /> Șterge contul
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT SIDEBAR — hidden on mobile, info already in stats */}
          <div className="hidden lg:block space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Account Info Card */}
            <Card className="overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-primary/20 to-primary/5" />
              <CardContent className="p-4 text-center -mt-8">
                <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <UserIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-sm">{profile?.full_name || "Utilizator"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Membru din {user.created_at ? new Date(user.created_at).toLocaleDateString("ro-RO", { month: "long", year: "numeric" }) : "—"}</p>
              </CardContent>
            </Card>

            {/* Loyalty mini widget */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{currentLevel?.icon || "🥉"}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{currentLevel?.name || "Bronze"}</p>
                    <p className="text-[10px] text-muted-foreground">{totalPoints} puncte</p>
                  </div>
                </div>
                {nextLevel && (
                  <>
                    <Progress value={progressToNext} className="h-1.5 mb-1" />
                    <p className="text-[10px] text-muted-foreground">{nextLevel.min_points - totalPoints} puncte până la {nextLevel.icon} {nextLevel.name}</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Order */}
            {recentOrder && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Ultima comandă</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RecentOrderIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">#{recentOrder.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-muted-foreground">{statusLabels[recentOrder.status] || recentOrder.status}</p>
                    </div>
                    <p className="text-xs font-bold text-primary">{format(Number(recentOrder.total))}</p>
                  </div>
                </CardContent>
              </Card>
            )}

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
                <p className="text-[10px] text-muted-foreground">Descarcă o copie a datelor tale conform GDPR Art. 20.</p>
                <Separator />
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs text-destructive hover:text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <UserX className="w-3.5 h-3.5" /> Șterge contul
                </Button>
                <p className="text-[10px] text-muted-foreground">Datele vor fi anonimizate ireversibil (Art. 17).</p>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Link-uri rapide</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <Link to="/catalog" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-muted/50 px-2 -mx-2">
                  <ShoppingBag className="w-3.5 h-3.5" /> Continuă cumpărăturile
                </Link>
                <Link to="/favorites" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-muted/50 px-2 -mx-2">
                  <Heart className="w-3.5 h-3.5" /> Lista de dorințe
                </Link>
                <Link to="/tracking" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-muted/50 px-2 -mx-2">
                  <Truck className="w-3.5 h-3.5" /> Urmărește o comandă
                </Link>
                <Link to="/personalizare" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-muted/50 px-2 -mx-2">
                  <Sparkles className="w-3.5 h-3.5" /> Personalizare lumânare
                </Link>
                <Link to="/quiz-parfum" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-muted/50 px-2 -mx-2">
                  <Flame className="w-3.5 h-3.5" /> Quiz parfum
                </Link>
                <Link to="/faq" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 rounded-md hover:bg-muted/50 px-2 -mx-2">
                  <BookOpen className="w-3.5 h-3.5" /> Întrebări frecvente
                </Link>
              </CardContent>
            </Card>

            {/* Legal */}
            <div className="text-[10px] text-muted-foreground space-y-1 px-1">
              <p>Conform legislației UE (GDPR), ai dreptul la acces, rectificare, ștergere și portabilitatea datelor tale personale.</p>
              <Link to="/page/politica-de-confidentialitate" className="hover:underline block">Politica de confidențialitate</Link>
              <Link to="/page/termeni-si-conditii" className="hover:underline block">Termeni și condiții</Link>
              <Link to="/page/politica-retur" className="hover:underline block">Politica de retur</Link>
            </div>
          </div>
        </div>
      </div>

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
                  <SelectItem value="Acasă">🏠 Acasă</SelectItem>
                  <SelectItem value="Birou">🏢 Birou</SelectItem>
                  <SelectItem value="Altul">📍 Altul</SelectItem>
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
    </Layout>
  );
}
