
-- Add reconciliation tracking to payment_transactions
ALTER TABLE public.payment_transactions 
  ADD COLUMN IF NOT EXISTS reconciled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reconciled_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciled_by uuid;

-- Add index for reconciliation queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reconciled ON public.payment_transactions(reconciled);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);
