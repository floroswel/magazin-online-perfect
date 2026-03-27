const items = [
  "Ceară 100% Naturală",
  "Handmade în România",
  "Plăți Securizate",
  "Livrare Gratuită > 200 RON",
  "Retur 14 Zile",
  "Suport Dedicat",
];

export default function TrustFooterStrip() {
  return (
    <section className="border-t border-border py-6">
      <div className="container">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
          {items.map((item, i) => (
            <span key={i} className="text-xs tracking-wide text-muted-foreground uppercase">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
