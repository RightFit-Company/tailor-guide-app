CREATE TABLE public.body_profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_profiles TO authenticated;
GRANT ALL ON public.body_profiles TO service_role;
ALTER TABLE public.body_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own body select" ON public.body_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own body insert" ON public.body_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own body update" ON public.body_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own body delete" ON public.body_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);