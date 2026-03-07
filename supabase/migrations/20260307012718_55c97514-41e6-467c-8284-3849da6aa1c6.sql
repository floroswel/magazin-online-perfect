
-- Win-back campaigns
CREATE TABLE public.winback_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_days integer NOT NULL DEFAULT 60,
  target_segment text NOT NULL DEFAULT 'all',
  target_group_id uuid REFERENCES public.customer_groups(id) ON DELETE SET NULL,
  email_1_enabled boolean DEFAULT true,
  email_1_subject text DEFAULT 'Ne este dor de tine, {{nume}}!',
  email_1_template_id text,
  email_2_enabled boolean DEFAULT true,
  email_2_delay_days integer DEFAULT 7,
  email_2_subject text DEFAULT 'Avem ceva special pentru tine',
  email_2_discount_percent numeric DEFAULT 10,
  email_2_discount_validity_days integer DEFAULT 7,
  email_3_enabled boolean DEFAULT true,
  email_3_delay_days integer DEFAULT 14,
  email_3_subject text DEFAULT 'Ultima noastră ofertă pentru tine',
  email_3_discount_percent numeric DEFAULT 15,
  email_3_free_shipping boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Win-back enrollment per customer
CREATE TABLE public.winback_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.winback_campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL,
  user_email text,
  status text NOT NULL DEFAULT 'active',
  email_1_sent_at timestamptz,
  email_2_sent_at timestamptz,
  email_3_sent_at timestamptz,
  coupon_code text,
  converted boolean DEFAULT false,
  converted_at timestamptz,
  converted_order_id text,
  revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_winback_enrollments_status ON public.winback_enrollments(status);
CREATE INDEX idx_winback_enrollments_campaign ON public.winback_enrollments(campaign_id);

-- SMS campaigns table (enhance existing concept)
CREATE TABLE IF NOT EXISTS public.sms_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message text NOT NULL,
  recipient_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  cost numeric DEFAULT 0,
  status text DEFAULT 'draft',
  trigger_type text,
  target_segment text,
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Push notification campaigns
CREATE TABLE public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  url text DEFAULT '/',
  image_url text,
  target text DEFAULT 'all',
  target_group_id uuid REFERENCES public.customer_groups(id) ON DELETE SET NULL,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  status text DEFAULT 'draft',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Recommendation email preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recommendation_optout boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_consent boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz;

-- Enable RLS
ALTER TABLE public.winback_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winback_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin-only policies via has_role
CREATE POLICY "Admin manage winback_campaigns" ON public.winback_campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage winback_enrollments" ON public.winback_enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage push_campaigns" ON public.push_campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
