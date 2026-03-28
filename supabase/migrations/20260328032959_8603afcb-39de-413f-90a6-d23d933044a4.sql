
-- Drop old restrictive INSERT policies
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create own order items" ON public.order_items;

-- Allow authenticated users to insert orders with their own user_id
CREATE POLICY "Authenticated users can create orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous/guest checkout (user_id = placeholder UUID)
CREATE POLICY "Guest users can create orders"
ON public.orders FOR INSERT TO anon
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Allow authenticated users to insert order items for their own orders
CREATE POLICY "Authenticated users can create order items"
ON public.order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
));

-- Allow anon users to insert order items for guest orders
CREATE POLICY "Guest users can create order items"
ON public.order_items FOR INSERT TO anon
WITH CHECK (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = '00000000-0000-0000-0000-000000000000'::uuid
));

-- Allow anon users to view their guest orders (for confirmation page)
CREATE POLICY "Guest users can view guest orders"
ON public.orders FOR SELECT TO anon
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid);

-- Allow anon to view guest order items
CREATE POLICY "Guest users can view guest order items"
ON public.order_items FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = '00000000-0000-0000-0000-000000000000'::uuid
));
