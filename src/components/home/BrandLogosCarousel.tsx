import { useScrollReveal } from "@/hooks/useScrollReveal";

const brands = [
  { name: "Wellness", subtitle: "COPENHAGEN" },
  { name: "Flora Sense", subtitle: "" },
  { name: "the Muse", subtitle: "CONTEMPORARY" },
  { name: "Bloom", subtitle: "NATURAL" },
  { name: "Artisan", subtitle: "STUDIO" },
];

export default function BrandLogosCarousel() {
  const ref = useScrollReveal();

  return (
    <section className="py-14 md:py-20 bg-secondary" ref={ref}>
      <div className="container px-4">
        <div className="flex items-center justify-around gap-8 flex-wrap reveal stagger-1">
          {brands.map((brand) => (
            <div key={brand.name} className="text-center px-4">
              <p className="font-serif text-2xl md:text-3xl text-foreground/40 tracking-tight">
                {brand.name}
              </p>
              {brand.subtitle && (
                <p className="font-sans text-[9px] tracking-[3px] uppercase text-foreground/30 mt-0.5">
                  {brand.subtitle}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
