
-- Fix: product_relations table already created, just add the missing RLS policy
CREATE POLICY "Public read product_relations" ON public.product_relations FOR SELECT TO anon, authenticated USING (true);
