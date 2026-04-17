
-- Extend newsletter_subscribers
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'footer',
  ADD COLUMN IF NOT EXISTS consent_ip text,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS groups text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS confirmation_token text,
  ADD COLUMN IF NOT EXISTS confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_id text;

-- Extend newsletter_campaigns
ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS preview_text text,
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS target_groups text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_segment text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS open_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unsubscribe_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bounce_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocks jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Newsletter subscriber groups
CREATE TABLE IF NOT EXISTS public.newsletter_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  auto_sync_customer_group_id uuid REFERENCES public.customer_groups(id) ON DELETE SET NULL,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.newsletter_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage newsletter_groups" ON public.newsletter_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Newsletter popup settings stored in app_settings (no new table needed)
