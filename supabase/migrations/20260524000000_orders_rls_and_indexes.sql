-- =====================================================
-- Migration: RLS e Segurança da tabela orders
-- Data: 2026-05-24
-- =====================================================

-- 1. Habilitar RLS na tabela orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Bloquear acesso público total (deny by default)
-- Nenhuma política = acesso negado para todos os roles exceto service_role
-- service_role bypassa RLS automaticamente

-- 3. Admins autenticados podem ler e atualizar pedidos
CREATE POLICY "orders_admin_select" ON public.orders
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 4. INSERT e DELETE apenas via service_role (rotas de API server-side)
-- Nenhuma policy de INSERT/DELETE = apenas service_role pode executar

-- =====================================================
-- Migration: Campo paid_at na tabela orders
-- =====================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- =====================================================
-- Migration: Índices de performance
-- =====================================================

-- Índice para busca por order_nsu (webhook + rastreio)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_nsu
  ON public.orders(order_nsu)
  WHERE order_nsu IS NOT NULL;

-- Índice para busca por status de pagamento (admin)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON public.orders(payment_status);

-- Índice para busca por status operacional (admin)
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders(status);

-- Índice para listagem por data (admin — mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders(created_at DESC);

-- Índice para busca por email do cliente (admin CRM)
CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON public.orders(customer_email);

-- =====================================================
-- Migration: Índices em product_options
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_options_product_id
  ON public.product_options(product_id);

CREATE INDEX IF NOT EXISTS idx_option_values_option_id
  ON public.option_values(option_id);

-- =====================================================
-- Migration: Índices em products
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_status
  ON public.products(status);

CREATE INDEX IF NOT EXISTS idx_products_is_featured
  ON public.products(is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_products_category
  ON public.products(category);
