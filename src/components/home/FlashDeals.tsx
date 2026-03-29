import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Lock, Mail } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  title?: string;
}

export default function FlashDeals({ title = "⚡ Flash Deals" }: Props) {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useScrollReveal();
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  // Check if user is a newsletter subscriber
  useEffect(() => {
    const stored = localStorage.getItem("flash_subscriber");
    if (stored) setIsSubscriber(true);
  }, []);

  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const tick = () => {
      const diff = Math.max(0, endOfDay.getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .not("old_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  const handleSubscribe = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Introdu un email valid.");
      return;
    }
    setSubscribing(true);
    await supabase.from("newsletter_subscribers").upsert(
      { email: email.trim().toLowerCase(), source: "flash_deals" } as any,
      { onConflict: "email" }
    );
    localStorage.setItem("flash_subscriber", "1");
    setIsSubscriber(true);
    setSubscribing(false);
    toast.success("🎉 Acces acordat! Acum vezi toate ofertele Flash.");
  };

  const showBlurred = !isSubscriber && products.length > 2;

  return (
    <section className="bg-card border-y border-border" ref={ref}>
      <div className="container py-6 md:py-10 px-4">
        <div className="flex items-center justify-between mb-5 reveal stagger-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span className="font-bold text-sm">{title}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Se termină în:</span>
              <span className="bg-foreground text-background font-mono font-bold px-1.5 py-0.5 rounded text-xs">{String(timeLeft.h).padStart(2, "0")}</span>
              <span className="font-bold text-foreground">:</span>
              <span className="bg-foreground text-background font-mono font-bold px-1.5 py-0.5 rounded text-xs">{String(timeLeft.m).padStart(2, "0")}</span>
              <span className="font-bold text-foreground">:</span>
              <span className="bg-foreground text-background font-mono font-bold px-1.5 py-0.5 rounded text-xs">{String(timeLeft.s).padStart(2, "0")}</span>
            </div>
          </div>
          <Link to="/catalog?badge=deals" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            Vezi toate <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 reveal stagger-2">
              {products.map((p, i) => (
                <div key={p.id} className={showBlurred && i >= 2 ? "blur-sm pointer-events-none select-none" : ""}>
                  <ProductCard product={p} eager={i < 4} />
                </div>
              ))}
            </div>

            {/* Subscriber Gate Overlay */}
            {showBlurred && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ top: "30%" }}>
                <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-6 max-w-sm text-center shadow-lg">
                  <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">Acces Exclusiv Flash Sale</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Abonează-te pentru a vedea toate ofertele cu reduceri de până la 50%!
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Email-ul tău"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSubscribe} disabled={subscribing}>
                      <Mail className="w-4 h-4 mr-1" />
                      {subscribing ? "..." : "Vreau acces"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
