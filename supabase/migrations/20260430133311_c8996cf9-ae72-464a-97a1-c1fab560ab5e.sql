-- Theme Settings Registry: sursă unică de adevăr pentru sincronizare Admin ↔ Storefront
CREATE TABLE IF NOT EXISTS public.theme_settings_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  group_name text NOT NULL,
  value_type text NOT NULL CHECK (value_type IN ('string','number','boolean','color','json','richtext','url','enum')),
  default_value jsonb,
  validator_regex text,
  enum_options jsonb,
  description text,
  consumer_files jsonb DEFAULT '[]'::jsonb,
  admin_module text,
  is_required boolean DEFAULT false,
  is_public boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_settings_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read registry"
  ON public.theme_settings_registry FOR SELECT
  USING (true);

CREATE POLICY "Admins manage registry"
  ON public.theme_settings_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_theme_settings_registry_updated_at
  BEFORE UPDATE ON public.theme_settings_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_registry_group ON public.theme_settings_registry(group_name);
CREATE INDEX idx_registry_admin_module ON public.theme_settings_registry(admin_module);

-- Marcare conservativă deprecated pe app_settings (nu se șterge nimic)
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS deprecated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deprecated_reason text,
  ADD COLUMN IF NOT EXISTS replaced_by_key text;

CREATE INDEX IF NOT EXISTS idx_app_settings_deprecated ON public.app_settings(deprecated_at) WHERE deprecated_at IS NOT NULL;

-- Snapshot al raportului de audit (rulat de pagina /admin/system/theme-audit)
CREATE TABLE IF NOT EXISTS public.theme_audit_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  ran_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_db_keys integer NOT NULL,
  total_registry_keys integer NOT NULL,
  synced_count integer NOT NULL,
  orphan_db_count integer NOT NULL,
  missing_in_db_count integer NOT NULL,
  deprecated_count integer NOT NULL,
  report_json jsonb NOT NULL
);

ALTER TABLE public.theme_audit_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit snapshots"
  ON public.theme_audit_snapshots FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins create audit snapshots"
  ON public.theme_audit_snapshots FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Funcție RPC: returnează raportul live de sincronizare
CREATE OR REPLACE FUNCTION public.theme_audit_report()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_db_keys jsonb;
  v_registry_keys jsonb;
  v_orphan jsonb;
  v_missing jsonb;
  v_deprecated jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;

  SELECT COALESCE(jsonb_agg(key ORDER BY key), '[]'::jsonb) INTO v_db_keys
    FROM app_settings WHERE deprecated_at IS NULL;
  SELECT COALESCE(jsonb_agg(key ORDER BY key), '[]'::jsonb) INTO v_registry_keys
    FROM theme_settings_registry;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('key', key, 'reason', deprecated_reason, 'replaced_by', replaced_by_key) ORDER BY key), '[]'::jsonb) INTO v_deprecated
    FROM app_settings WHERE deprecated_at IS NOT NULL;
  SELECT COALESCE(jsonb_agg(key ORDER BY key), '[]'::jsonb) INTO v_orphan
    FROM app_settings a
    WHERE a.deprecated_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM theme_settings_registry r WHERE r.key = a.key);
  SELECT COALESCE(jsonb_agg(key ORDER BY key), '[]'::jsonb) INTO v_missing
    FROM theme_settings_registry r
    WHERE NOT EXISTS (SELECT 1 FROM app_settings a WHERE a.key = r.key AND a.deprecated_at IS NULL);

  v_result := jsonb_build_object(
    'generated_at', now(),
    'db_keys', v_db_keys,
    'registry_keys', v_registry_keys,
    'orphan_db_keys', v_orphan,
    'missing_in_db', v_missing,
    'deprecated', v_deprecated,
    'totals', jsonb_build_object(
      'db', jsonb_array_length(v_db_keys),
      'registry', jsonb_array_length(v_registry_keys),
      'orphan', jsonb_array_length(v_orphan),
      'missing', jsonb_array_length(v_missing),
      'deprecated', jsonb_array_length(v_deprecated)
    )
  );
  RETURN v_result;
END;
$$;

-- Funcție: marchează o cheie deprecated (conservator, fără DELETE)
CREATE OR REPLACE FUNCTION public.deprecate_setting(p_key text, p_reason text DEFAULT NULL, p_replaced_by text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;
  UPDATE app_settings
    SET deprecated_at = now(), deprecated_reason = p_reason, replaced_by_key = p_replaced_by
    WHERE key = p_key;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Key not found'); END IF;
  INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, after_json)
    VALUES (auth.uid(), 'setting_deprecated', 'app_settings', p_key, jsonb_build_object('reason', p_reason, 'replaced_by', p_replaced_by));
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Funcție: restaurează o cheie deprecated
CREATE OR REPLACE FUNCTION public.undeprecate_setting(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;
  UPDATE app_settings SET deprecated_at = NULL, deprecated_reason = NULL, replaced_by_key = NULL WHERE key = p_key;
  RETURN jsonb_build_object('success', FOUND);
END;
$$;