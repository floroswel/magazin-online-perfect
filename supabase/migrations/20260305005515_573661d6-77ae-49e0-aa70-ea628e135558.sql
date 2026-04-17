
-- Order statuses table
CREATE TABLE public.order_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  icon text DEFAULT '📦',
  description text,
  email_enabled boolean DEFAULT false,
  email_subject text,
  email_body text,
  is_final boolean DEFAULT false,
  is_default boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  allowed_transitions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage order statuses"
  ON public.order_statuses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can read order statuses"
  ON public.order_statuses FOR SELECT TO authenticated
  USING (true);

-- Insert default statuses
INSERT INTO public.order_statuses (key, name, color, icon, description, is_final, is_default, sort_order, allowed_transitions) VALUES
  ('pending', 'Nouă', '#eab308', '🆕', 'Comandă nouă, neconfirmată', false, true, 1, ARRAY['confirmed', 'cancelled']),
  ('confirmed', 'Confirmată', '#3b82f6', '✅', 'Comandă confirmată, în curs de pregătire', false, true, 2, ARRAY['processing', 'cancelled']),
  ('processing', 'În procesare', '#8b5cf6', '⚙️', 'Comanda se pregătește pentru expediere', false, true, 3, ARRAY['packed', 'cancelled']),
  ('packed', 'Împachetată', '#06b6d4', '📦', 'Comanda a fost ambalată', false, true, 4, ARRAY['shipped', 'cancelled']),
  ('shipped', 'Expediată', '#a855f7', '🚚', 'Comanda a fost predată curierului', false, true, 5, ARRAY['delivered', 'returned']),
  ('delivered', 'Livrată', '#22c55e', '✅', 'Comanda a fost livrată cu succes', true, true, 6, ARRAY['returned']),
  ('cancelled', 'Anulată', '#ef4444', '❌', 'Comanda a fost anulată', true, true, 7, ARRAY[]::text[]),
  ('returned', 'Returnată', '#f97316', '↩️', 'Comanda a fost returnată', true, true, 8, ARRAY[]::text[]);
