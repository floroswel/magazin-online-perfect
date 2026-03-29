import { useScrollReveal } from "@/hooks/useScrollReveal";

const items = [
  "LUMÂNĂRI ARTIZANALE PREMIUM",
  "TRANSPORT GRATUIT PESTE 200 LEI",
  "PRODUSE 100% NATURALE",
  "RETURURI GRATUITE 30 ZILE",
  "HANDMADE ÎN ROMÂNIA",
];

export default function SocialProofBar() {
  const ref = useScrollReveal();

  return (
    <section className="overflow-hidden py-5 border-y border-border" ref={ref}>
      <div className="animate-marquee flex items-center whitespace-nowrap gap-8">
        {Array.from({ length: 4 }).map((_, repeat) => (
          <span key={repeat} className="flex items-center gap-8">
            {items.map((item, j) => (
              <span key={j} className="flex items-center gap-8">
                <span className="font-sans text-[12px] font-medium tracking-[3px] uppercase text-foreground">
                  {item}
                </span>
                <span className="text-foreground/30 text-sm">✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}
