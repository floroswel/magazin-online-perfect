import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const STORAGE_KEY = "lumax_ticker2_closed";

export default function Ticker2Bar() {
  const { settings: s } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const messages = (s.ticker2_messages || "").split("|").filter(Boolean);

  if (!visible || s.ticker2_show !== "true" || messages.length === 0) return null;

  const separator = s.ticker2_separator || "·";
  const speed = s.ticker2_speed || "40";
  const direction = s.ticker2_direction === "right" ? "reverse" : "normal";
  const text = messages.join(` ${separator} `);

  return (
    <div
      className="relative h-8 text-xs font-bold overflow-hidden flex items-center z-50"
      style={{
        backgroundColor: s.ticker2_bg_color || "#FFB800",
        color: s.ticker2_text_color || "#000000",
      }}
    >
      <div
        className="animate-marquee whitespace-nowrap flex"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: direction,
        }}
      >
        <span className="px-12">{text}</span>
        <span className="px-12">{text}</span>
        <span className="px-12">{text}</span>
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
