import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";

interface AlertSettings {
  show: boolean;
  text: string;
  bg_color: string;
  text_color: string;
  link_text?: string;
  link_url?: string;
  dismissible?: boolean;
}

export default function SiteAlert() {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("ml_alert_dismissed") === "1") {
      setDismissed(true);
    }
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("key, value_json")
        .in("key", ["site_alert_show", "site_alert_text", "site_alert_bg_color", "site_alert_text_color", "site_alert_link_text", "site_alert_link_url", "site_alert_dismissible"]);
      if (!data?.length) return;
      const map: any = {};
      data.forEach((r: any) => {
        const v = r.value_json;
        map[r.key] = typeof v === "string" ? v.replace(/^"|"$/g, "") : v;
      });
      if (String(map.site_alert_show) === "true") {
        setSettings({
          show: true,
          text: map.site_alert_text || "",
          bg_color: map.site_alert_bg_color || "#141414",
          text_color: map.site_alert_text_color || "#F8F5EF",
          link_text: map.site_alert_link_text,
          link_url: map.site_alert_link_url,
          dismissible: String(map.site_alert_dismissible) === "true",
        });
      }
    })();
  }, []);

  if (!settings?.show || dismissed || !settings.text) return null;

  return (
    <div
      className="text-xs font-medium text-center py-2 px-4 flex items-center justify-center gap-2"
      style={{ background: settings.bg_color, color: settings.text_color }}
    >
      <Megaphone className="h-3 w-3" />
      <span>{settings.text}</span>
      {settings.link_text && settings.link_url && (
        <a href={settings.link_url} className="underline font-semibold hover:opacity-80">
          {settings.link_text}
        </a>
      )}
      {settings.dismissible && (
        <button
          onClick={() => { setDismissed(true); localStorage.setItem("ml_alert_dismissed", "1"); }}
          className="ml-3 opacity-60 hover:opacity-100"
          aria-label="Închide"
        >
          ✕
        </button>
      )}
    </div>
  );
}
