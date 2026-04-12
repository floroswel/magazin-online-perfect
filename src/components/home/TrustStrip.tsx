import { Truck, CreditCard, RotateCcw, Headphones } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface TrustBadge {
  icon: string;
  title: string;
  subtitle: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  "🚚": Truck,
  "💳": CreditCard,
  "↩️": RotateCcw,
  "🎧": Headphones,
};

const DEFAULT_BADGES: TrustBadge[] = [
  { icon: "🚚", title: "Livrare gratuită", subtitle: "Pentru comenzi peste 150 RON" },
  { icon: "💳", title: "Plată flexibilă", subtitle: "Card de credit sau debit" },
  { icon: "↩️", title: "Retur în 14 zile", subtitle: "Rambursare rapidă" },
  { icon: "🎧", title: "Suport premium", subtitle: "Asistență rapidă" },
];

export default function TrustStrip() {
  const { settings } = useSettings();

  let badges: TrustBadge[] = DEFAULT_BADGES;
  try {
    const parsed = JSON.parse(settings.trust_badges || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) badges = parsed;
  } catch {}

  return (
    <section className="py-8 md:py-10 bg-background">
      <div className="lumax-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((item, i) => {
            const IconComp = ICON_MAP[item.icon];
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center border border-border rounded-xl p-5 bg-card hover:shadow-md transition-shadow"
              >
                {IconComp ? (
                  <IconComp className="h-8 w-8 text-foreground mb-3 stroke-[1.5]" />
                ) : (
                  <span className="text-3xl mb-3">{item.icon}</span>
                )}
                <p className="text-sm font-bold text-foreground mb-0.5">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
