import { Link } from "react-router-dom";
import { Star, Shield, Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const vendors = [
  {
    slug: "mama-lucica",
    name: "Mama Lucica",
    logo: "https://ui-avatars.com/api/?name=ML&background=dc2626&color=fff&size=64",
    rating: 4.8,
    products: 156,
    badge: "Top Seller",
  },
  {
    slug: "tech-zone",
    name: "TechZone",
    logo: "https://ui-avatars.com/api/?name=TZ&background=2563eb&color=fff&size=64",
    rating: 4.7,
    products: 342,
    badge: "Vendor de încredere",
  },
  {
    slug: "fashion-hub",
    name: "FashionHub",
    logo: "https://ui-avatars.com/api/?name=FH&background=7c3aed&color=fff&size=64",
    rating: 4.6,
    products: 89,
    badge: "Livrare rapidă",
  },
  {
    slug: "home-deco",
    name: "HomeDeco",
    logo: "https://ui-avatars.com/api/?name=HD&background=059669&color=fff&size=64",
    rating: 4.9,
    products: 215,
    badge: "Top Seller",
  },
  {
    slug: "sport-max",
    name: "SportMax",
    logo: "https://ui-avatars.com/api/?name=SM&background=d97706&color=fff&size=64",
    rating: 4.5,
    products: 178,
    badge: "Verificat",
  },
];

export default function TopVendors() {
  return (
    <section className="container px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">🏆 Top Vendori</h2>
        <Link to="/catalog" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          Toți vendorii <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {vendors.map((v) => (
          <Link
            key={v.slug}
            to={`/vendor/${v.slug}`}
            className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-lg hover:border-primary/30 transition-all group"
          >
            <img
              src={v.logo}
              alt={v.name}
              className="w-14 h-14 rounded-full mx-auto mb-3 group-hover:scale-110 transition-transform"
            />
            <h3 className="font-semibold text-card-foreground text-sm mb-1">{v.name}</h3>
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" />
              <span className="text-sm font-medium">{v.rating}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
              <Package className="w-3 h-3" /> {v.products} produse
            </div>
            <Badge variant="outline" className="text-[10px]">
              <Shield className="w-2.5 h-2.5 mr-1" /> {v.badge}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}
