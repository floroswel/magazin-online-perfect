import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQuery } from "@tanstack/react-query";

interface LoyaltyLevel {
  id: string;
  name: string;
  min_points: number;
  discount_percentage: number;
  color: string;
  icon: string;
  benefits: string[];
}

export interface LoyaltyConfig {
  program_enabled: boolean;
  program_name: string;
  earn_rate_points: number;
  earn_rate_per_amount: number;
  redeem_rate_points: number;
  redeem_rate_value: number;
  min_points_redeem: number;
  max_redeem_percent: number;
  expiry_months: number;
  bonus_registration: number;
  bonus_first_order: number;
  bonus_birthday: number;
  bonus_review: number;
  bonus_referral: number;
  weekend_multiplier: number;
  weekend_enabled: boolean;
  triple_product_ids: string[];
  bonus_category_id: string;
  bonus_category_points: number;
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  program_enabled: true,
  program_name: "Puncte Fidelitate",
  earn_rate_points: 1,
  earn_rate_per_amount: 10,
  redeem_rate_points: 100,
  redeem_rate_value: 5,
  min_points_redeem: 50,
  max_redeem_percent: 30,
  expiry_months: 0,
  bonus_registration: 0,
  bonus_first_order: 0,
  bonus_birthday: 0,
  bonus_review: 10,
  bonus_referral: 50,
  weekend_multiplier: 2,
  weekend_enabled: false,
  triple_product_ids: [],
  bonus_category_id: "",
  bonus_category_points: 0,
};

export function useLoyalty() {
  const { user } = useAuth();
  const userId = user?.id;

  // Load config from app_settings — shared across all components via queryKey
  const { data: config = DEFAULT_CONFIG } = useQuery({
    queryKey: ["loyalty-config"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", "loyalty_config").maybeSingle();
      if (data?.value_json && typeof data.value_json === "object" && !Array.isArray(data.value_json)) {
        return { ...DEFAULT_CONFIG, ...(data.value_json as Record<string, unknown>) } as LoyaltyConfig;
      }
      return DEFAULT_CONFIG;
    },
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000,
  });

  // Loyalty levels — same for all users, rarely changes
  const { data: levels = [] } = useQuery<LoyaltyLevel[]>({
    queryKey: ["loyalty-levels"],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_levels").select("*").order("min_points", { ascending: true });
      return (data || []) as LoyaltyLevel[];
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  // User points — per-user, only fetch when logged in
  const { data: totalPoints = 0, refetch: refetchPoints } = useQuery({
    queryKey: ["loyalty-points", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data } = await supabase.from("loyalty_points").select("points").eq("user_id", userId);
      return (data || []).reduce((sum, p) => sum + p.points, 0);
    },
    enabled: !!userId,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000,
  });

  // Derive current and next level from points + levels
  const currentLevel = levels.length > 0
    ? [...levels].reverse().find(l => totalPoints >= l.min_points) || levels[0] || null
    : null;

  const nextLevel = (() => {
    if (!currentLevel || levels.length === 0) return null;
    const nextIdx = levels.findIndex(l => l.id === currentLevel.id) + 1;
    return nextIdx < levels.length ? levels[nextIdx] : null;
  })();

  const loading = false; // React Query handles loading internally

  const addPoints = useCallback(async (points: number, action: string, description: string, orderId?: string) => {
    if (!userId) return;
    await supabase.from("loyalty_points").insert({
      user_id: userId, points, action, description, order_id: orderId || null,
    });
    refetchPoints();
  }, [userId, refetchPoints]);

  const calcPointsForPrice = useCallback((price: number): number => {
    if (!config.program_enabled || config.earn_rate_per_amount <= 0) return 0;
    let pts = Math.floor(price / config.earn_rate_per_amount) * config.earn_rate_points;
    if (config.weekend_enabled) {
      const day = new Date().getDay();
      if (day === 0 || day === 6) pts *= config.weekend_multiplier;
    }
    return pts;
  }, [config]);

  const pointsToValue = useCallback((pts: number): number => {
    if (config.redeem_rate_points <= 0) return 0;
    return (pts / config.redeem_rate_points) * config.redeem_rate_value;
  }, [config]);

  const maxRedeemablePoints = useCallback((orderTotal: number): number => {
    if (!config.program_enabled || totalPoints < config.min_points_redeem) return 0;
    const maxValueFromPercent = orderTotal * (config.max_redeem_percent / 100);
    const maxPointsFromPercent = Math.floor((maxValueFromPercent / config.redeem_rate_value) * config.redeem_rate_points);
    return Math.min(totalPoints, maxPointsFromPercent);
  }, [config, totalPoints]);

  return {
    totalPoints, currentLevel, nextLevel, levels, loading, addPoints,
    config, calcPointsForPrice, pointsToValue, maxRedeemablePoints,
  };
}

export type { LoyaltyLevel };
