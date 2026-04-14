import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePageSeo } from "@/components/SeoHead";
import { Flame, Gift, Truck, Percent } from "lucide-react";

export default function LumanarLunii() {
  usePageSeo({ title: "Abonament Lumânarea Lunii | Mama Lucica" });
  const { format } = useCurrency();

  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("candle_subscription_plans").select("*").eq("active", true).order("price_ron");
      return data || [];
    },
  });

  const basicPlan = plans?.find(p => p.candles_per_month === 1) || plans?.[0];
  const premiumPlan = plans?.find(p => p.candles_per_month === 2) || plans?.[1];

  const benefits = [
    { icon: <Flame className="h-5 w-5" />, text: "Surpriză lunară — parfum ales de noi" },
    { icon: <Percent className="h-5 w-5" />, text: "10% reducere permanentă" },
    { icon: <Truck className="h-5 w-5" />, text: "Livrare gratuită inclusă" },
    { icon: <Gift className="h-5 w-5" />, text: "Cadou surpriză la fiecare 3 luni" },
  ];

  const mailtoLink = (plan: string) =>
    `mailto:contact@mamalucica.ro?subject=${encodeURIComponent(`Vreau să mă abonez la planul ${plan}`)}&body=${encodeURIComponent(`Bună!\n\nAș dori să mă abonez la planul ${plan} al Lumânării Lunii.\n\nNume:\nTelefon:\nAdresă livrare:\n\nMulțumesc!`)}`;

  return (
    <Layout>
      <div className="ml-container py-10 max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-center mb-2">🕯️ Lumânarea Lunii</h1>
        <p className="text-center text-muted-foreground mb-8">
          Abonează-te și primești în fiecare lună lumânări artizanale alese special pentru tine
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {benefits.map((b, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="text-primary mx-auto mb-2 flex justify-center">{b.icon}</div>
              <p className="text-xs font-semibold">{b.text}</p>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Basic */}
          <div className="bg-card border-2 border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
            <h3 className="text-lg font-bold mb-1">Plan Basic</h3>
            <p className="text-sm text-muted-foreground mb-4">1 lumânare / lună</p>
            <p className="text-3xl font-extrabold text-primary mb-1">
              {basicPlan ? format(basicPlan.price_ron) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mb-6">/ lună</p>
            <Button asChild className="w-full h-12 font-bold">
              <a href={mailtoLink("BASIC")}>Mă abonez →</a>
            </Button>
          </div>

          {/* Premium */}
          <div className="bg-card border-2 border-primary rounded-xl p-6 text-center relative overflow-hidden">
            <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
            <h3 className="text-lg font-bold mb-1">Plan Premium</h3>
            <p className="text-sm text-muted-foreground mb-4">2 lumânări / lună</p>
            <p className="text-3xl font-extrabold text-primary mb-1">
              {premiumPlan ? format(premiumPlan.price_ron) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mb-6">/ lună</p>
            <Button asChild className="w-full h-12 font-bold">
              <a href={mailtoLink("PREMIUM")}>Mă abonez →</a>
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Abonamentele sunt gestionate manual momentan. După trimiterea email-ului, echipa noastră te va contacta pentru confirmare.
          Poți anula abonamentul oricând.
        </p>
      </div>
    </Layout>
  );
}
