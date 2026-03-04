import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

interface PricingRule {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  applies_to_products: string;
  product_ids: string[];
  category_ids: string[];
  brand_ids: string[];
  applies_to_customers: string;
  customer_group_ids: string[];
  discount_type: string;
  discount_value: number;
  badge_text: string;
  min_quantity: number | null;
  min_order_value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  allow_stacking: boolean;
}

interface AppliedDiscount {
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  savingsPercent: number;
  badgeText: string;
  endsAt: string | null;
  rules: PricingRule[];
}

export function usePricingRules() {
  const { user } = useAuth();

  const { data: rules = [] } = useQuery({
    queryKey: ["pricing-rules-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pricing_rules")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });
      return (data || []) as PricingRule[];
    },
    staleTime: 60_000,
  });

  const activeRules = rules.filter((r) => {
    const now = new Date();
    if (r.starts_at && new Date(r.starts_at) > now) return false;
    if (r.ends_at && new Date(r.ends_at) < now) return false;
    return true;
  });

  function getApplicableRules(product: Tables<"products">): PricingRule[] {
    return activeRules.filter((r) => {
      // Product scope
      if (r.applies_to_products === "categories" && r.category_ids?.length > 0) {
        if (!product.category_id || !r.category_ids.includes(product.category_id)) return false;
      }
      if (r.applies_to_products === "brands" && r.brand_ids?.length > 0) {
        if (!product.brand_id || !r.brand_ids.includes(product.brand_id)) return false;
      }
      if (r.applies_to_products === "products" && r.product_ids?.length > 0) {
        if (!r.product_ids.includes(product.id)) return false;
      }

      // Customer scope
      if (r.applies_to_customers === "guests" && user) return false;

      return true;
    });
  }

  function applyDiscount(price: number, rule: PricingRule): number {
    switch (rule.discount_type) {
      case "percentage":
        return Math.max(0, price * (1 - rule.discount_value / 100));
      case "fixed":
        return Math.max(0, price - rule.discount_value);
      case "fixed_price":
        return rule.discount_value;
      default:
        return price;
    }
  }

  function getProductDiscount(product: Tables<"products">): AppliedDiscount | null {
    const applicable = getApplicableRules(product);
    if (applicable.length === 0) return null;

    const originalPrice = product.price;
    let currentPrice = originalPrice;
    let appliedRules: PricingRule[] = [];
    let badgeText = "PROMO";
    let endsAt: string | null = null;

    // Check if any rule allows stacking
    const firstRule = applicable[0];
    if (firstRule.allow_stacking) {
      // Apply all rules sequentially
      for (const rule of applicable) {
        currentPrice = applyDiscount(currentPrice, rule);
        appliedRules.push(rule);
        if (rule.badge_text) badgeText = rule.badge_text;
        if (rule.ends_at) endsAt = rule.ends_at;
      }
    } else {
      // Only apply highest priority (first) rule
      currentPrice = applyDiscount(currentPrice, firstRule);
      appliedRules = [firstRule];
      badgeText = firstRule.badge_text || "PROMO";
      endsAt = firstRule.ends_at;
    }

    currentPrice = Math.round(currentPrice * 100) / 100;

    if (currentPrice >= originalPrice) return null;

    const savings = originalPrice - currentPrice;
    const savingsPercent = Math.round((savings / originalPrice) * 100);

    return {
      originalPrice,
      discountedPrice: currentPrice,
      savings,
      savingsPercent,
      badgeText,
      endsAt,
      rules: appliedRules,
    };
  }

  function hasActivePromo(product: Tables<"products">): boolean {
    return getApplicableRules(product).length > 0;
  }

  return { getProductDiscount, hasActivePromo, activeRules };
}
