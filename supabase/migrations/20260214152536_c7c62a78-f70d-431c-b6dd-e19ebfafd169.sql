-- Allow admins to manage loyalty levels
CREATE POLICY "Admins can insert loyalty levels"
ON public.loyalty_levels
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update loyalty levels"
ON public.loyalty_levels
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete loyalty levels"
ON public.loyalty_levels
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all loyalty points (not just own)
CREATE POLICY "Admins can view all loyalty points"
ON public.loyalty_points
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert loyalty points for any user
CREATE POLICY "Admins can insert loyalty points"
ON public.loyalty_points
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));