import { useState } from "react";
import { RefreshCw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FREQUENCIES = [
  { value: "weekly", label: "Săptămânal", days: 7 },
  { value: "biweekly", label: "La 2 săptămâni", days: 14 },
  { value: "monthly", label: "Lunar", days: 30 },
  { value: "bimonthly", label: "La 2 luni", days: 60 },
  { value: "quarterly", label: "La 3 luni", days: 90 },
];

interface SubscriptionOptionProps {
  product: any;
  quantity: number;
  selectedVariant?: any;
  hasVariants: boolean;
}

export default function SubscriptionOption({ product, quantity, selectedVariant, hasVariants }: SubscriptionOptionProps) {
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"single" | "subscription">("single");
  const [frequency, setFrequency] = useState("monthly");
  const [subscribing, setSubscribing] = useState(false);

  const discount = product.subscription_discount_percent || 10;
  const price = selectedVariant?.price || product.price;
  const discountedPrice = price * (1 - discount / 100);
  const savings = (price - discountedPrice) * quantity;

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Autentifică-te pentru a te abona");
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (hasVariants && !selectedVariant) {
      toast.error("Selectează toate opțiunile de variantă!");
      return;
    }
    setSubscribing(true);

    const freq = FREQUENCIES.find(f => f.value === frequency)!;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + freq.days);

    // Get default address
    const { data: defaultAddr } = await supabase
      .from("addresses").select("id").eq("user_id", user.id).eq("is_default", true).maybeSingle();

    const { error } = await supabase.from("subscriptions").insert({
      customer_id: user.id,
      product_id: product.id,
      variant_id: selectedVariant?.id || null,
      quantity,
      frequency,
      discount_percent: discount,
      status: "active",
      next_renewal_date: nextDate.toISOString(),
      delivery_address_id: defaultAddr?.id || null,
    });

    if (error) {
      toast.error("Eroare la crearea abonamentului");
      setSubscribing(false);
      return;
    }

    toast.success("Abonament creat cu succes! Prima comandă va fi procesată automat.");
    setSubscribing(false);
  };

  if (mode === "single") {
    return (
      <button
        type="button"
        onClick={() => setMode("subscription")}
        className="w-full text-left p-3 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 transition-colors bg-primary/5"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <RefreshCw className="w-4 h-4" />
          Abonează-te și economisești {discount}%
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Livrare automată la interval ales de tine</p>
      </button>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Abonament</span>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
            <Tag className="w-3 h-3 mr-1" /> -{discount}%
          </Badge>
        </div>
        <button onClick={() => setMode("single")} className="text-xs text-muted-foreground hover:text-foreground underline">
          Cumpărare unică
        </button>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-primary">{format(discountedPrice)}</span>
        <span className="text-sm text-muted-foreground line-through">{format(price)}</span>
        {savings > 0 && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            💰 Economisești {format(savings)}/comandă
          </span>
        )}
      </div>

      <Select value={frequency} onValueChange={setFrequency}>
        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {FREQUENCIES.map(f => (
            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleSubscribe}
        className="w-full font-semibold"
        size="lg"
        disabled={subscribing || (hasVariants && !selectedVariant)}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        {subscribing ? "Se procesează..." : "Abonează-te"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Poți anula sau modifica oricând din contul tău.
      </p>
    </div>
  );
}
