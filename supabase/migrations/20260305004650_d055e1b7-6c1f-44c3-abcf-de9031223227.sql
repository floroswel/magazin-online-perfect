
-- Order tags
CREATE TABLE public.order_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage order_tags" ON public.order_tags
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Order tag assignments (many-to-many)
CREATE TABLE public.order_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.order_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, tag_id)
);

ALTER TABLE public.order_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage order_tag_assignments" ON public.order_tag_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Order timeline / status history
CREATE TABLE public.order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_status text,
  new_status text,
  note text,
  is_internal boolean DEFAULT true,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage order_timeline" ON public.order_timeline
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default order tags
INSERT INTO public.order_tags (name, color) VALUES
  ('Urgent', '#ef4444'),
  ('Cadou', '#ec4899'),
  ('B2B', '#3b82f6'),
  ('Verificare', '#f59e0b'),
  ('Prioritar', '#8b5cf6');
