import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Store, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const topVendors = [
  { name: "TechStore RO", category: "Electronice", rating: 4.8, products: 340, image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop" },
  { name: "Fashion Hub", category: "Modă", rating: 4.9, products: 520, image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop" },
  { name: "Home Decor Pro", category: "Casa & Grădină", rating: 4.7, products: 180, image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop" },
  { name: "Sport Zone", category: "Sport", rating: 4.6, products: 290, image: "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=200&h=200&fit=crop" },
  { name: "Kids World", category: "Copii", rating: 4.8, products: 410, image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop" },
  { name: "Auto Parts RO", category: "Auto", rating: 4.5, products: 150, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=200&fit=crop" },
];

export default function InstagramFeed() {
  const ref = useScrollReveal();

  return (
    <section className="container py-8 md:py-12 px-4" ref={ref}>
      <div className="flex items-center justify-between mb-5 reveal stagger-1">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Vendori Populari</h2>
        </div>
        <Link to="/catalog" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
          Toți vendorii <ChevronRight className="w-4 h-4" />
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
