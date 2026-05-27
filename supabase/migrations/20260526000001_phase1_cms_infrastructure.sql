-- Migração Supabase: 20260526000001_phase1_cms_infrastructure.sql
-- Fase 1 da Transição CMS da Luminar: Tabelas, Índices, RLS e Remoção da coluna image_url obsoleta

-- 1. Remoção da coluna física image_url na tabela products (Conforme exigência de P0 de manter product_images como Source of Truth)
ALTER TABLE public.products DROP COLUMN IF EXISTS image_url;

-- 2. Alteração e adequação do status de produtos com CHECK constraint (draft, active, hidden, archived)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS check_product_status;
ALTER TABLE public.products ADD CONSTRAINT check_product_status CHECK (status IN ('draft', 'active', 'hidden', 'archived'));

-- 3. Criação da tabela de banners com suporte a imagens duais (Desktop e Mobile)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    desktop_image_url TEXT NOT NULL, -- Otimizado para telas de alta resolução
    mobile_image_url TEXT NOT NULL,  -- Otimizado para dispositivos móveis
    link_url TEXT,
    button_text TEXT DEFAULT 'Ver Detalhes',
    position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Criação da tabela settings operando como KV Store estruturado
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    type TEXT DEFAULT 'string', -- 'string', 'boolean', 'json', 'number'
    "group" TEXT DEFAULT 'general', -- 'general', 'whatsapp', 'shipping', 'seo'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Criação da tabela storefront_sections para gerenciar o construtor dinâmico da Home
CREATE TABLE IF NOT EXISTS public.storefront_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_key TEXT UNIQUE NOT NULL, -- ex: 'hero', 'benefits', 'featured', 'categories', 'cta'
    position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    payload JSONB DEFAULT '{}'::jsonb, -- Configurações de títulos e limites no JSONB
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Adição de colunas na tabela categories para metatags SEO, destaque e ordenação
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;

-- 7. Criação de índices de performance para consultas reativas e junções otimizadas (ISR e joins)
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON public.product_images(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_storefront_sections_is_active ON public.storefront_sections(is_active) WHERE is_active = true;

-- 8. Habilitar RLS (Row Level Security) nas novas tabelas
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_sections ENABLE ROW LEVEL SECURITY;

-- 9. Setup de Políticas RLS para as novas tabelas

-- A. Banners: Leitura pública e escrita exclusiva para administradores
DROP POLICY IF EXISTS "Banners visiveis publicamente" ON public.banners;
CREATE POLICY "Banners visiveis publicamente" ON public.banners 
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins podem gerenciar banners" ON public.banners;
CREATE POLICY "Admins podem gerenciar banners" ON public.banners 
    FOR ALL TO authenticated USING (public.is_admin() = true)
    WITH CHECK (public.is_admin() = true);

-- B. Settings: Leitura pública e escrita exclusiva para administradores
DROP POLICY IF EXISTS "Settings visiveis publicamente" ON public.settings;
CREATE POLICY "Settings visiveis publicamente" ON public.settings 
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins podem gerenciar settings" ON public.settings;
CREATE POLICY "Admins podem gerenciar settings" ON public.settings 
    FOR ALL TO authenticated USING (public.is_admin() = true)
    WITH CHECK (public.is_admin() = true);

-- C. Storefront Sections: Leitura pública e escrita exclusiva para administradores
DROP POLICY IF EXISTS "Seções visiveis publicamente" ON public.storefront_sections;
CREATE POLICY "Seções visiveis publicamente" ON public.storefront_sections 
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins podem gerenciar seções" ON public.storefront_sections;
CREATE POLICY "Admins podem gerenciar seções" ON public.storefront_sections 
    FOR ALL TO authenticated USING (public.is_admin() = true)
    WITH CHECK (public.is_admin() = true);
