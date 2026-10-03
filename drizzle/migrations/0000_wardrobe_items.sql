CREATE TABLE public.wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  kind TEXT NOT NULL DEFAULT 'top',
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#e9e4da',
  image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wardrobe_items TO authenticated;
GRANT ALL ON public.wardrobe_items TO service_role;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own items select" ON public.wardrobe_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own items insert" ON public.wardrobe_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own items update" ON public.wardrobe_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own items delete" ON public.wardrobe_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Own wardrobe files select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'wardrobe' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own wardrobe files insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'wardrobe' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own wardrobe files delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'wardrobe' AND (storage.foldername(name))[1] = auth.uid()::text);