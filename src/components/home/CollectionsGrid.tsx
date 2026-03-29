import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const collections = [
  { name: "Electronice", slug: "electronice", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop", count: "2.500+" },
  { name: "Modă", slug: "moda", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop", count: "5.000+" },
  { name: "Casa & Grădină", slug: "casa-gradina", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop", count: "3.200+" },
  { name: "Sport", slug: "sport", image: "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400&h=300&fit=crop", count: "1.800+" },
  { name: "Auto", slug: "auto", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop", count: "900+" },
  { name: "Copii", slug: "copii", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop", count: "2.100+" },
  { name: "Sănătate", slug: "sanatate", image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop", count: "1.400+" },
  { name: "Cărți", slug: "carti", image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop", count: "4.000+" },
];

export default function CollectionsGrid() {
  const ref = useScrollReveal();

  return (
    <section className="container py-8 md:py-12 px-4" ref={ref}>
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 reveal stagger-1">
        Cumpără pe Categorii
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 reveal stagger-2">
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
