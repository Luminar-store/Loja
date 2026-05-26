-- Migração Supabase local: 20260526000000_storage_and_products_image_url.sql
-- Adiciona a coluna image_url à tabela products e configura os buckets e RLS do Storage.

-- 1. Adicionar coluna image_url à tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Criar ou atualizar os buckets de storage públicos no Supabase
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('categories', 'categories', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Habilitar leitura pública para todos os buckets
DROP POLICY IF EXISTS "Allow public select on objects" ON storage.objects;
CREATE POLICY "Allow public select on objects" ON storage.objects
  FOR SELECT TO public USING (true);

-- 4. Permissões de escrita, atualização e exclusão restritas a administradores autenticados
DROP POLICY IF EXISTS "Admin write policy" ON storage.objects;
CREATE POLICY "Admin write policy" ON storage.objects
  FOR INSERT TO authenticated 
  WITH CHECK (
    (bucket_id IN ('products', 'categories', 'banners', 'avatars')) 
    AND (public.is_admin() = true)
  );

DROP POLICY IF EXISTS "Admin update policy" ON storage.objects;
CREATE POLICY "Admin update policy" ON storage.objects
  FOR UPDATE TO authenticated 
  USING (
    (bucket_id IN ('products', 'categories', 'banners', 'avatars')) 
    AND (public.is_admin() = true)
  )
  WITH CHECK (
    (bucket_id IN ('products', 'categories', 'banners', 'avatars')) 
    AND (public.is_admin() = true)
  );

DROP POLICY IF EXISTS "Admin delete policy" ON storage.objects;
CREATE POLICY "Admin delete policy" ON storage.objects
  FOR DELETE TO authenticated 
  USING (
    (bucket_id IN ('products', 'categories', 'banners', 'avatars')) 
    AND (public.is_admin() = true)
  );
