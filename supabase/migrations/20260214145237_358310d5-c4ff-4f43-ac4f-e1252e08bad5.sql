
-- Step 1: Add new roles to enum (must be committed alone)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'orders_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'products_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';
