
-- ============================================================
-- 1. CRITICAL: Remove permissive public SELECT on custom_scripts
-- ============================================================
DROP POLICY IF EXISTS "Allow public read active custom scripts" ON public.custom_scripts;

-- ============================================================
-- 2. CRITICAL: Remove permissive INSERT on return-photos storage
-- ============================================================
DROP POLICY IF EXISTS "Users can upload return photos" ON storage.objects;

-- ============================================================
-- 3. Remove permissive INSERT on customization-uploads storage
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can upload customization files" ON storage.objects;

-- ============================================================
-- 4. CMS pages: restrict public SELECT to published only
-- ============================================================
DROP POLICY IF EXISTS "Pages viewable by all" ON public.cms_pages;
CREATE POLICY "Published pages viewable by all" ON public.cms_pages
  FOR SELECT USING (published = true);
CREATE POLICY "Admins can view all cms pages" ON public.cms_pages
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 5. Courier configs: admin only
-- ============================================================
DROP POLICY IF EXISTS "Auth can view courier configs" ON public.courier_configs;
DROP POLICY IF EXISTS "Courier configs viewable by auth" ON public.courier_configs;
CREATE POLICY "Only admins can view courier configs" ON public.courier_configs
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 6. Warehouses: admin only
-- ============================================================
DROP POLICY IF EXISTS "Auth can view warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Warehouses viewable by auth" ON public.warehouses;
CREATE POLICY "Only admins can view warehouses" ON public.warehouses
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 7. Customer groups: admin only  
-- ============================================================
DROP POLICY IF EXISTS "Customer groups viewable by auth" ON public.customer_groups;
CREATE POLICY "Only admins can view customer groups" ON public.customer_groups
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 8. Price lists: admin only
-- ============================================================
DROP POLICY IF EXISTS "Price lists viewable by auth" ON public.price_lists;
CREATE POLICY "Only admins can view price lists" ON public.price_lists
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 9. Price list items: admin only
-- ============================================================
DROP POLICY IF EXISTS "Price list items viewable by auth" ON public.price_list_items;
DROP POLICY IF EXISTS "Anyone can view price list items" ON public.price_list_items;
CREATE POLICY "Only admins can view price list items" ON public.price_list_items
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 10. Price list groups: admin only
-- ============================================================
DROP POLICY IF EXISTS "Price list groups viewable by auth" ON public.price_list_groups;
DROP POLICY IF EXISTS "Anyone can view price list groups" ON public.price_list_groups;
CREATE POLICY "Only admins can view price list groups" ON public.price_list_groups
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 11. Group prices: admin only
-- ============================================================
DROP POLICY IF EXISTS "Group prices viewable by auth" ON public.group_prices;
CREATE POLICY "Only admins can view group prices" ON public.group_prices
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 12. Connectors: admin only
-- ============================================================
DROP POLICY IF EXISTS "Connectors viewable by auth" ON public.connectors;
DROP POLICY IF EXISTS "Auth can view connectors" ON public.connectors;
CREATE POLICY "Only admins can view connectors" ON public.connectors
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 13. Modules: admin only
-- ============================================================
DROP POLICY IF EXISTS "Modules viewable by auth" ON public.modules;
DROP POLICY IF EXISTS "Auth can view modules" ON public.modules;
CREATE POLICY "Only admins can view modules" ON public.modules
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 14. Role permissions: admin only
-- ============================================================
DROP POLICY IF EXISTS "Role permissions viewable by auth" ON public.role_permissions;
DROP POLICY IF EXISTS "Auth can view role permissions" ON public.role_permissions;
CREATE POLICY "Only admins can view role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 15. Price rules: admin only
-- ============================================================
DROP POLICY IF EXISTS "Price rules viewable by auth" ON public.price_rules;
DROP POLICY IF EXISTS "Auth can view price rules" ON public.price_rules;
CREATE POLICY "Only admins can view price rules" ON public.price_rules
  FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 16. Pricing rules: restrict anon to active only, full for admin
-- ============================================================
DROP POLICY IF EXISTS "Pricing rules viewable by all" ON public.pricing_rules;
CREATE POLICY "Active pricing rules viewable by all" ON public.pricing_rules
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all pricing rules" ON public.pricing_rules
  FOR SELECT TO authenticated USING (public.is_admin());
