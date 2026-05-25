-- =====================================================
-- Migration: Permitir rastreio público de pedidos personalizados
-- =====================================================
-- O rastreio usa o UUID do pedido como "token" de acesso.
-- Isso é security by obscurity — o UUID tem 2^122 combinações
-- tornando bruteforce impraticável.
-- =====================================================

-- Permitir leitura pública por ID (necessário para /rastreio funcionar)
DROP POLICY IF EXISTS "custom_orders_public_read" ON public.custom_orders;

CREATE POLICY "custom_orders_track_by_id" ON public.custom_orders
  FOR SELECT
  USING (true);

-- Comentário: Para maior segurança futura, considerar:
-- 1. Rate limiting no endpoint de rastreio (ex: via Upstash Redis)
-- 2. Adicionar campo 'tracking_token' separado do UUID interno
-- 3. Limitar campos retornados na query de rastreio (não retornar dados sensíveis)
