type Availability =
  | "in_stock" | "low_stock" | "out_of_stock" | "preorder"
  | "available_2_3" | "available_5_7" | "available_7_10" | "available_10_20"
  | "discontinued" | "notify_me";

const MAP: Record<Availability, { label: string; dot: string; bg: string; text: string }> = {
  in_stock:        { label: "În stoc",            dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700" },
  low_stock:       { label: "Stoc limitat",       dot: "bg-amber-500",   bg: "bg-amber-50",    text: "text-amber-800" },
  out_of_stock:    { label: "Indisponibil",       dot: "bg-red-500",     bg: "bg-red-50",      text: "text-red-700" },
  preorder:        { label: "Precomandă",         dot: "bg-blue-500",    bg: "bg-blue-50",     text: "text-blue-700" },
  available_2_3:   { label: "Livrare 2-3 zile",   dot: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700" },
  available_5_7:   { label: "Livrare 5-7 zile",   dot: "bg-lime-500",    bg: "bg-lime-50",     text: "text-lime-800" },
  available_7_10:  { label: "Livrare 7-10 zile",  dot: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-800" },
  available_10_20: { label: "Livrare 10-20 zile", dot: "bg-orange-500",  bg: "bg-orange-50",   text: "text-orange-800" },
  discontinued:    { label: "Retras",             dot: "bg-zinc-500",    bg: "bg-zinc-100",    text: "text-zinc-700" },
  notify_me:       { label: "Anunță-mă",          dot: "bg-violet-500",  bg: "bg-violet-50",   text: "text-violet-700" },
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
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
