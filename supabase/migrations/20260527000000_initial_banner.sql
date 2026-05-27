-- Migração Supabase: 20260527000000_initial_banner.sql
-- Garante de forma idempotente e segura a estrutura correta da tabela public.banners e insere o banner inicial premium

-- 1. Garante que a tabela exista
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    desktop_image_url TEXT,
    mobile_image_url TEXT,
    link_url TEXT,
    button_text TEXT DEFAULT 'Ver Detalhes',
    position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hide_overlay BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Garante de forma idempotente a existência de todas as colunas necessárias caso a tabela já existisse com schema antigo
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS desktop_image_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Ver Detalhes';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS hide_overlay BOOLEAN DEFAULT false;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 3. Criação de índices de performance de forma idempotente
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active) WHERE is_active = true;

-- 4. Habilita RLS de forma idempotente
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 5. Configuração de políticas de segurança (Policies) de forma segura
DROP POLICY IF EXISTS "Banners visiveis publicamente" ON public.banners;
CREATE POLICY "Banners visiveis publicamente" ON public.banners 
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins podem gerenciar banners" ON public.banners;
CREATE POLICY "Admins podem gerenciar banners" ON public.banners 
    FOR ALL TO authenticated USING (public.is_admin() = true)
    WITH CHECK (public.is_admin() = true);

-- 6. Inserção do banner inicial de forma segura e idempotente, sem duplicar e sem apagar dados existentes
INSERT INTO public.banners (
    title,
    subtitle,
    desktop_image_url,
    mobile_image_url,
    link_url,
    button_text,
    position,
    is_active,
    hide_overlay
)
SELECT 
    'Elegância em cada detalhe. Produzido sob encomenda.',
    'Alta Joalheria Luminar',
    '/images/banner.webp',
    '/images/banner.webp',
    '/categoria',
    'Explorar Coleção',
    0,
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.banners WHERE title = 'Elegância em cada detalhe. Produzido sob encomenda.'
);
