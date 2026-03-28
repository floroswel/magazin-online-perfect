
-- Allow reviews without user_id for seed/admin reviews
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;

-- Add reviewer_name for non-authenticated reviews  
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name text;

-- Drop the FK constraint that forces auth.users reference
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Re-add as optional FK
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Insert 10 seed reviews
INSERT INTO public.reviews (product_id, user_id, rating, comment, reviewer_name, created_at) VALUES
('1f55b450-e899-4422-989a-2adafc984629', NULL, 5, 'Parfumul de vanilie și caramel este absolut divin! Umplu tot living-ul și durează ore întregi. Cea mai bună lumânare pe care am cumpărat-o vreodată. Am comandat deja a treia!', 'Maria P.', now() - interval '3 days'),
('1f55b450-e899-4422-989a-2adafc984629', NULL, 5, 'Am primit-o cadou și m-am îndrăgostit. Ceara de soia se topește uniform, nu lasă urme negre și parfumul este exact ca într-o cofetărie franțuzească.', 'Andreea T.', now() - interval '10 days'),
('060d43df-f69c-47d5-a6f3-7174bd043a40', NULL, 5, 'Lavanda cu eucalipt — combinația perfectă pentru baie! O aprind de fiecare dată când fac baie seara și mă relaxează instant. Calitate premium, se simte.', 'Diana M.', now() - interval '7 days'),
('060d43df-f69c-47d5-a6f3-7174bd043a40', NULL, 4, 'Foarte plăcută, parfumul e delicat dar persistent. Aș fi vrut poate o intensitate puțin mai mare, dar per total sunt foarte mulțumită.', 'Ioana R.', now() - interval '15 days'),
('8262def4-5748-4905-925e-e68073b1fafb', NULL, 5, 'Trandafir și bujor — parfumul primăverii! Am oferit-o cadou mamei și a fost încântată. Ambalajul premium a făcut-o și mai specială.', 'Elena S.', now() - interval '5 days'),
('7a42a38d-db6e-47ea-9d33-c44575463df5', NULL, 5, 'Scorțișoară cu portocală = Crăciunul perfect! Am cumpărat 5 pentru cadouri de Crăciun și toată lumea a fost încântată. Se simt ingredientele naturale.', 'Alexandru C.', now() - interval '20 days'),
('70d60019-0aa1-40ed-a80b-b41cfcb33cd7', NULL, 5, 'Fitilul de lemn face toată diferența! Sunetul de pârâit combinat cu parfumul de santal și cedru creează o atmosferă incredibilă. Worth every leu!', 'Mihai D.', now() - interval '8 days'),
('8bf5a317-4fbc-4e6c-8e40-c67195c1a070', NULL, 5, 'Setul Seară Perfectă a fost cadoul ideal pentru nunta prietenei mele. Prezentarea impecabilă, parfumurile complementare, totul perfect!', 'Cristina V.', now() - interval '12 days'),
('0ec096a2-80ba-4e55-9914-d708dd1e7569', NULL, 4, 'Designul bubble este super cute! Arată minunat pe raft, deși nu o aprind prea des că e prea frumoasă. Cadou perfect pentru cineva care iubește decorul.', 'Raluca N.', now() - interval '25 days'),
('60d7ace0-7c36-4656-8a6d-cc30932d2a37', NULL, 5, 'Setul de relaxare — cel mai bun self-care kit! Toate cele 3 lumânări se completează perfect. Le aprind câte una în funcție de starea de spirit.', 'Laura B.', now() - interval '18 days');

-- Update product ratings and review counts
UPDATE public.products SET rating = 5.0, review_count = 2 WHERE id = '1f55b450-e899-4422-989a-2adafc984629';
UPDATE public.products SET rating = 4.5, review_count = 2 WHERE id = '060d43df-f69c-47d5-a6f3-7174bd043a40';
UPDATE public.products SET rating = 5.0, review_count = 1 WHERE id = '8262def4-5748-4905-925e-e68073b1fafb';
UPDATE public.products SET rating = 5.0, review_count = 1 WHERE id = '7a42a38d-db6e-47ea-9d33-c44575463df5';
UPDATE public.products SET rating = 5.0, review_count = 1 WHERE id = '70d60019-0aa1-40ed-a80b-b41cfcb33cd7';
UPDATE public.products SET rating = 5.0, review_count = 1 WHERE id = '8bf5a317-4fbc-4e6c-8e40-c67195c1a070';
UPDATE public.products SET rating = 4.0, review_count = 1 WHERE id = '0ec096a2-80ba-4e55-9914-d708dd1e7569';
UPDATE public.products SET rating = 5.0, review_count = 1 WHERE id = '60d7ace0-7c36-4656-8a6d-cc30932d2a37';
