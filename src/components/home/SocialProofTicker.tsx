import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function SocialProofTicker() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Single query with JOIN — no N+1
    supabase
      .from("order_items")
      .select("quantity, products(name), orders!inner(shipping_address, created_at)")
      .order("created_at", { ascending: false, referencedTable: "orders" })
      .limit(10)
      .then(({ data }) => {
        if (!data) return;
        const msgs = data
          .filter((oi: any) => oi.products?.name && oi.orders?.shipping_address?.fullName)
          .slice(0, 6)
          .map((oi: any) => {
            const name = (oi.orders.shipping_address as any)?.fullName?.split(" ")[0] || "Un client";
            const city = (oi.orders.shipping_address as any)?.city || "";
            const product = oi.products.name;
            return `${name} din ${city} a comandat ${product}`;
          });
        setMessages(msgs);
      });
  }, []);

  if (messages.length === 0) return null;

  return (
    <section className="border-y border-border py-3 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap flex gap-16">
        {[...messages, ...messages].map((msg, i) => (
          <span key={i} className="text-xs tracking-wide text-muted-foreground inline-block uppercase">
            {msg}
            <span className="mx-8 text-primary">·</span>
          </span>
        ))}
      </div>
    </section>
  );
}
