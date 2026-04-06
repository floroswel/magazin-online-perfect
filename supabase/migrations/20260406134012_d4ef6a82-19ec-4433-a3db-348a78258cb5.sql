CREATE OR REPLACE FUNCTION public.get_social_proof_messages(limit_count int DEFAULT 10)
RETURNS TABLE (message text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    split_part(
      COALESCE(o.shipping_address->>'fullName', o.user_email, 'Client'), ' ', 1
    ) || ' din ' || 
    COALESCE(o.shipping_address->>'city', 'România') || ' a cumpărat ' || 
    COALESCE(
      (SELECT p.name FROM order_items oi JOIN products p ON p.id = oi.product_id 
       WHERE oi.order_id = o.id LIMIT 1),
      'un produs'
    ) as message
  FROM orders o
  WHERE o.status IN ('delivered', 'confirmed', 'shipping')
    AND o.created_at > NOW() - INTERVAL '30 days'
    AND o.shipping_address IS NOT NULL
    AND o.shipping_address->>'city' IS NOT NULL
  ORDER BY o.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';