import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Bell, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { usePageSeo } from "@/components/SeoHead";
import type { Tables } from "@/integrations/supabase/types";

export default function NouLansari() {
  usePageSeo({
    title: "Lansări Noi — Produse Noi | MamaLucica",
    description: "Descoperă cele mai noi lumânări artizanale. Fii primul care vede colecțiile noi!",
  });

  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const { format } = useCurrency();

  // Simulate a countdown for next launch (7 days from now)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [launchDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(12, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const diff = launchDate.getTime() - now;
      if (diff <= 0) return;
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [launchDate]);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setProducts(data || []));
  }, []);

  const handleNotify = () => {
    toast.success("Te vom notifica la lansare! 🔔");
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Layout>
      {/* Hero with countdown */}
      <section className="bg-secondary text-secondary-foreground py-16 md:py-20">
        <div className="container max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" /> COMING SOON
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium mb-3">Noua Colecție Se Lansează Curând</h1>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Fii primul care descoperă parfumurile noi. Rezervă-ți notificarea și primești acces cu 24h înaintea lansării publice.
          </p>

          {/* Countdown */}
          <div className="flex justify-center gap-3 md:gap-4 mb-8">
            {[
              { value: countdown.days, label: "Zile" },
              { value: countdown.hours, label: "Ore" },
              { value: countdown.minutes, label: "Min" },
              { value: countdown.seconds, label: "Sec" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-3 md:p-4 min-w-[70px]">
                <p className="text-2xl md:text-3xl font-bold font-mono text-foreground">{pad(item.value)}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <Button onClick={handleNotify} size="lg" className="font-semibold gap-2">
            <Bell className="w-4 h-4" /> Notifică-mă la lansare
          </Button>
        </div>
      </section>

      {/* Latest products */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Cele Mai Noi Produse</h2>
          <Link to="/catalog" className="text-sm text-primary hover:underline flex items-center gap-1">
            Toate produsele <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </Layout>
  );
}
