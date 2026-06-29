-- MIGRATION FINAL: Correção de colunas ausentes e criação dos buckets de Storage
-- Aplicar no SQL Editor do Supabase

-- 1. Corrigir colunas ausentes confirmadas
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS url text;

-- 2. Criar Buckets de Storage caso não existam
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('products', 'products', true),
  ('banners', 'banners', true),
  ('categories', 'categories', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage (Públicas para leitura)
CREATE POLICY "Leitura pública products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Leitura pública banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Leitura pública categories" ON storage.objects FOR SELECT USING (bucket_id = 'categories');
CREATE POLICY "Leitura pública avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- 4. Políticas de Storage (Admins podem inserir/atualizar)
CREATE POLICY "Admin gerenciamento products" ON storage.objects FOR ALL USING (bucket_id = 'products' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin gerenciamento banners" ON storage.objects FOR ALL USING (bucket_id = 'banners' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin gerenciamento categories" ON storage.objects FOR ALL USING (bucket_id = 'categories' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));
CREATE POLICY "Admin gerenciamento avatars" ON storage.objects FOR ALL USING (bucket_id = 'avatars' AND (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));

-- 5. Forçar atualização do Schema Cache do PostgREST
NOTIFY pgrst, 'reload schema';
