type Availability =
  | "in_stock" | "low_stock" | "out_of_stock" | "preorder"
  | "available_2_3" | "available_5_7" | "available_7_10" | "available_10_20"
  | "discontinued" | "notify_me";

const MAP: Record<Availability, { label: string; tone: string }> = {
  in_stock:        { label: "În stoc",            tone: "success" },
  low_stock:       { label: "Stoc limitat",       tone: "warning" },
  out_of_stock:    { label: "Indisponibil",       tone: "danger" },
  preorder:        { label: "Precomandă",         tone: "info" },
  available_2_3:   { label: "Livrare 2-3 zile",   tone: "success" },
  available_5_7:   { label: "Livrare 5-7 zile",   tone: "success" },
  available_7_10:  { label: "Livrare 7-10 zile",  tone: "warning" },
  available_10_20: { label: "Livrare 10-20 zile", tone: "warning" },
  discontinued:    { label: "Retras",             tone: "neutral" },
  notify_me:       { label: "Anunță-mă",          tone: "info" },
};

const TONE_CLASS: Record<string, { bg: string; text: string; dot: string }> = {
  success: { bg: "bg-success-soft",   text: "text-success-soft-foreground",  dot: "bg-success" },
  warning: { bg: "bg-warning-soft",   text: "text-warning-soft-foreground",  dot: "bg-warning" },
  danger:  { bg: "bg-danger-soft",    text: "text-danger-soft-foreground",   dot: "bg-danger" },
  info:    { bg: "bg-info-soft",      text: "text-info-soft-foreground",     dot: "bg-info" },
  neutral: { bg: "bg-muted",          text: "text-muted-foreground",         dot: "bg-muted-foreground" },
};

interface Props {
  availability?: Availability | string | null;
  hideWhenInStock?: boolean;
  className?: string;
}

export default function AvailabilityBadge({ availability, hideWhenInStock = true, className = "" }: Props) {
  if (!availability) return null;
  if (hideWhenInStock && availability === "in_stock") return null;
  const cfg = MAP[availability as Availability];
  if (!cfg) return null;
  const cls = TONE_CLASS[cfg.tone] ?? TONE_CLASS.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${cls.bg} ${cls.text} ${className}`}
      role="status"
      aria-label={cfg.label}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cls.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
