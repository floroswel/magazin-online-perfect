
ALTER TABLE public.return_form_settings
  ADD COLUMN IF NOT EXISTS restocking_fee_percent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notification_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS return_policy_text text DEFAULT 'Conform OUG 34/2014, aveți dreptul de a returna produsele în termen de 14 zile calendaristice de la primirea coletului, fără a fi nevoie să motivați decizia.',
  ADD COLUMN IF NOT EXISTS allow_wallet_refund boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS processing_sla_days integer DEFAULT 14,
  ADD COLUMN IF NOT EXISTS non_returnable_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS require_order_delivered boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_guest_returns boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS return_address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notify_on_received boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_received_subject text DEFAULT 'Am primit produsele returnate #{return_id}',
  ADD COLUMN IF NOT EXISTS email_received_body text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notify_on_refunded boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_refunded_subject text DEFAULT 'Rambursarea pentru retur #{return_id} a fost procesată',
  ADD COLUMN IF NOT EXISTS email_refunded_body text DEFAULT '';
