import { Leaf, Flame, Truck, ShieldCheck } from "lucide-react";

const items = [
  { icon: Leaf, title: "100% Handmade", desc: "Fiecare lumânare este turnată manual cu grijă" },
  { icon: Flame, title: "Ceară Naturală", desc: "Doar ceară de soia, fără parafină" },
  { icon: Truck, title: "Livrare Rapidă", desc: "Comandă azi, primești în 24-48h" },
  { icon: ShieldCheck, title: "Garanție Calitate", desc: "Returnare gratuită în 30 de zile" },
];

export default function HomepageWhyUs() {
  return (
    <section className="ml-container py-14">
      <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10">De ce Mama Lucica?</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-sm mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
