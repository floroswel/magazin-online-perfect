
-- Drop existing overly permissive policies on erp_integrations
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'erp_integrations' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.erp_integrations', pol.policyname);
  END LOOP;
END $$;

-- Admin-only policies for erp_integrations
CREATE POLICY "Admin can read erp_integrations"
  ON public.erp_integrations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert erp_integrations"
  ON public.erp_integrations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update erp_integrations"
  ON public.erp_integrations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete erp_integrations"
  ON public.erp_integrations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
