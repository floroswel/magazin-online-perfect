import { Leaf, Hand, Palette, Truck, LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useEditableContent } from "@/hooks/useEditableContent";

const iconMap: Record<string, LucideIcon> = { Leaf, Hand, Palette, Truck };

export default function WhyMamaLucica() {
  const ref = useScrollReveal();
  const { why_section } = useEditableContent();

  return (
    <section className="py-16 md:py-24" ref={ref}>
      <div className="container px-4">
        <div className="text-center mb-12 reveal stagger-1">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">{why_section.title}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {why_section.items.map((r, i) => {
            const Icon = iconMap[r.icon] || Leaf;
            return (
              <div key={i} className={`reveal stagger-${Math.min(i + 1, 4)} group text-center p-6 md:p-8`}>
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-5">
                  <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">{r.title}</h3>
                <p className="font-sans font-light text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
