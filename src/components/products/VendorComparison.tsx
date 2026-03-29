import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Shield, Truck, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";

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
  productId?: string;
  productPrice?: number;
  brandId?: string | null;
}

export default function VendorComparison({ productName, productId, productPrice, brandId }: Props) {
  const { format } = useCurrency();
  const [offers, setOffers] = useState<VendorOffer[]>([]);

  useEffect(() => {
    // Build offers from brand info + generated alternatives
    const buildOffers = async () => {
      let brandName = "MamaLucica";
      let brandSlug = "mama-lucica";

      if (brandId) {
        const { data } = await supabase
          .from("brands")
          .select("name, slug")
          .eq("id", brandId)
          .maybeSingle();
        if (data) {
          brandName = data.name;
          brandSlug = data.slug;
        }
      }

      const basePrice = productPrice || 149.99;
      const builtOffers: VendorOffer[] = [
        {
          vendorSlug: brandSlug,
          vendorName: brandName,
          vendorRating: 4.8,
          price: basePrice,
          shippingCost: 0,
          deliveryDays: "1-2 zile",
          isBestPrice: true,
          badge: "Artizan Oficial",
        },
        {
          vendorSlug: "marketplace",
          vendorName: "MamaLucica Market",
          vendorRating: 4.6,
          price: Math.round((basePrice * 1.05) * 100) / 100,
          shippingCost: 14.99,
          deliveryDays: "2-3 zile",
        },
        {
          vendorSlug: "express",
          vendorName: "Express Candles",
          vendorRating: 4.4,
          price: Math.round((basePrice * 1.02) * 100) / 100,
          shippingCost: 9.99,
          deliveryDays: "3-5 zile",
        },
      ];

      setOffers(builtOffers);
    };

    buildOffers();
  }, [brandId, productPrice]);

  if (offers.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-card-foreground">
          Compară ofertele ({offers.length} vânzători)
        </h3>
      </div>

      <div className="divide-y divide-border">
        {offers.map((offer) => (
          <div
            key={offer.vendorSlug}
            className={`flex items-center gap-4 p-4 ${offer.isBestPrice ? "bg-primary/5" : ""}`}
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
                  <Badge className="bg-primary text-primary-foreground text-[10px]">Cel mai bun preț</Badge>
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
