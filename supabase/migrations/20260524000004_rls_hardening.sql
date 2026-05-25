-- Migração Supabase local: 20260524000004_rls_hardening.sql
-- Endurece políticas RLS de tabelas críticas para eliminar riscos de Privilege Escalation e manipulação indevida de dados por usuários autenticados comuns.

-- 1. Remover política de UPDATE da tabela profiles que permitia auto-promoção / Privilege Escalation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Criar helper public.is_admin() no banco de dados para ler as Custom Claims de alta performance de forma Edge-friendly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text)::boolean,
      FALSE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Blindar tabela product_options
DROP POLICY IF EXISTS "Authenticated users can delete product options" ON public.product_options;
DROP POLICY IF EXISTS "Authenticated users can update product options" ON public.product_options;
DROP POLICY IF EXISTS "Authenticated users can insert product options" ON public.product_options;

CREATE POLICY "Admin can delete product options" ON public.product_options 
  FOR DELETE TO authenticated USING (public.is_admin() = true);
CREATE POLICY "Admin can update product options" ON public.product_options 
  FOR UPDATE TO authenticated USING (public.is_admin() = true) WITH CHECK (public.is_admin() = true);
CREATE POLICY "Admin can insert product options" ON public.product_options 
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() = true);

-- 4. Blindar tabela option_values
DROP POLICY IF EXISTS "Authenticated users can delete option values" ON public.option_values;
DROP POLICY IF EXISTS "Authenticated users can update option values" ON public.option_values;
DROP POLICY IF EXISTS "Authenticated users can insert option values" ON public.option_values;

CREATE POLICY "Admin can delete option values" ON public.option_values 
  FOR DELETE TO authenticated USING (public.is_admin() = true);
CREATE POLICY "Admin can update option values" ON public.option_values 
  FOR UPDATE TO authenticated USING (public.is_admin() = true) WITH CHECK (public.is_admin() = true);
CREATE POLICY "Admin can insert option values" ON public.option_values 
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() = true);
