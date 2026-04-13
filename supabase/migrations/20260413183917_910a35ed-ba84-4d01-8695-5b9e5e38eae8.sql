ALTER TABLE public.custom_scripts 
ADD COLUMN IF NOT EXISTS consent_category text NOT NULL DEFAULT 'necessary';