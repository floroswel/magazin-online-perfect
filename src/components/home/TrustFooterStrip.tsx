import { Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";

const items = [
  { icon: Truck, title: "Livrare 24-48h", desc: "La nivel national" },
  { icon: RotateCcw, title: "Retur 30 zile", desc: "Fara intrebari" },
  { icon: ShieldCheck, title: "Plata Securizata", desc: "Criptare SSL" },
  { icon: Headphones, title: "Support 9-17", desc: "Luni - Vineri" },
];

export default function TrustFooterStrip() {
  return (
    <section className="bg-card py-6 md:py-8" style={{ borderTop: "1px solid #E5E0D8", borderBottom: "1px solid #E5E0D8" }}>
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-center">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">{item.title}</span>
              <span className="text-[11px] text-muted-foreground">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
