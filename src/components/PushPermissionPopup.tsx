import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

export default function PushPermissionPopup() {
  const { isSupported, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("Activează notificările pentru oferte exclusive!");
  const [delay, setDelay] = useState(10);

  useEffect(() => {
    // Don't show if not supported or already granted/denied
    if (!isSupported) return;
    if (Notification.permission !== "default") return;
    // Don't show if dismissed recently
    const dismissed = localStorage.getItem("push_popup_dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 86400000) return;

    supabase.from("app_settings").select("value_json").eq("key", "push_settings").maybeSingle()
      .then(({ data }) => {
        const s = data?.value_json as any;
        if (s?.push_permission_delay_seconds) setDelay(s.push_permission_delay_seconds);
        if (s?.push_permission_text) setText(s.push_permission_text);
      });
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported || Notification.permission !== "default") return;
    const dismissed = localStorage.getItem("push_popup_dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 86400000) return;

    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [isSupported, delay]);

  if (!visible) return null;

  const handleAllow = async () => {
    await subscribe();
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("push_popup_dismissed", String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{text}</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAllow}>Activează</Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>Nu acum</Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
