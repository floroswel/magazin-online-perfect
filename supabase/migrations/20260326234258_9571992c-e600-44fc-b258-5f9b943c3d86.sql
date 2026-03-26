
-- Return form settings (singleton)
CREATE TABLE IF NOT EXISTS public.return_form_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  returnable_products text NOT NULL DEFAULT 'all',
  returnable_category_ids jsonb,
  return_window_days int NOT NULL DEFAULT 30,
  allow_same_product_exchange boolean NOT NULL DEFAULT true,
  allow_different_product_exchange boolean NOT NULL DEFAULT false,
  allow_order_cancellation boolean NOT NULL DEFAULT true,
  return_reasons jsonb NOT NULL DEFAULT '[{"id":"reason_1","text":"Produs defect / deteriorat","image_requirement":"optional"},{"id":"reason_2","text":"Produs diferit față de descriere","image_requirement":"optional"},{"id":"reason_3","text":"Produs greșit livrat","image_requirement":"disabled"},{"id":"reason_4","text":"Nu mai am nevoie de produs","image_requirement":"disabled"},{"id":"reason_5","text":"Mărimea/culoarea nu corespunde","image_requirement":"disabled"},{"id":"reason_6","text":"Altul","image_requirement":"disabled"}]'::jsonb,
  courier_pickup text NOT NULL DEFAULT 'customer_choice',
  allow_bank_refund boolean NOT NULL DEFAULT true,
  allow_multiple_returns_per_order boolean NOT NULL DEFAULT true,
  allow_partial_returns boolean NOT NULL DEFAULT true,
  show_footer_link boolean NOT NULL DEFAULT false,
  footer_link_text text NOT NULL DEFAULT 'Returnează un produs',
  return_shipping_cost decimal NOT NULL DEFAULT 0,
  exchange_shipping_cost decimal NOT NULL DEFAULT 0,
  auto_approve boolean NOT NULL DEFAULT false,
  notify_on_created boolean NOT NULL DEFAULT true,
  notify_on_approved boolean NOT NULL DEFAULT true,
  notify_on_rejected boolean NOT NULL DEFAULT true,
  email_created_subject text NOT NULL DEFAULT 'Cererea ta de retur #{return_id} a fost înregistrată',
  email_created_body text NOT NULL DEFAULT '',
  email_approved_subject text NOT NULL DEFAULT 'Cererea ta de retur #{return_id} a fost aprobată',
  email_approved_body text NOT NULL DEFAULT '',
  email_rejected_subject text NOT NULL DEFAULT 'Cererea ta de retur #{return_id} a fost respinsă',
  email_rejected_body text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.return_form_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_form_settings' AND policyname = 'Anyone can read return settings') THEN
    CREATE POLICY "Anyone can read return settings" ON public.return_form_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_form_settings' AND policyname = 'Admins manage return settings') THEN
    CREATE POLICY "Admins manage return settings" ON public.return_form_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
INSERT INTO public.return_form_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM public.return_form_settings LIMIT 1);

-- Add missing columns to existing returns table
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS refund_method text DEFAULT 'none';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS bank_account_holder text;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS bank_iban text;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS courier_pickup_by text DEFAULT 'customer';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS pickup_address text;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS preferred_pickup_date date;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS return_shipping_cost_calculated decimal DEFAULT 0;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS auto_approved boolean DEFAULT false;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add missing columns to return_request_items
ALTER TABLE public.return_request_items ADD COLUMN IF NOT EXISTS variant_id uuid;
ALTER TABLE public.return_request_items ADD COLUMN IF NOT EXISTS return_reason_id text;
ALTER TABLE public.return_request_items ADD COLUMN IF NOT EXISTS return_reason_text text;
ALTER TABLE public.return_request_items ADD COLUMN IF NOT EXISTS exchange_quantity int;
ALTER TABLE public.return_request_items ADD COLUMN IF NOT EXISTS unit_price decimal DEFAULT 0;
ALTER TABLE public.return_request_items ADD COLUMN IF NOT EXISTS total_value decimal DEFAULT 0;

-- Return request images
CREATE TABLE IF NOT EXISTS public.return_request_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id uuid NOT NULL,
  return_item_id uuid,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  original_filename text,
  file_size int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.return_request_images ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_request_images' AND policyname = 'Read return images') THEN
    CREATE POLICY "Read return images" ON public.return_request_images FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_request_images' AND policyname = 'Insert return images') THEN
    CREATE POLICY "Insert return images" ON public.return_request_images FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Return request notes
CREATE TABLE IF NOT EXISTS public.return_request_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id uuid NOT NULL,
  note_text text NOT NULL,
  admin_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.return_request_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_request_notes' AND policyname = 'Admins manage return notes') THEN
    CREATE POLICY "Admins manage return notes" ON public.return_request_notes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('return-request-images', 'return-request-images', true) ON CONFLICT (id) DO NOTHING;
