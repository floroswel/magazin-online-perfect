import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SiteBanner {
  id: string;
  banner_type: string;
  title: string;
  content: string | null;
  settings_json: any;
  is_active: boolean;
  scheduled_from: string | null;
  scheduled_until: string | null;
  sort_order: number;
}

function isWithinSchedule(b: SiteBanner): boolean {
  const now = new Date();
  if (b.scheduled_from && new Date(b.scheduled_from) > now) return false;
  if (b.scheduled_until && new Date(b.scheduled_until) < now) return false;
  return true;
}

export default function BannerRenderer() {
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("dismissed_banners") || "[]");
      return new Set(stored);
    } catch { return new Set(); }
  });

  const fetchBanners = async () => {
    const { data } = await (supabase as any)
      .from("site_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data) {
      setBanners((data as SiteBanner[]).filter(isWithinSchedule));
    }
  };

  useEffect(() => {
    fetchBanners();
    const channel = supabase
      .channel("site-banners-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_banners" }, () => fetchBanners())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("dismissed_banners", JSON.stringify([...next]));
  };

  const visible = banners.filter(b => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map(banner => {
        const settings = banner.settings_json || {};
        const bg = settings.bg_color || "hsl(var(--primary))";
        const fg = settings.text_color || "hsl(var(--primary-foreground))";
        const dismissible = settings.dismissible !== false;

        switch (banner.banner_type) {
          case "announcement_bar":
            return (
              <div key={banner.id} className="relative overflow-hidden" style={{ background: bg, color: fg }}>
                <div className="flex items-center h-9 justify-center">
                  <div className="animate-marquee flex items-center whitespace-nowrap gap-16 px-4">
                    <span className="text-[11px] font-sans tracking-wide">{banner.title}</span>
                    {banner.content && (
                      <>
                        <span className="text-[11px] opacity-40">✦</span>
                        <span className="text-[11px] font-sans tracking-wide">{banner.content}</span>
                      </>
                    )}
                    <span className="text-[11px] opacity-40">✦</span>
                    <span className="text-[11px] font-sans tracking-wide">{banner.title}</span>
                  </div>
                </div>
                {dismissible && (
                  <button onClick={() => dismiss(banner.id)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );

          case "sticky_top":
            return (
              <div key={banner.id} className="relative text-center py-2 px-4" style={{ background: bg, color: fg }}>
                <p className="text-xs font-medium">{banner.title}</p>
                {banner.content && <p className="text-[11px] opacity-80">{banner.content}</p>}
                {dismissible && (
                  <button onClick={() => dismiss(banner.id)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );

          case "corner_toast":
            return (
              <div key={banner.id} className="fixed bottom-4 right-4 z-[80] max-w-xs rounded-lg shadow-lg border border-border p-4 animate-fade-in" style={{ background: bg, color: fg }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{banner.title}</p>
                    {banner.content && <p className="text-xs mt-1 opacity-80">{banner.content}</p>}
                  </div>
                  {dismissible && (
                    <button onClick={() => dismiss(banner.id)} className="opacity-60 hover:opacity-100 shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );

          case "popup":
            return (
              <div key={banner.id} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 animate-fade-in">
                <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative">
                  <h3 className="text-lg font-semibold text-foreground">{banner.title}</h3>
                  {banner.content && <p className="text-sm text-muted-foreground mt-2">{banner.content}</p>}
                  {settings.cta_text && settings.cta_url && (
                    <a href={settings.cta_url} className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                      {settings.cta_text}
                    </a>
                  )}
                  <button onClick={() => dismiss(banner.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );

          case "side_banner":
            const side = settings.position === "left" ? "left-4" : "right-4";
            return (
              <div key={banner.id} className={`fixed top-1/2 -translate-y-1/2 ${side} z-[70] max-w-[200px] rounded-lg shadow-lg border border-border p-3`} style={{ background: bg, color: fg }}>
                <p className="text-xs font-semibold">{banner.title}</p>
                {banner.content && <p className="text-[11px] mt-1 opacity-80">{banner.content}</p>}
                {dismissible && (
                  <button onClick={() => dismiss(banner.id)} className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow">
                    <X className="h-3 w-3 text-foreground" />
                  </button>
                )}
              </div>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
