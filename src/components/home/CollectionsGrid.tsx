import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const collections = [
  { name: "Parfumate", slug: "lumanari-parfumate", image: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=400&h=300&fit=crop", count: "120+" },
  { name: "Decorative", slug: "lumanari-decorative", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&h=300&fit=crop", count: "85+" },
  { name: "Cadouri", slug: "cadouri-seturi", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=300&fit=crop", count: "60+" },
  { name: "Aromaterapie", slug: "aromaterapie", image: "https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=400&h=300&fit=crop", count: "45+" },
  { name: "Eveniment", slug: "lumanari-eveniment", image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop", count: "70+" },
  { name: "Personalizare", slug: "personalizare", image: "https://images.unsplash.com/photo-1608181831718-3b43e628bba2?w=400&h=300&fit=crop", count: "30+" },
  { name: "Accesorii", slug: "accesorii", image: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=400&h=300&fit=crop", count: "40+" },
  { name: "Sezoniere", slug: "colectii-sezoniere", image: "https://images.unsplash.com/photo-1605651531144-51381895e23a?w=400&h=300&fit=crop", count: "25+" },
];

export default function CollectionsGrid() {
  const ref = useScrollReveal();

  return (
    <section className="container py-8 md:py-12 px-4" ref={ref}>
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 reveal stagger-1">
        Explorează Colecțiile
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 reveal stagger-2">
        {collections.map((col) => (
          <Link
            key={col.slug}
            to={`/catalog?category=${col.slug}`}
            className="group flex flex-col items-center bg-card rounded-xl p-3 border border-border hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden mb-2 bg-secondary">
              <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
            </div>
            <span className="text-xs md:text-sm font-medium text-card-foreground text-center leading-tight">{col.name}</span>
            <span className="text-[10px] text-muted-foreground">{col.count} produse</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
