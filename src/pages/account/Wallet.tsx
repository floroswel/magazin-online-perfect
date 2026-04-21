import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Inbox } from "lucide-react";
import AccountLayout from "@/components/account/AccountLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Tx {
  id: string;
  type: string;
  amount: number;
  direction: string | null;
  description: string | null;
  created_at: string;
}

const ROMANIAN_MONTHS = ["ianuarie","februarie","martie","aprilie","mai","iunie","iulie","august","septembrie","octombrie","noiembrie","decembrie"];

function formatRoDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${ROMANIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function isCredit(t: Tx) {
  if (t.direction) return t.direction === "credit" || t.direction === "in";
  return ["credit", "refund", "bonus", "deposit", "topup"].includes(t.type);
}

export default function WalletPage() {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [txRes, walletRes] = await Promise.all([
        supabase
          .from("wallet_transactions")
          .select("id, type, amount, direction, description, created_at")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("customer_wallets" as any)
          .select("available_balance")
          .eq("customer_id", user.id)
          .maybeSingle(),
      ]);
      setTxs(txRes.data || []);
      setBalance(Number((walletRes.data as any)?.available_balance) || 0);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AccountLayout title="Portofel">
      <Card className="mb-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm opacity-80 mb-2">
            <WalletIcon className="w-4 h-4" /> Sold disponibil
          </div>
          <p className="text-4xl md:text-5xl font-display">
            {balance.toFixed(2)} <span className="text-2xl opacity-80">RON</span>
          </p>
          <p className="text-xs opacity-70 mt-3">
            Folosește soldul ca metodă de plată la checkout.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h2 className="font-medium">Istoric tranzacții</h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Se încarcă…</div>
          ) : txs.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Niciun istoric încă</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {txs.map((t) => {
                const credit = isCredit(t);
                return (
                  <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        credit ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                      }`}
                    >
                      {credit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.description || (credit ? "Alimentare portofel" : "Plată din portofel")}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatRoDate(t.created_at)}</p>
                    </div>
                    <div className={`text-base font-semibold tabular-nums ${credit ? "text-success" : "text-danger"}`}>
                      {credit ? "+" : "−"}{Number(t.amount).toFixed(2)} RON
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
