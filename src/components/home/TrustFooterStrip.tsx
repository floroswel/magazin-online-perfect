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
    <section className="border-t border-border py-4 md:py-6">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-x-6 md:gap-x-8 gap-y-2 text-center">
          {items.map((item, i) => (
            <span key={i} className="text-[10px] md:text-xs tracking-wide text-muted-foreground uppercase">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
