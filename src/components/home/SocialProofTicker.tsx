import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function SocialProofTicker() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("orders")
      .select("shipping_address, created_at, order_items(products(name))")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        const msgs = data
          .filter((o: any) => o.shipping_address?.fullName && o.order_items?.[0]?.products?.name)
          .slice(0, 6)
          .map((o: any) => {
            const name = (o.shipping_address as any)?.fullName?.split(" ")[0] || "Un client";
            const city = (o.shipping_address as any)?.city || "";
            const product = o.order_items[0].products.name;
            return `${name} din ${city} a comandat ${product} 🕯️`;
          });
        setMessages(msgs);
      });
  }, []);

  if (messages.length === 0) return null;

  return (
    <section className="bg-primary/5 border-y border-primary/10 py-3 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex gap-12">
        {[...messages, ...messages].map((msg, i) => (
          <span key={i} className="text-sm text-foreground/70 inline-block">
            {msg}
            <span className="mx-6 text-muted-foreground">•</span>
          </span>
        ))}
      </div>
    </section>
  );
}
