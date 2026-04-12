
-- 1. courier_configs: Remove the overly broad policy
DROP POLICY IF EXISTS "Auth view courier configs" ON public.courier_configs;

-- 2. role_permissions: Remove the overly broad policy
DROP POLICY IF EXISTS "Auth users can view role_permissions" ON public.role_permissions;

-- 3. price_list_items: Remove the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can read price_list_items" ON public.price_list_items;

-- 4. price_list_groups: Remove the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can read price_list_groups" ON public.price_list_groups;

-- 5. sameday_pickup_points: Replace open policy with admin-only
DROP POLICY IF EXISTS "Authenticated read sameday_pickup_points" ON public.sameday_pickup_points;

CREATE POLICY "Only admins can view sameday pickup points"
ON public.sameday_pickup_points
FOR SELECT
TO authenticated
USING (public.is_admin());
