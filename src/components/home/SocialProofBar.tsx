import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function SocialProofBar() {
  const ref = useScrollReveal();

  return (
    <section className="overflow-hidden py-6 border-y border-border" ref={ref}>
      <div className="animate-marquee flex items-center whitespace-nowrap gap-8">
        {Array.from({ length: 4 }).map((_, repeat) => (
          <span key={repeat} className="flex items-center gap-8">
            <span className="font-sans text-[13px] font-medium tracking-[3px] uppercase text-foreground">
              LUMÂNĂRI ARTIZANALE PREMIUM
            </span>
            <span className="text-primary text-lg">•</span>
            <span className="font-sans text-[13px] font-medium tracking-[3px] uppercase text-foreground">
              TRANSPORT GRATUIT PESTE 200 LEI
            </span>
            <span className="text-primary text-lg">•</span>
            <span className="font-sans text-[13px] font-medium tracking-[3px] uppercase text-foreground">
              PRODUSE 100% NATURALE
            </span>
            <span className="text-primary text-lg">•</span>
            <span className="font-sans text-[13px] font-medium tracking-[3px] uppercase text-foreground">
              RETURURI GRATUITE 30 ZILE
            </span>
            <span className="text-primary text-lg">•</span>
          </span>
        ))}
      </div>
    </section>
  );
}
