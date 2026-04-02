import { useEditableContent } from "@/hooks/useEditableContent";

export default function ProcessSection() {
  const { process_section } = useEditableContent();

  return (
    <section className="bg-secondary text-secondary-foreground py-12 md:py-28">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-16">
          <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-accent mb-2 md:mb-3 font-medium">{process_section.subtitle}</p>
          <h2 className="font-serif text-2xl md:text-4xl font-medium">{process_section.title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 max-w-4xl mx-auto">
          {process_section.steps.map((s, i) => (
            <div key={i} className="text-center">
              <span className="font-serif text-4xl md:text-5xl font-light text-accent/30 block mb-3 md:mb-4">{s.number}</span>
              <h3 className="font-serif text-lg md:text-xl font-medium mb-2 md:mb-3">{s.title}</h3>
              <p className="text-xs md:text-sm text-secondary-foreground/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
