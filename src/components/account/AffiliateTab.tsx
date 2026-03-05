import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Copy, MousePointerClick, ShoppingBag, DollarSign, TrendingUp, Loader2, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AffiliateTab() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: aff }, { data: s }] = await Promise.all([
        supabase.from("affiliates").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("app_settings").select("value_json").eq("key", "affiliate_config").maybeSingle(),
      ]);
      setAffiliate(aff);
      setSettings(s?.value_json || { min_payout: 100 });
      if (aff) {
        const [{ data: c }, { data: p }, { data: m }] = await Promise.all([
          supabase.from("affiliate_conversions").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("affiliate_payout_requests").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }),
          supabase.from("affiliate_materials").select("*").order("created_at", { ascending: false }),
        ]);
        setConversions(c || []);
        setPayouts(p || []);
        setMaterials(m || []);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const copyLink = () => {
    if (!affiliate) return;
    navigator.clipboard.writeText(`${window.location.origin}?ref=${affiliate.affiliate_code}`);
    toast.success("Link copiat!");
  };

  const copyCode = () => {
    if (!affiliate?.discount_code) return;
    navigator.clipboard.writeText(affiliate.discount_code);
    toast.success("Cod copiat!");
  };

  const requestPayout = async () => {
    if (!affiliate) return;
    const { error } = await supabase.from("affiliate_payout_requests").insert({
      affiliate_id: affiliate.id, amount: affiliate.available_balance, payment_method: payoutMethod,
    });
    if (error) { toast.error("Eroare"); return; }
    await supabase.from("affiliates").update({ available_balance: 0 }).eq("id", affiliate.id);
    setAffiliate((a: any) => ({ ...a, available_balance: 0 }));
    setPayoutDialog(false);
    toast.success("Cerere de plată trimisă!");
    const { data: p } = await supabase.from("affiliate_payout_requests").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false });
    setPayouts(p || []);
  };

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (!affiliate || affiliate.status !== "active") {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <p className="text-muted-foreground">
            {affiliate?.status === "pending" ? "Cererea ta de afiliere este în curs de analiză." :
             affiliate?.status === "rejected" ? "Cererea ta de afiliere a fost respinsă." :
             "Nu ești încă afiliat."}
          </p>
          {!affiliate && <Link to="/afilieri"><Button>Aplică acum →</Button></Link>}
        </CardContent>
      </Card>
    );
  }

  const convRate = affiliate.total_clicks > 0 ? ((affiliate.total_orders / affiliate.total_clicks) * 100).toFixed(1) : "0";
  const minPayout = settings?.min_payout || 100;
  const canRequestPayout = (affiliate.available_balance || 0) >= minPayout;

  return (
    <div className="space-y-4">
      {/* Referral link */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono truncate">
              {window.location.origin}?ref={affiliate.affiliate_code}
            </code>
            <Button size="sm" variant="outline" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
          </div>
          {affiliate.discount_code && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Cod discount:</span>
              <Badge variant="outline" className="font-mono">{affiliate.discount_code}</Badge>
              <Button size="sm" variant="ghost" onClick={copyCode}><Copy className="w-3 h-3" /></Button>
              <span className="text-xs text-muted-foreground">({affiliate.discount_percent}% reducere)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <MousePointerClick className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold">{affiliate.total_clicks || 0}</p>
          <p className="text-[10px] text-muted-foreground">Clickuri</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <ShoppingBag className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold">{affiliate.total_orders || 0}</p>
          <p className="text-[10px] text-muted-foreground">Comenzi</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingUp className="w-5 h-5 mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold">{convRate}%</p>
          <p className="text-[10px] text-muted-foreground">Rată conversie</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <DollarSign className="w-5 h-5 mx-auto text-amber-500 mb-1" />
          <p className="text-lg font-bold">{(affiliate.total_earnings || 0).toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Total câștigat (RON)</p>
        </CardContent></Card>
      </div>

      {/* Balance */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Sold disponibil</p>
              <p className="text-2xl font-bold text-green-600">{(affiliate.available_balance || 0).toFixed(2)} RON</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">În așteptare</p>
              <p className="text-lg font-semibold text-amber-500">{(affiliate.pending_balance || 0).toFixed(2)} RON</p>
            </div>
          </div>
          <Button onClick={() => setPayoutDialog(true)} disabled={!canRequestPayout} className="w-full">
            {canRequestPayout ? "Solicită plată" : `Minim ${minPayout} RON pentru plată`}
          </Button>
        </CardContent>
      </Card>

      {/* Conversions history */}
      {conversions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Istoric comisioane</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Valoare comandă</TableHead><TableHead>Comision</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {conversions.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString("ro-RO")}</TableCell>
                    <TableCell className="font-mono">{c.order_total?.toFixed(2)} RON</TableCell>
                    <TableCell className="font-mono font-bold">{c.commission_amount?.toFixed(2)} RON</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "available" ? "default" : c.status === "paid" ? "outline" : "secondary"}>
                        {c.status === "available" ? "Disponibil" : c.status === "paid" ? "Plătit" : "În așteptare"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payout history */}
      {payouts.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Istoric plăți</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Sumă</TableHead><TableHead>Metodă</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payouts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString("ro-RO")}</TableCell>
                    <TableCell className="font-mono font-bold">{p.amount?.toFixed(2)} RON</TableCell>
                    <TableCell>{p.payment_method === "bank_transfer" ? "Transfer bancar" : "PayPal"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
                        {p.status === "paid" ? "Plătit" : p.status === "rejected" ? "Respins" : "În așteptare"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Materials */}
      {materials.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Materiale promoționale</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {materials.map(m => (
                <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer" className="block">
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-2 space-y-1">
                      {m.file_type === "image" ? <img src={m.file_url} alt={m.title} className="w-full h-16 object-cover rounded" /> : <div className="w-full h-16 bg-muted rounded flex items-center justify-center"><Download className="w-5 h-5" /></div>}
                      <p className="text-xs font-medium truncate">{m.title}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout request dialog */}
      <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Solicită plată — {(affiliate.available_balance || 0).toFixed(2)} RON</DialogTitle></DialogHeader>
          <div><Label>Metodă de plată</Label>
            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Transfer bancar</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialog(false)}>Anulează</Button>
            <Button onClick={requestPayout}>Trimite cererea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
