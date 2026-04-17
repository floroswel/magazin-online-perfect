import { useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  productId: string;
  productName: string;
  currentPrice: number;
}

export default function PriceDropAlert({ productId, productName, currentPrice }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.includes("@")) {
      toast.error("Introdu o adresă de email validă");
      return;
    }
    setLoading(true);
    // Try to insert in price_alerts table, or back_in_stock as fallback
    const { error } = await supabase.from("back_in_stock_notifications").insert({
      product_id: productId,
      email,
    });
    setLoading(false);
    if (error) {
      toast.error("A apărut o eroare. Încearcă din nou.");
      return;
    }
    setSubmitted(true);
    toast.success("Te vom notifica când scade prețul!");
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-[hsl(var(--store-success))]">
        <Check className="w-4 h-4" />
        <span>Vei fi notificat când scade prețul</span>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="email"
          placeholder="Email pentru alertă preț"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 text-sm"
        />
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          <BellRing className="w-4 h-4 mr-1" />
          Alertă
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      <Bell className="w-4 h-4" />
      <span>Anunță-mă când scade prețul</span>
    </button>
  );
}
