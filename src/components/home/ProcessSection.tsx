const steps = [
  { number: "01", title: "Ingrediente Selectate", desc: "Ceară de soia 100%, uleiuri esențiale premium și fitiluri din bumbac natural" },
  { number: "02", title: "Preparare Manuală", desc: "Fiecare lumânare este turnată și parfumată manual de echipa noastră" },
  { number: "03", title: "Ambalare cu Grijă", desc: "Împachetată cu atenție în materiale sustenabile, gata să ajungă la tine" },
];

export default function ProcessSection() {
  return (
    <section className="bg-secondary text-secondary-foreground py-12 md:py-28">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-16">
          <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-ventuza-gold mb-2 md:mb-3 font-medium">Procesul Nostru</p>
          <h2 className="font-serif text-2xl md:text-4xl font-medium">De la Mâinile Noastre la Casa Ta</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <span className="font-serif text-4xl md:text-5xl font-light text-ventuza-gold/30 block mb-3 md:mb-4">{s.number}</span>
              <h3 className="font-serif text-lg md:text-xl font-medium mb-2 md:mb-3">{s.title}</h3>
              <p className="text-xs md:text-sm text-secondary-foreground/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
