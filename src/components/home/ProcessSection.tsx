const steps = [
  { icon: "🌿", title: "Ingrediente naturale selectate", desc: "Ceară de soia 100%, parfumuri premium, fitiluri bumbac" },
  { icon: "✋", title: "Preparare manuală cu grijă", desc: "Fiecare lumânare turnată și parfumată manual de echipa VENTUZA" },
  { icon: "🎁", title: "Ambalare cu dragoste", desc: "Împachetată cu atenție, gata să ajungă la tine sau cel drag" },
];

export default function ProcessSection() {
  return (
    <section className="container py-12">
      <h2 className="text-2xl font-bold text-foreground text-center mb-8">De la mâinile noastre la casa ta</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={i} className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-3xl mb-4">
              {s.icon}
            </div>
            <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
