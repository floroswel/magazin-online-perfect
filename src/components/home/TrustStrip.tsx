import { useSettings } from "@/hooks/useSettings";

interface TrustBadge {
  icon: string;
  title: string;
  subtitle: string;
}

const DEFAULT_BADGES: TrustBadge[] = [
  { icon: "🚚", title: "Livrare 24-48h", subtitle: "În toată România" },
  { icon: "↩️", title: "Retur 30 Zile", subtitle: "Fără întrebări" },
  { icon: "🔒", title: "Plată Securizată", subtitle: "SSL 256-bit" },
  { icon: "⭐", title: "1000+ Recenzii", subtitle: "Clienți mulțumiți" },
];

export default function TrustStrip() {
  const { settings } = useSettings();

  let badges: TrustBadge[] = DEFAULT_BADGES;
  try {
    const parsed = JSON.parse(settings.trust_badges || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) badges = parsed;
  } catch {}

  return (
    <section className="py-5" style={{ background: settings.trust_strip_color || undefined, backgroundColor: settings.trust_strip_color ? undefined : "hsl(var(--primary))" }}>
      <div className="lumax-container flex flex-wrap justify-around items-center gap-4">
        {badges.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-xl">
              {item.icon}
            </div>
            <div>
              <div className="text-primary-foreground text-sm font-bold">{item.title}</div>
              <div className="text-primary-foreground/75 text-[11px]">{item.subtitle}</div>
            </div>
            {i < badges.length - 1 && (
              <div className="hidden lg:block w-px h-8 bg-white/20 ml-4" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
