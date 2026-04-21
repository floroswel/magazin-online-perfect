import { useState, useEffect, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";

interface ProofData {
  message: string;
  name: string;
  city: string;
  product: string;
}

export default function ToastSocialProof() {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<ProofData[]>([]);
  const [current, setCurrent] = useState<ProofData | null>(null);
  const [visible, setVisible] = useState(false);

  const show = settings.social_proof_show === "true" || settings.social_proof_show === '"true"';
  const interval = parseInt((settings.social_proof_interval_seconds || "12").replace(/"/g, ""), 10) * 1000;

  useEffect(() => {
    if (!show) return;
    (async () => {
      const { data } = await supabase.rpc("get_social_proof_messages", { limit_count: 10 });
      if (data?.length) {
        setMessages(data.map((d: any) => {
          const msg = d.message as string;
          // Parse "Ion din București a cumpărat Lumânare..."
          const nameMatch = msg.match(/^(.+?) din (.+?) a cumpărat (.+)$/);
          return {
            message: msg,
            name: nameMatch?.[1] || "Client",
            city: nameMatch?.[2] || "România",
            product: nameMatch?.[3] || "un produs",
          };
        }));
      }
    })();
  }, [show]);

  const showNext = useCallback(() => {
    if (!messages.length) return;
    const item = messages[Math.floor(Math.random() * messages.length)];
    setCurrent(item);
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
    <div className="fixed bottom-6 left-6 z-[90]">
      <div className="bg-white border border-gray-200 rounded-sm shadow-2xl w-[320px] p-3 flex items-center gap-3 animate-toast">
        {/* Product image placeholder */}
        <div className="w-12 h-12 bg-gray-100 rounded-sm overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
          <span className="text-2xl">🕯️</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">Acum câteva minute</p>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {current.name} din {current.city}
          </p>
          <p className="text-xs text-gray-500 truncate">
            a cumpărat: {current.product}
          </p>
        </div>

        {/* Verified badge */}
        <div className="text-green-500 text-xs font-bold shrink-0">✔ Verificat</div>
      </div>
    </div>
  );
}
