import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";

export default function Abonament() {
  const { format } = useCurrency();
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    (supabase as any)
      .from("candle_subscription_plans")
      .select("*")
      .eq("active", true)
      .order("price_ron")
      .then(({ data }: any) => setPlans(data || []));
  }, []);

  return (
    <Layout>
      <div className="container py-10 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground">🔄 Abonament Lumânări VENTUZA</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Primești lunar lumânări handmade la ușa ta. Alege planul potrivit și bucură-te de parfumuri noi în fiecare lună.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, i) => {
            const features = Array.isArray(plan.features) ? plan.features : [];
            return (
              <Card key={plan.id} className={`relative ${i === 1 ? "border-primary shadow-lg" : ""}`}>
                {i === 1 && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Popular</Badge>}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">{plan.price_ron}</span>
                    <span className="text-muted-foreground text-sm"> RON/lună</span>
                  </div>
                  {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {features.map((f: string, fi: number) => (
                      <li key={fi} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4" variant={i === 1 ? "default" : "outline"}>
                    Abonează-te
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground text-center">Cum funcționează?</h2>
          <div className="grid gap-4">
            {[
              { step: "1", title: "Alege planul", desc: "Selectează abonamentul care ți se potrivește" },
              { step: "2", title: "Preferințe parfum", desc: "Spune-ne ce parfumuri preferi (pentru Classic și Premium)" },
              { step: "3", title: "Livrare lunară", desc: "Primești lumânările la ușa ta în fiecare lună" },
              { step: "4", title: "Flexibilitate totală", desc: "Pauză sau anulare oricând, fără penalizări" },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
