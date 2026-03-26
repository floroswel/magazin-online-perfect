import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, Users, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function ReferralTab() {
  const { user } = useAuth();
  const [referral, setReferral] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    // Get or create referral code
    const { data: existing } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_user_id", user!.id)
      .order("created_at", { ascending: false });

    const allReferrals = (existing as any[]) || [];
    setReferrals(allReferrals);

    if (allReferrals.length > 0) {
      setReferral(allReferrals[0]);
    }
    setLoading(false);
  };

  const generateCode = async () => {
    const code = `REF-${user!.id.substring(0, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await supabase.from("referrals").insert({
      referrer_user_id: user!.id,
      referral_code: code,
      referrer_reward_value: 10,
      referred_reward_value: 10,
    } as any);
    loadData();
    toast.success("Cod de recomandare generat!");
  };

  const copyLink = () => {
    if (!referral) return;
    const link = `${window.location.origin}?ref=${referral.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiat!");
  };

  const shareLink = () => {
    if (!referral) return;
    const link = `${window.location.origin}?ref=${referral.referral_code}`;
    if (navigator.share) {
      navigator.share({ title: "Recomandă-ne", text: "Folosește codul meu și primești 10% reducere!", url: link });
    } else {
      copyLink();
    }
  };

  const completed = referrals.filter((r) => r.status === "completed").length;

  if (loading) return <div className="py-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> Recomandă un prieten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Trimite codul tău de recomandare prietenilor. Când fac prima comandă, ambii primiți <strong>10% reducere</strong>!
          </p>

          {referral ? (
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <Input value={`${window.location.origin}?ref=${referral.referral_code}`} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={shareLink}><Share2 className="w-4 h-4" /></Button>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{referrals.length}</p>
                  <p className="text-xs text-muted-foreground">Invitații</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{completed}</p>
                  <p className="text-xs text-muted-foreground">Completate</p>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={generateCode}><Users className="w-4 h-4 mr-1" /> Generează cod de recomandare</Button>
          )}
        </CardContent>
      </Card>

      {referrals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Istoric recomandări</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-mono">{r.referral_code}</p>
                    <p className="text-xs text-muted-foreground">{r.referred_email || "Nefolosit încă"}</p>
                  </div>
                  <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                    {r.status === "completed" ? "Completat" : "În așteptare"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
