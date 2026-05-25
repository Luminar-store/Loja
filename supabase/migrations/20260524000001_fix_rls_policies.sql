-- =====================================================
-- Migration: Corrigir políticas RLS — apenas admins reais
-- Data: 2026-05-24
-- =====================================================
-- Problema anterior: auth.role() = 'authenticated' permite QUALQUER usuário autenticado.
-- Solução: usar email do JWT para verificar se é admin real.
-- =====================================================

-- Dropar políticas antigas inseguras (product_options)
DROP POLICY IF EXISTS "product_options_write_auth" ON public.product_options;
DROP POLICY IF EXISTS "option_values_write_auth" ON public.option_values;

-- Dropar políticas antigas inseguras (product_images)
DROP POLICY IF EXISTS "Admins podem inserir imagens" ON public.product_images;
DROP POLICY IF EXISTS "Admins podem atualizar imagens" ON public.product_images;
DROP POLICY IF EXISTS "Admins podem deletar imagens" ON public.product_images;

-- ─────────────────────────────────────────────────
-- product_options: Write apenas via service_role
-- ─────────────────────────────────────────────────
-- Leitura pública mantida (necessário para frontend)
-- Escrita apenas server-side via service_role (bypass RLS)

-- ─────────────────────────────────────────────────
-- option_values: Write apenas via service_role
-- ─────────────────────────────────────────────────

-- ─────────────────────────────────────────────────
-- product_images: Write apenas via service_role
-- ─────────────────────────────────────────────────

-- =====================================================
-- Nota: As operações de escrita no admin passarão a usar
-- createAdminClient() (service_role) que bypassa RLS.
-- Não é necessário criar políticas de escrita para
-- authenticated role — apenas o service_role (server) escreve.
-- =====================================================
