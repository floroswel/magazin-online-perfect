import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

interface Promotion {
  id: string;
  name: string;
  label: string | null;
  label_color: string | null;
  type: string;
  discount_type: string;
  discount_value: number;
  max_discount: number | null;
  badge_text: string | null;
  status: string;
  active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  active_days: number[];
  active_hour_start: number | null;
  active_hour_end: number | null;
  show_countdown: boolean;
  is_combinable: boolean;
  no_combine: boolean;
  applies_to_products: string;
  product_ids: string[];
  category_ids: string[];
  brand_ids: string[];
  excluded_product_ids: string[];
  excluded_category_ids: string[];
  applies_to_customers: string;
  customer_group_ids: string[];
  new_customers_only: boolean;
  registered_only: boolean;
  required_payment_method: string | null;
  conditions: any;
  volume_tiers: any[];
  spend_tiers: any[];
  gift_product_id: string | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  used_count: number;
}

export interface AppliedPromotion {
  promo: Promotion;
  discountedPrice: number;
  savings: number;
  savingsPercent: number;
  badgeText: string;
  badgeColor: string;
  endsAt: string | null;
  showCountdown: boolean;
}

export interface CartPromotion {
  promo: Promotion;
  type: string;
  savings: number;
  label: string;
}

export function usePromotions() {
  const { user } = useAuth();

  const { data: promotions = [] } = useQuery({
    queryKey: ["active-promotions"],
    queryFn: async () => {
      const { data } = await supabase.from("promotions")
        .select("*")
        .eq("status", "active")
        .eq("active", true)
        .order("priority", { ascending: false });
      return (data || []) as Promotion[];
    },
    staleTime: 30_000,
  });

  // Filter active promotions by time constraints
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  const activePromos = promotions.filter(p => {
    if (p.starts_at && new Date(p.starts_at) > now) return false;
    if (p.ends_at && new Date(p.ends_at) < now) return false;
    if (p.active_days && p.active_days.length > 0 && p.active_days.length < 7 && !p.active_days.includes(currentDay)) return false;
    if (p.active_hour_start != null && p.active_hour_end != null) {
      if (currentHour < p.active_hour_start || currentHour >= p.active_hour_end) return false;
    }
    // Check uses limit
    if (p.max_uses && p.used_count >= p.max_uses) return false;
    return true;
  });

  function isProductEligible(promo: Promotion, product: Tables<"products">): boolean {
    // Check exclusions first
    if (promo.excluded_product_ids?.length > 0 && promo.excluded_product_ids.includes(product.id)) return false;
    if (promo.excluded_category_ids?.length > 0 && product.category_id && promo.excluded_category_ids.includes(product.category_id)) return false;

    // Check targeting
    switch (promo.applies_to_products) {
      case "categories":
        return promo.category_ids?.length > 0 && !!product.category_id && promo.category_ids.includes(product.category_id);
      case "brands":
        // brands table uses separate IDs, but product has brand as string
        return promo.brand_ids?.length > 0;
      case "products":
        return promo.product_ids?.length > 0 && promo.product_ids.includes(product.id);
      default:
        return true; // "all"
    }
  }

  function getProductPromotion(product: Tables<"products">): AppliedPromotion | null {
    const applicable = activePromos.filter(p =>
      isProductEligible(p, product) &&
      ["percentage", "fixed", "fixed_price", "volume_discount", "spend_threshold"].includes(p.type)
    );

    if (applicable.length === 0) return null;

    // Get highest priority promo
    const promo = applicable[0];
    let discountedPrice = product.price;

    switch (promo.type) {
      case "percentage":
        discountedPrice = product.price * (1 - promo.discount_value / 100);
        if (promo.max_discount) discountedPrice = Math.max(discountedPrice, product.price - promo.max_discount);
        break;
      case "fixed":
        discountedPrice = Math.max(0, product.price - promo.discount_value);
        break;
      case "fixed_price":
        discountedPrice = promo.discount_value;
        break;
      case "volume_discount":
        // Show lowest tier discount as badge
        if (promo.volume_tiers?.length > 0) {
          const lowestTier = promo.volume_tiers[0];
          discountedPrice = product.price * (1 - lowestTier.discount / 100);
        }
        break;
    }

    discountedPrice = Math.round(discountedPrice * 100) / 100;
    if (discountedPrice >= product.price) return null;

    const savings = product.price - discountedPrice;
    return {
      promo,
      discountedPrice,
      savings,
      savingsPercent: Math.round((savings / product.price) * 100),
      badgeText: promo.label || promo.badge_text || `-${Math.round((savings / product.price) * 100)}%`,
      badgeColor: promo.label_color || "#ef4444",
      endsAt: promo.ends_at,
      showCountdown: promo.show_countdown,
    };
  }

  function getCartPromotions(items: { product: Tables<"products">; quantity: number }[], cartTotal: number): CartPromotion[] {
    const results: CartPromotion[] = [];
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);

    for (const promo of activePromos) {
      // Check cart-level conditions
      if (promo.conditions?.min_cart_value && cartTotal < promo.conditions.min_cart_value) continue;
      if (promo.conditions?.min_quantity && totalQty < promo.conditions.min_quantity) continue;

      switch (promo.type) {
        case "free_shipping":
          results.push({ promo, type: "free_shipping", savings: 0, label: promo.label || "Transport gratuit" });
          break;

        case "buy_x_get_y": {
          const buyX = promo.conditions?.buy_x || 2;
          const getY = promo.conditions?.get_y || 1;
          const eligibleItems = items.filter(i => isProductEligible(promo, i.product));
          const totalEligible = eligibleItems.reduce((s, i) => s + i.quantity, 0);
          if (totalEligible >= buyX + getY) {
            // Find cheapest eligible item price
            const cheapest = Math.min(...eligibleItems.map(i => i.product.price));
            const freeItems = Math.floor(totalEligible / (buyX + getY)) * getY;
            const savings = cheapest * freeItems;
            results.push({ promo, type: "buy_x_get_y", savings, label: promo.label || `Cumpără ${buyX} ia ${getY} gratuit` });
          }
          break;
        }

        case "volume_discount": {
          const eligibleItems = items.filter(i => isProductEligible(promo, i.product));
          for (const item of eligibleItems) {
            const tiers = (promo.volume_tiers || []).sort((a: any, b: any) => b.min_qty - a.min_qty);
            for (const tier of tiers) {
              if (item.quantity >= tier.min_qty && (!tier.max_qty || item.quantity <= tier.max_qty)) {
                const savings = item.product.price * item.quantity * (tier.discount / 100);
                results.push({ promo, type: "volume_discount", savings, label: `${tier.discount}% discount volum (${item.quantity} buc)` });
                break;
              }
            }
          }
          break;
        }

        case "spend_threshold": {
          const tiers = (promo.spend_tiers || []).sort((a: any, b: any) => b.min_spend - a.min_spend);
          for (const tier of tiers) {
            if (cartTotal >= tier.min_spend) {
              const savings = cartTotal * (tier.discount / 100);
              results.push({ promo, type: "spend_threshold", savings, label: promo.label || `${tier.discount}% — cheltuiești ${tier.min_spend} lei` });
              break;
            }
          }
          break;
        }

        case "gift_product":
          if (promo.gift_product_id) {
            results.push({ promo, type: "gift_product", savings: 0, label: promo.label || "Produs cadou inclus!" });
          }
          break;
      }
    }

    return results;
  }

  function hasFreeShipping(cartTotal: number, totalQty: number): boolean {
    return activePromos.some(p => {
      if (p.type !== "free_shipping") return false;
      if (p.conditions?.min_cart_value && cartTotal < p.conditions.min_cart_value) return false;
      if (p.conditions?.min_quantity && totalQty < p.conditions.min_quantity) return false;
      return true;
    });
  }

  return { getProductPromotion, getCartPromotions, hasFreeShipping, activePromos };
}
