
-- Allow admins full CRUD on user_roles
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
