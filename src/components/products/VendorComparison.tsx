import { Link } from "react-router-dom";
import { Star, Shield, Truck, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";

interface VendorOffer {
  vendorSlug: string;
  vendorName: string;
  vendorRating: number;
  price: number;
  oldPrice?: number;
  shippingCost: number;
  deliveryDays: string;
  isBestPrice?: boolean;
  badge?: string;
}

interface Props {
  productName: string;
}

// Mock data — in production this would come from a vendor_offers table
const mockOffers: VendorOffer[] = [
  {
    vendorSlug: "mama-lucica",
    vendorName: "Mama Lucica",
    vendorRating: 4.8,
    price: 149.99,
    oldPrice: 189.99,
    shippingCost: 0,
    deliveryDays: "1-2 zile",
    isBestPrice: true,
    badge: "Top Seller",
  },
  {
    vendorSlug: "tech-zone",
    vendorName: "TechZone",
    vendorRating: 4.7,
    price: 159.99,
    shippingCost: 14.99,
    deliveryDays: "2-3 zile",
  },
  {
    vendorSlug: "mega-deal",
    vendorName: "MegaDeal",
    vendorRating: 4.3,
    price: 154.99,
    shippingCost: 9.99,
    deliveryDays: "3-5 zile",
  },
];

export default function VendorComparison({ productName }: Props) {
  const { format } = useCurrency();

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-card-foreground">
          Compară ofertele vendorilor ({mockOffers.length})
        </h3>
      </div>

      <div className="divide-y divide-border">
        {mockOffers.map((offer) => (
          <div
            key={offer.vendorSlug}
            className={`flex items-center gap-4 p-4 ${offer.isBestPrice ? "bg-[hsl(var(--marketplace-success))]/5" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  to={`/vendor/${offer.vendorSlug}`}
                  className="font-medium text-sm text-card-foreground hover:text-primary transition-colors"
                >
                  {offer.vendorName}
                </Link>
                {offer.isBestPrice && (
                  <Badge className="bg-[hsl(var(--marketplace-success))] text-white text-[10px]">Cel mai bun preț</Badge>
                )}
                {offer.badge && (
                  <Badge variant="outline" className="text-[10px]">{offer.badge}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-accent text-accent" /> {offer.vendorRating}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3" /> {offer.deliveryDays}
                </span>
                <span>
                  {offer.shippingCost === 0
                    ? "Transport gratuit"
                    : `+${format(offer.shippingCost)} livrare`}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-card-foreground">{format(offer.price)}</span>
                {offer.oldPrice && (
                  <span className="text-xs text-muted-foreground line-through">{format(offer.oldPrice)}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {format(offer.price + offer.shippingCost)}
              </p>
            </div>

            <Button size="sm" variant={offer.isBestPrice ? "default" : "outline"} className="shrink-0">
              Adaugă
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
