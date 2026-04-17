import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function TopTicker() {
  const [messages, setMessages] = useState<string[]>([]);
  const [bg, setBg] = useState("#141414");
  const [color, setColor] = useState("#F8F5EF");
  const [show, setShow] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("key, value_json")
        .in("key", ["ticker2_show", "ticker2_messages", "ticker2_bg_color", "ticker2_text_color", "ticker2_separator"]);
      if (!data?.length) return;
      const map: any = {};
      data.forEach((r: any) => {
        const v = r.value_json;
        map[r.key] = typeof v === "string" ? v.replace(/^"|"$/g, "") : v;
      });
      if (String(map.ticker2_show) !== "true") return;
      const sep = map.ticker2_separator || " • ";
      const raw = (map.ticker2_messages || "").toString();
      const list = raw.split("|").map((s: string) => s.trim()).filter(Boolean);
      if (list.length === 0) {
        list.push("Lumânări 100% handmade", "Livrare 24-48h în România", "Retur 30 zile fără întrebări");
      }
      setMessages(list);
      setBg(map.ticker2_bg_color || "#141414");
      setColor(map.ticker2_text_color || "#F8F5EF");
      setShow(true);
    })();
  }, []);

  if (!show || !messages.length) return null;

  // Duplicate messages for infinite scroll
  const doubled = [...messages, ...messages];

  return (
    <div className="overflow-hidden border-b border-border/30" style={{ background: bg, color }}>
      <div className="ticker-track flex gap-12 py-2 whitespace-nowrap text-xs font-medium tracking-wide uppercase">
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
