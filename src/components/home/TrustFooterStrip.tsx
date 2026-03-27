const items = [
  { icon: "🌿", text: "Ceară naturală" },
  { icon: "✋", text: "100% Handmade în România" },
  { icon: "🔒", text: "Plăți securizate" },
  { icon: "🚚", text: "Livrare gratuită >200 RON" },
  { icon: "↩️", text: "Retur 14 zile" },
  { icon: "💬", text: "Suport 24/7" },
];

export default function TrustFooterStrip() {
  return (
    <section className="bg-card border-t py-4">
      <div className="container">
        <div className="flex flex-wrap justify-center gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm text-foreground">
              <span>{item.icon}</span>
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
