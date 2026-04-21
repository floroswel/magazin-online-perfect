import { useState, useEffect, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, X } from "lucide-react";

export default function ToastSocialProof() {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const show = settings.social_proof_show === "true" || settings.social_proof_show === '"true"';
  const interval = parseInt((settings.social_proof_interval_seconds || "12").replace(/"/g, ""), 10) * 1000;

  useEffect(() => {
    if (!show) return;
    (async () => {
      const { data } = await supabase.rpc("get_social_proof_messages", { limit_count: 10 });
      if (data?.length) setMessages(data.map((d: any) => d.message));
    })();
  }, [show]);

  const showNext = useCallback(() => {
    if (!messages.length) return;
    const msg = messages[Math.floor(Math.random() * messages.length)];
    setCurrent(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 6000);
  }, [messages]);

  useEffect(() => {
    if (!show || !messages.length) return;
    const t1 = setTimeout(showNext, 6000);
    const t2 = setInterval(showNext, interval + 6000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [show, messages, interval, showNext]);

  if (!show || !visible || !current) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[90] animate-toast">
      <div className="bg-white border shadow-2xl w-[320px] p-4 flex items-start gap-3" style={{ borderColor: "#e5e7eb", borderRadius: 4 }}>
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{current}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Verificat ✓</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
