import { GitCompareArrows } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";

interface Props {
  productId: string;
  className?: string;
  showLabel?: boolean;
}

export default function CompareButton({ productId, className, showLabel = true }: Props) {
  const { has, toggle } = useCompare();
  const active = has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={active}
      title={active ? "Elimină din comparație" : "Adaugă la comparație"}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:bg-accent",
        className
      )}
    >
      <GitCompareArrows className="w-3.5 h-3.5" />
      {showLabel && <span>{active ? "În comparație" : "Compară"}</span>}
    </button>
  );
}
