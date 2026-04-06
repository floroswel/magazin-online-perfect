import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const STORAGE_KEY = "lumax_ticker1_closed";

export default function Ticker1Bar() {
  const { settings: s } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible || s.ticker1_show !== "true" || !s.ticker1_text) return null;

  const speed = s.ticker1_speed || "30";
  const direction = s.ticker1_direction === "right" ? "reverse" : "normal";

  return (
    <div
      className="relative h-9 text-xs font-semibold overflow-hidden flex items-center z-50"
      style={{
        backgroundColor: s.ticker1_bg_color || "#FFFFFF",
        color: s.ticker1_text_color || "#000000",
      }}
    >
      <div
        className="animate-marquee whitespace-nowrap flex"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: direction,
        }}
      >
        <span className="px-8">{s.ticker1_text}</span>
        <span className="px-8">{s.ticker1_text}</span>
        <span className="px-8">{s.ticker1_text}</span>
        <span className="px-8">{s.ticker1_text}</span>
      </div>
      <button
        onClick={() => { setVisible(false); sessionStorage.setItem(STORAGE_KEY, "1"); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded transition-colors"
        aria-label="Închide"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
