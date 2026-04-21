import { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { X, ShoppingBag } from "lucide-react";

export default function ThemeToastSocialProof() {
  const { settings } = useSettings();
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const messagesRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  const show = settings.social_proof_show === "true";
  const interval = parseInt(settings.social_proof_interval_seconds || "12", 10) * 1000;

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.rpc("get_social_proof_messages", { limit_count: 10 });
    if (data?.length) {
      messagesRef.current = data.map((r: any) => r.message);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    fetchMessages();
  }, [show, fetchMessages]);

  useEffect(() => {
    if (!show || !messagesRef.current.length) return;

    const timer = setInterval(() => {
      const msgs = messagesRef.current;
      if (!msgs.length) return;
      setMessage(msgs[indexRef.current % msgs.length]);
      setVisible(true);
      indexRef.current++;
      setTimeout(() => setVisible(false), 5000);
    }, interval);

    return () => clearInterval(timer);
  }, [show, interval]);

  if (!show || !visible || !message) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-xs animate-fade-in">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <ShoppingBag className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">Acum câteva minute</p>
        </div>
        <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
