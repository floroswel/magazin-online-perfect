ALTER TABLE public.invoice_items
  DROP CONSTRAINT IF EXISTS invoice_items_product_id_fkey,
  ADD CONSTRAINT invoice_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.promotions
  DROP CONSTRAINT IF EXISTS promotions_gift_product_id_fkey,
  ADD CONSTRAINT promotions_gift_product_id_fkey
    FOREIGN KEY (gift_product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.return_request_items
  DROP CONSTRAINT IF EXISTS return_request_items_product_id_fkey,
  ADD CONSTRAINT return_request_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.return_request_items
  DROP CONSTRAINT IF EXISTS return_request_items_exchange_product_id_fkey,
  ADD CONSTRAINT return_request_items_exchange_product_id_fkey
    FOREIGN KEY (exchange_product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.scent_quiz_results
  DROP CONSTRAINT IF EXISTS scent_quiz_results_purchased_product_id_fkey,
  ADD CONSTRAINT scent_quiz_results_purchased_product_id_fkey
    FOREIGN KEY (purchased_product_id) REFERENCES public.products(id) ON DELETE SET NULL;