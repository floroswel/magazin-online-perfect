
-- Extend customer_groups with new columns for dynamic groups system
ALTER TABLE public.customer_groups ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'bg-blue-500/20 text-blue-600 border-blue-500/30';
ALTER TABLE public.customer_groups ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'manual';
ALTER TABLE public.customer_groups ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customer_groups ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.customer_groups ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE public.customer_groups ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Add added_at default to customer_group_members if missing
ALTER TABLE public.customer_group_members ALTER COLUMN added_at SET DEFAULT now();
