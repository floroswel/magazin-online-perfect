import { Link } from "react-router-dom";

const banners = [
  {
    badge: "COLECȚIA 2025",
    title: "Lumânări Premium",
    subtitle: "De la 49 lei",
    cta: "Cumpără Acum →",
    link: "/catalog",
    emoji: "🕯",
    gradient: "linear-gradient(135deg, hsl(217 100% 40%) 0%, hsl(217 100% 50%) 60%, hsl(217 100% 63%) 100%)",
  },
  {
    badge: "TRANSPORT GRATUIT",
    title: "Comenzi > 200 lei",
    subtitle: "Livrăm în toată România",
    cta: "Descoperă Acum →",
    link: "/catalog",
    emoji: "🚚",
    gradient: "linear-gradient(135deg, hsl(12 100% 40%) 0%, hsl(12 100% 50%) 60%, hsl(12 80% 60%) 100%)",
  },
];

export default function PromoBanners() {
  return (
    <section className="bg-secondary py-4">
      <div className="lumax-container grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b, i) => (
          <Link
            key={i}
            to={b.link}
            className="relative flex items-center justify-between rounded-xl overflow-hidden h-[150px] px-6 md:px-8 hover:scale-[1.01] transition-transform"
            style={{ background: b.gradient }}
          >
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-white/90 bg-white/20 rounded-full px-2.5 py-0.5 inline-block mb-2">
                {b.badge}
              </span>
              <h3 className="text-lg md:text-xl font-extrabold text-white">{b.title}</h3>
              <p className="text-sm text-white/85 mb-3">{b.subtitle}</p>
              <span className="inline-block text-xs font-bold bg-white text-foreground px-3 py-1.5 rounded-md">
                {b.cta}
              </span>
            </div>
            <span className="text-5xl md:text-6xl">{b.emoji}</span>
            {/* Decorative circle */}
            <div className="absolute -right-5 -top-5 w-[120px] h-[120px] rounded-full bg-white/10" />
          </Link>
        ))}
      </div>
    </section>
  );
}
