ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS saved_for_later boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_wrap boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_message text,
  ADD COLUMN IF NOT EXISTS note text;

CREATE INDEX IF NOT EXISTS idx_cart_items_saved_for_later
  ON public.cart_items (user_id, saved_for_later);