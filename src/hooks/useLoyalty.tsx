// Stub minim — păstrează doar formă largă pentru a nu rupe panoul de admin.
// Toate câmpurile sunt opționale (any) pentru că logica reală a fost ștearsă cu storefront-ul.
export type LoyaltyConfig = Record<string, any>;

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  program_enabled: true,
  program_name: "MamaLucica Rewards",
  earn_rate_points: 1,
  earn_rate_per_amount: 1,
  redeem_rate_points: 100,
  redeem_rate_value: 5,
  min_points_redeem: 50,
  max_redeem_percent: 50,
  expiry_months: 12,
  weekend_enabled: false,
  weekend_multiplier: 2,
  bonus_category_points: 0,
};
