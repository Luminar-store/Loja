-- MIGRATION FINAL GARANTIDA: Sincronização completa de colunas e Storage
-- Executar no SQL Editor do Supabase

-- 1. Garantir que todas as colunas de 'products' existam exatamente como no TypeScript
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promotional_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_made_to_order boolean DEFAULT false;

-- 2. Garantir que todas as colunas de 'product_images' existam
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id);
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- 3. Garantir Buckets de Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('products', 'products', true),
  ('banners', 'banners', true),
  ('categories', 'categories', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Criar políticas do Storage SOMENTE se não existirem (usando bloco anonimo)
DO $$
BEGIN
    -- Public Read
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública products') THEN
        CREATE POLICY "Leitura pública products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública banners') THEN
        CREATE POLICY "Leitura pública banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública categories') THEN
        CREATE POLICY "Leitura pública categories" ON storage.objects FOR SELECT USING (bucket_id = 'categories');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública avatars') THEN
        CREATE POLICY "Leitura pública avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    END IF;
END $$;

-- 5. Atualizar o cache de schema (MUITO IMPORTANTE)
NOTIFY pgrst, 'reload schema';
