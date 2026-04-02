import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const collections = [
  { name: "Parfumate", slug: "lumanari-parfumate", image: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=400&h=400&fit=crop", count: "120+" },
  { name: "Decorative", slug: "lumanari-decorative", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&h=400&fit=crop", count: "85+" },
  { name: "Cadouri", slug: "cadouri-seturi", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=400&fit=crop", count: "60+" },
  { name: "Aromaterapie", slug: "aromaterapie", image: "https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=400&h=400&fit=crop", count: "45+" },
  { name: "Eveniment", slug: "lumanari-eveniment", image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop", count: "70+" },
  { name: "Personalizare", slug: "personalizare", image: "https://images.unsplash.com/photo-1608181831718-3b43e628bba2?w=400&h=400&fit=crop", count: "30+" },
  { name: "Accesorii", slug: "accesorii", image: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=400&h=400&fit=crop", count: "40+" },
  { name: "Sezoniere", slug: "colectii-sezoniere", image: "https://images.unsplash.com/photo-1605651531144-51381895e23a?w=400&h=400&fit=crop", count: "25+" },
];

export default function CollectionsGrid() {
  const ref = useScrollReveal();

  return (
    <section className="container py-8 md:py-12 px-4" ref={ref}>
      <h2 className="text-xl md:text-2xl text-foreground mb-1 reveal stagger-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        Explorează Colecțiile
      </h2>
      <div className="w-[60px] h-[3px] bg-primary mb-6 reveal stagger-1" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 reveal stagger-2">
        {collections.map((col) => (
          <Link
            key={col.slug}
            to={`/catalog?category=${col.slug}`}
            className="group flex flex-col bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:-translate-y-1"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          >
            <div className="aspect-square overflow-hidden bg-muted">
              <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
            </div>
            <div className="p-3 text-center">
              <span className="text-sm font-semibold text-card-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>{col.name}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">{col.count} produse</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
