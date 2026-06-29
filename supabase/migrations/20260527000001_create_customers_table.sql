-- MIGRATION: Criação e configuração completa da tabela customers
-- Aplicar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    email text NOT NULL UNIQUE,
    name text,
    total_spent numeric DEFAULT 0 NOT NULL,
    orders_count integer DEFAULT 0 NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para customers
-- Admins (profiles com is_admin = true) podem gerenciar
CREATE POLICY "Admins podem gerenciar customers" ON public.customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Serviço anônimo / webhook pode inserir clientes novos via API route
CREATE POLICY "Service role pode inserir customers" ON public.customers
    FOR INSERT
    WITH CHECK (true);

-- Criar índices de performance
CREATE INDEX IF NOT EXISTS customers_email_idx ON public.customers (email);

-- Forçar atualização do Schema Cache do PostgREST
NOTIFY pgrst, 'reload schema';
