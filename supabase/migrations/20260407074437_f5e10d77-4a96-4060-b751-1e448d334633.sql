
-- Counties table
CREATE TABLE IF NOT EXISTS public.romania_judete (
  id serial PRIMARY KEY,
  nume text NOT NULL,
  abreviere text NOT NULL UNIQUE
);

-- Localities table
CREATE TABLE IF NOT EXISTS public.romania_localitati (
  id serial PRIMARY KEY,
  judet_id int REFERENCES public.romania_judete(id) ON DELETE CASCADE,
  nume text NOT NULL,
  tip text
);

-- RLS
ALTER TABLE public.romania_judete ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romania_localitati ENABLE ROW LEVEL SECURITY;

-- Public read access (reference data)
CREATE POLICY "Anyone can read counties" ON public.romania_judete FOR SELECT USING (true);
CREATE POLICY "Anyone can read localities" ON public.romania_localitati FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admins manage counties" ON public.romania_judete FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage localities" ON public.romania_localitati FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for locality lookups
CREATE INDEX idx_localitati_judet ON public.romania_localitati(judet_id);
CREATE INDEX idx_localitati_nume ON public.romania_localitati(nume);
