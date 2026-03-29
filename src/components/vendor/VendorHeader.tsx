import { Shield, Star, MapPin, MessageSquare, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VendorInfo {
  name: string;
  logo: string;
  banner: string;
  description: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  badges: string[];
}

interface VendorHeaderProps {
  vendor: VendorInfo;
}

export default function VendorHeader({ vendor }: VendorHeaderProps) {
  return (
    <>
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-muted overflow-hidden">
        <img src={vendor.banner} alt={vendor.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Vendor header card */}
      <div className="container px-4 -mt-16 relative z-10">
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={vendor.logo}
              alt={vendor.name}
              className="w-20 h-20 rounded-xl border-4 border-card shadow-md object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-card-foreground">{vendor.name}</h1>
                <Badge className="bg-primary text-primary-foreground">
                  <Shield className="w-3 h-3 mr-1" /> Verificat
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-3">{vendor.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <strong>{vendor.rating.toFixed(1)}</strong>
                  <span className="text-muted-foreground">({vendor.reviewCount} recenzii)</span>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" /> {vendor.productCount} produse
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> România
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" /> Răspuns: 98%
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {vendor.badges.map((badge) => (
                  <Badge key={badge} variant="outline" className="text-xs">{badge}</Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button className="bg-primary text-primary-foreground">
                <MessageSquare className="w-4 h-4 mr-2" /> Contactează
              </Button>
              <Button variant="outline">Urmărește</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
