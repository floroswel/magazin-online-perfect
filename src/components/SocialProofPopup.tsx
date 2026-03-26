import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialProofEvent {
  id: string;
  product_name: string;
  product_image: string | null;
  buyer_city: string | null;
  buyer_first_name: string | null;
  created_at: string;
}

export default function SocialProofPopup() {
  const [event, setEvent] = useState<SocialProofEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    const fetchAndShow = async () => {
      const { data } = await supabase
        .from("social_proof_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!data || data.length === 0) return;

      let idx = 0;
      const showNext = () => {
        if (dismissed) return;
        const ev = (data as any[])[idx % data.length];
        setEvent(ev);
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
        idx++;
      };

      timeout = setTimeout(showNext, 15000);
      interval = setInterval(showNext, 30000);
    };

    fetchAndShow();
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [dismissed]);

  if (!event || dismissed) return null;

  const timeAgo = () => {
    const mins = Math.floor((Date.now() - new Date(event.created_at).getTime()) / 60000);
    if (mins < 1) return "chiar acum";
    if (mins < 60) return `acum ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `acum ${hours}h`;
    return `acum ${Math.floor(hours / 24)}z`;
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 max-w-xs bg-background border border-border rounded-lg shadow-lg p-3 transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1 right-1 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex gap-3 items-center">
        {event.product_image ? (
          <img src={event.product_image} alt="" className="w-12 h-12 rounded object-cover" />
        ) : (
          <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">
            {event.buyer_first_name || "Cineva"}{event.buyer_city ? ` din ${event.buyer_city}` : ""} a cumpărat
          </p>
          <p className="text-xs text-muted-foreground truncate">{event.product_name}</p>
          <p className="text-xs text-primary mt-0.5">{timeAgo()}</p>
        </div>
      </div>
    </div>
  );
}
