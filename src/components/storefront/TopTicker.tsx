import { useSettings } from "@/hooks/useSettings";

export default function TopTicker() {
  const { settings: s } = useSettings();

  const show = s.ticker1_show;
  if (show !== "true" && show !== '"true"') return null;

  let messages: string[] = [];
  try {
    const raw = s.ticker_messages || s._raw_ticker_messages;
    if (raw) messages = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
  } catch {}
  if (!messages.length) return null;

  const bg = (s.ticker_bg_color || "#d32f2f").replace(/^"|"$/g, "");
  const color = (s.ticker_text_color || "#ffffff").replace(/^"|"$/g, "");

  const doubled = [...messages, ...messages];

  return (
    <div className="overflow-hidden h-10 flex items-center z-[60]" style={{ background: bg, color }}>
      <div className="ticker-track flex gap-16 whitespace-nowrap text-xs font-semibold tracking-wide uppercase">
        {doubled.map((msg, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="opacity-50">●</span>
            <span>{msg}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
