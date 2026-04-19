-- Phase 2A.1: Catalog data model hardening for production
-- 1. is_demo flag on key catalog tables for easy QA cleanup
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_demo ON public.products(is_demo) WHERE is_demo = true;

-- 2. Link products to suppliers (optional, for purchasing & reorder)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);

-- 3. Add CUI/lead_time to suppliers (used in admin UI)
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS cui text,
  ADD COLUMN IF NOT EXISTS lead_time_days integer DEFAULT 7;

-- 4. Product compatibility table (e.g. accessories, replacement parts)
CREATE TABLE IF NOT EXISTS public.product_compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  compatible_with_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, compatible_with_id),
  CHECK (product_id <> compatible_with_id)
);
CREATE INDEX IF NOT EXISTS idx_compat_product ON public.product_compatibility(product_id);
CREATE INDEX IF NOT EXISTS idx_compat_with ON public.product_compatibility(compatible_with_id);

ALTER TABLE public.product_compatibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Compatibility readable by everyone" ON public.product_compatibility;
CREATE POLICY "Compatibility readable by everyone"
ON public.product_compatibility FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage compatibility" ON public.product_compatibility;
CREATE POLICY "Admins manage compatibility"
ON public.product_compatibility FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Suppliers RLS (was missing admin-only management policies in some setups)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage suppliers" ON public.suppliers;
CREATE POLICY "Admins manage suppliers"
ON public.suppliers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Helper RPC: count products per brand (used in AdminBrands counter)
CREATE OR REPLACE FUNCTION public.brand_product_counts()
RETURNS TABLE (brand_id uuid, product_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT brand_id, count(*)::bigint FROM public.products WHERE brand_id IS NOT NULL GROUP BY brand_id;
$$;

-- 7. Helper RPC: bulk delete demo data (admin only) — used by "Reset QA seed" button
CREATE OR REPLACE FUNCTION public.purge_demo_catalog()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_products int; v_cats int; v_brands int; v_supp int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;
  DELETE FROM public.products WHERE is_demo = true;
  GET DIAGNOSTICS v_products = ROW_COUNT;
  DELETE FROM public.categories WHERE is_demo = true;
  GET DIAGNOSTICS v_cats = ROW_COUNT;
  DELETE FROM public.brands WHERE is_demo = true;
  GET DIAGNOSTICS v_brands = ROW_COUNT;
  DELETE FROM public.suppliers WHERE is_demo = true;
  GET DIAGNOSTICS v_supp = ROW_COUNT;
  RETURN jsonb_build_object('products', v_products, 'categories', v_cats, 'brands', v_brands, 'suppliers', v_supp);
END;
$$;