import { Truck, RotateCcw, ShieldCheck, Headphones, LucideIcon } from "lucide-react";
import { useEditableContent } from "@/hooks/useEditableContent";

const iconMap: Record<string, LucideIcon> = { Truck, RotateCcw, ShieldCheck, Headphones };

export default function TrustFooterStrip() {
  const { trust_strip } = useEditableContent();

  return (
    <section className="bg-card py-6 md:py-8" style={{ borderTop: "1px solid #E5E0D8", borderBottom: "1px solid #E5E0D8" }}>
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-center">
          {trust_strip.map((item, i) => {
            const Icon = iconMap[item.icon] || ShieldCheck;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">{item.title}</span>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
