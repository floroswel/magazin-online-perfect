
-- burn_logs table already created in previous migration
-- VENTUZA brand already inserted
-- Just link products to brand
UPDATE public.products SET brand_id = (SELECT id FROM public.brands WHERE slug = 'ventuza' LIMIT 1) WHERE brand_id IS NULL;
