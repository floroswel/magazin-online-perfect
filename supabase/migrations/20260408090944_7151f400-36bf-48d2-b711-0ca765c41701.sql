-- Add delivered_at to orders for tracking actual delivery date
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Add extended_return_window_days to return_form_settings (overrides return_window_days when set)
ALTER TABLE public.return_form_settings ADD COLUMN IF NOT EXISTS extended_return_window_days integer DEFAULT NULL;

-- Add require_gdpr_consent to return_form_settings
ALTER TABLE public.return_form_settings ADD COLUMN IF NOT EXISTS require_gdpr_consent boolean DEFAULT true;

-- Add gdpr_consent_text to return_form_settings  
ALTER TABLE public.return_form_settings ADD COLUMN IF NOT EXISTS gdpr_consent_text text DEFAULT 'Sunt de acord cu prelucrarea datelor personale conform Politicii de Confidențialitate și a OUG 34/2014 privind drepturile consumatorilor.';

-- Add gdpr_consent_given and return_window_deadline to returns table
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS gdpr_consent_given boolean DEFAULT false;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS return_deadline date;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS customer_notified_at timestamptz;

-- Auto-set delivered_at when order status changes to delivered/livrat
CREATE OR REPLACE FUNCTION public.set_delivered_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('delivered', 'livrat') AND (OLD.status IS NULL OR OLD.status NOT IN ('delivered', 'livrat')) THEN
    NEW.delivered_at := COALESCE(NEW.delivered_at, now());
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_delivered_at ON public.orders;
CREATE TRIGGER trg_set_delivered_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_delivered_at();

-- Backfill delivered_at for existing delivered orders
UPDATE public.orders 
SET delivered_at = updated_at 
WHERE status IN ('delivered', 'livrat', 'completed') 
AND delivered_at IS NULL;