import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useSettings } from "@/hooks/useSettings";

const STORAGE_KEY = "lumax_announcement_closed";

export default function AnnouncementBar() {
  const { announcement } = useEditableContent();
  const { settings } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const closed = sessionStorage.getItem(STORAGE_KEY);
    if (!closed) setVisible(true);
  }, []);

  if (!visible || !announcement.enabled) return null;

  const threshold = settings.free_shipping_threshold || "200";
  const rawText = announcement.text_desktop || "🔥 OFERTA ZILEI: -30%! 🚚 Transport gratuit >200 lei! ⭐ 1000+ clienti multumiti! 🎁 Cadou la comenzi >300 lei!";
  const text = rawText.replace(/\{threshold\}/gi, threshold).replace(/\{(\d+)\}/g, (_, num) => num);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  const bgColor = announcement.bg_color || settings.announcement_bg || undefined;
  const textColor = announcement.text_color || settings.announcement_text_color || undefined;

  return (
    <div
      className="relative h-9 bg-lumax-red text-white text-xs font-semibold overflow-hidden flex items-center z-50"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      <div className="animate-marquee whitespace-nowrap flex">
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
      </div>
      <button
        onClick={handleClose}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Închide"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
