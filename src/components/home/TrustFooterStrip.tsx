import { Leaf, MapPin, ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";

const items = [
  { icon: Leaf, label: "Ceară 100% Naturală" },
  { icon: MapPin, label: "Handmade în România" },
  { icon: ShieldCheck, label: "Plăți Securizate" },
  { icon: Truck, label: "Livrare Gratuită > 200 RON" },
  { icon: RotateCcw, label: "Retur 14 Zile" },
  { icon: Headphones, label: "Suport Dedicat" },
];

export default function TrustFooterStrip() {
  return (
    <section className="border-t border-border bg-card py-5 md:py-8">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-6 text-center">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] md:text-xs tracking-wide text-muted-foreground uppercase font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
