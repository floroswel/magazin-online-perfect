import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Store, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const topVendors = [
  { name: "Mama Lucica", category: "Lumânări de Soia", rating: 4.9, products: 86, image: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=200&h=200&fit=crop" },
  { name: "Wax & Soul", category: "Lumânări Parfumate", rating: 4.8, products: 52, image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&h=200&fit=crop" },
  { name: "Candela.ro", category: "Decorative & Cadouri", rating: 4.7, products: 120, image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=200&fit=crop" },
  { name: "Flacăra Vie", category: "Ceară Naturală", rating: 4.8, products: 38, image: "https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=200&h=200&fit=crop" },
  { name: "Lumina Pură", category: "Aromaterapie", rating: 4.6, products: 64, image: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=200&h=200&fit=crop" },
  { name: "Aroma Home", category: "Accesorii & DIY", rating: 4.5, products: 45, image: "https://images.unsplash.com/photo-1608181831718-3b43e628bba2?w=200&h=200&fit=crop" },
];

export default function InstagramFeed() {
  const ref = useScrollReveal();

  return (
    <section className="container py-8 md:py-12 px-4" ref={ref}>
      <div className="flex items-center justify-between mb-5 reveal stagger-1">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Artizani Populari</h2>
        </div>
        <Link to="/catalog" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
          Toți artizanii <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 reveal stagger-2">
        {topVendors.map((v) => (
          <Link
            key={v.name}
            to="/catalog"
            className="bg-card rounded-xl border border-border p-4 text-center hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-border group-hover:border-primary transition-colors">
              <img src={v.image} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <p className="text-sm font-semibold text-card-foreground truncate">{v.name}</p>
            <p className="text-[11px] text-muted-foreground mb-1">{v.category}</p>
            <div className="flex items-center justify-center gap-1 text-[11px]">
              <span className="text-accent font-bold">★ {v.rating}</span>
              <span className="text-muted-foreground">· {v.products} produse</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
