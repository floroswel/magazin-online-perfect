import { useSettings } from "@/hooks/useSettings";

export default function ThemeTicker() {
  const { settings } = useSettings();

  const show = settings.ticker_messages || settings._raw_ticker_messages;
  if (!show) return null;

  let messages: string[] = [];
  try {
    const raw = settings._raw_ticker_messages || settings.ticker_messages;
    messages = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!messages.length) return null;

  const bg = settings.ticker_bg_color || "#d32f2f";
  const color = settings.ticker_text_color || "#ffffff";
  const speed = parseInt(settings.ticker_speed || "25", 10);

  const doubled = [...messages, ...messages];

  return (
    <div
      className="overflow-hidden border-b border-border/30"
      style={{ background: bg, color, ["--marquee-speed" as string]: `${speed}s` }}
    >
      <div className="marquee-track flex gap-12 py-2 whitespace-nowrap text-xs font-medium tracking-wide uppercase">
        {doubled.map((msg, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="opacity-60">●</span>
            <span>{msg}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
