
-- Profiles: admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Audit: order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (actor_user_id, action, entity_type, entity_id, before_json, after_json)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'order_status_changed',
      'orders',
      NEW.id::text,
      jsonb_build_object('status', OLD.status, 'payment_status', OLD.payment_status),
      jsonb_build_object('status', NEW.status, 'payment_status', NEW.payment_status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Audit: settings changes
CREATE OR REPLACE FUNCTION public.log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (actor_user_id, action, entity_type, entity_id, before_json, after_json)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'settings_changed',
    'app_settings',
    NEW.id::text,
    jsonb_build_object('key', OLD.key, 'value', OLD.value_json),
    jsonb_build_object('key', NEW.key, 'value', NEW.value_json)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_settings_change
  AFTER UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_settings_change();

-- Audit: role changes (privilege escalation detection)
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (actor_user_id, action, entity_type, entity_id, after_json)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'role_granted', 'user_roles', NEW.user_id::text,
      jsonb_build_object('role', NEW.role::text)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (actor_user_id, action, entity_type, entity_id, before_json)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'role_revoked', 'user_roles', OLD.user_id::text,
      jsonb_build_object('role', OLD.role::text)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_role_change
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- GDPR: complete customer data deletion
CREATE OR REPLACE FUNCTION public.delete_customer_data_gdpr(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized - admin only';
  END IF;

  UPDATE public.orders SET
    shipping_address = jsonb_build_object('anonymized', true, 'fullName', 'DELETED'),
    billing_address = jsonb_build_object('anonymized', true, 'fullName', 'DELETED'),
    notes = NULL,
    user_email = 'deleted@anonymized.local'
  WHERE user_id = p_user_id;

  DELETE FROM public.addresses WHERE user_id = p_user_id;
  DELETE FROM public.favorites WHERE user_id = p_user_id;
  DELETE FROM public.abandoned_carts WHERE user_id = p_user_id;
  DELETE FROM public.cart_items WHERE user_id = p_user_id;
  DELETE FROM public.burn_logs WHERE user_id = p_user_id;
  DELETE FROM public.recently_viewed WHERE user_id = p_user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = p_user_id;
  DELETE FROM public.gdpr_consents WHERE user_id = p_user_id;

  UPDATE public.profiles SET
    full_name = 'DELETED', phone = NULL, avatar_url = NULL
  WHERE user_id = p_user_id;

  INSERT INTO public.audit_log (actor_user_id, action, entity_type, entity_id)
  VALUES (auth.uid(), 'gdpr_data_deleted', 'user', p_user_id::text);

  RETURN jsonb_build_object('success', true, 'message', 'Date client șterse conform GDPR');
END;
$$;
