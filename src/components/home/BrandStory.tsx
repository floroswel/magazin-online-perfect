import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function BrandStory() {
  const ref = useScrollReveal();

  return (
    <section className="py-0" ref={ref}>
      {/* Full-width banner with text overlay */}
      <div className="relative h-[500px] md:h-[600px] overflow-hidden reveal stagger-1">
        <img
          src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1920&h=800&fit=crop"
          alt="Mama Lucica atelier"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div className="max-w-xl px-6">
            <h2 className="font-serif text-white text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Produse Artizanale<br />Create pentru Tine
            </h2>
            <Link
              to="/povestea-noastra"
              className="inline-block font-sans text-[12px] font-medium tracking-[2px] uppercase text-white border border-white px-8 py-3 hover:bg-white hover:text-foreground transition-all"
            >
              Descoperă
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
