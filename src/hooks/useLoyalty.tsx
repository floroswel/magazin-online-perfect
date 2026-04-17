// Stub minim — păstrează tipurile folosite de panoul de admin.
// Logica de storefront a fost rescrisă; componentele de admin continuă să funcționeze.
export interface LoyaltyConfig {
  enabled: boolean;
  points_per_ron: number;
  ron_per_100_points: number;
  min_redeem_points: number;
  expiry_days: number | null;
  earn_on_review: number;
  earn_on_signup: number;
  earn_on_birthday: number;
  earn_on_referral: number;
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: true,
  points_per_ron: 1,
  ron_per_100_points: 5,
  min_redeem_points: 50,
  expiry_days: null,
  earn_on_review: 10,
  earn_on_signup: 50,
  earn_on_birthday: 100,
  earn_on_referral: 200,
};
