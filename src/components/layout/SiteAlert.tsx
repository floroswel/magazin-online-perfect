import { useState, useEffect } from "react";
import { X, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const STORAGE_KEY = "lumax_site_alert_dismissed";

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
  success: CheckCircle,
};

export default function SiteAlert() {
  const { settings: s } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
  }, []);

  if (s.site_alert_show !== "true" || !s.site_alert_text || dismissed) return null;

  const Icon = typeIcons[s.site_alert_type || "info"] || Info;
  const canDismiss = s.site_alert_dismissible !== "false";

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <div
      className="relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium z-[60]"
      style={{
        backgroundColor: s.site_alert_bg_color || "#FF3300",
        color: s.site_alert_text_color || "#FFFFFF",
      }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>
        {s.site_alert_text}
        {s.site_alert_link_text && s.site_alert_link_url && (
          <>
            {" "}
            <a
              href={s.site_alert_link_url}
              className="underline font-bold hover:opacity-80"
              style={{ color: s.site_alert_text_color || "#FFFFFF" }}
            >
              {s.site_alert_link_text}
            </a>
          </>
        )}
      </span>
      {canDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Închide"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
