import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface GroupBenefits {
  discount: number;
  free_shipping: boolean;
  early_access_hours: number;
  welcome_message: string;
  override_pricing_rules: boolean;
}

interface UserGroup {
  id: string;
  name: string;
  discount_percentage: number;
  benefits: GroupBenefits;
}

export function useCustomerGroups() {
  const { user } = useAuth();

  const { data: userGroups = [] } = useQuery({
    queryKey: ["user-customer-groups", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: memberships } = await supabase
        .from("customer_group_members")
        .select("group_id")
        .eq("user_id", user.id);
      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map(m => m.group_id);
      const { data: groups } = await supabase
        .from("customer_groups")
        .select("*")
        .in("id", groupIds);

      return (groups || []).map(g => {
        const b = g.benefits && typeof g.benefits === "object" && !Array.isArray(g.benefits) ? g.benefits as Record<string, unknown> : {};
        return {
          id: g.id,
          name: g.name,
          discount_percentage: g.discount_percentage || 0,
          benefits: {
            discount: Number(b.discount || 0),
            free_shipping: !!b.free_shipping,
            early_access_hours: Number(b.early_access_hours || 0),
            welcome_message: String(b.welcome_message || ""),
            override_pricing_rules: !!b.override_pricing_rules,
          },
        };
      }) as UserGroup[];
    },
    enabled: !!user,
    staleTime: 120_000,
  });

  const maxDiscount = Math.max(0, ...userGroups.map(g => g.discount_percentage));
  const hasFreeShipping = userGroups.some(g => g.benefits?.free_shipping);
  const welcomeMessage = userGroups.find(g => g.benefits?.welcome_message)?.benefits?.welcome_message || "";
  const overridesPricingRules = userGroups.some(g => g.benefits?.override_pricing_rules);

  return { userGroups, maxDiscount, hasFreeShipping, welcomeMessage, overridesPricingRules };
}
