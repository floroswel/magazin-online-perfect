
ALTER TABLE public.products DROP CONSTRAINT products_category_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.categories DROP CONSTRAINT categories_parent_id_fkey;
ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.ai_generator_log DROP CONSTRAINT ai_generator_log_category_id_fkey;
ALTER TABLE public.ai_generator_log ADD CONSTRAINT ai_generator_log_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.bundle_products DROP CONSTRAINT bundle_products_category_id_fkey;
ALTER TABLE public.bundle_products ADD CONSTRAINT bundle_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
