-- Migração Supabase local: 20260524000003_admin_profiles.sql
-- Implementa a tabela profiles, ativa RLS, cria triggers de auto-provisionamento e atualiza Custom Claims no auth.users.

-- 1. Criação da tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Ativar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar política de segurança restritiva (usuários autenticados lêem apenas o próprio perfil)
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. Função para auto-criação de perfil e injeção de Custom Claims no auth.users (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_flag BOOLEAN;
  user_role TEXT;
BEGIN
  -- Definir permissões para o administrador principal
  IF NEW.email = 'contatoluminarjoias@gmail.com' THEN
    is_admin_flag := TRUE;
    user_role := 'admin';
  ELSE
    is_admin_flag := FALSE;
    user_role := 'user';
  END IF;

  -- 4.1 Inserir perfil na tabela pública
  INSERT INTO public.profiles (id, email, is_admin, is_active, role)
  VALUES (
    NEW.id,
    NEW.email,
    is_admin_flag,
    TRUE,
    user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      is_admin = CASE WHEN public.profiles.email = 'contatoluminarjoias@gmail.com' THEN TRUE ELSE public.profiles.is_admin END,
      role = CASE WHEN public.profiles.email = 'contatoluminarjoias@gmail.com' THEN 'admin' ELSE public.profiles.role END;

  -- 4.2 Sincronizar Custom Claims no auth.users para máxima performance do Edge Runtime
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'is_admin', is_admin_flag,
      'is_active', TRUE,
      'role', user_role
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger na tabela auth.users para executar após inserção
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Processamento retroativo de usuários existentes no banco
-- Garante que nenhum usuário existente fique sem perfil correspondente e promove o admin
INSERT INTO public.profiles (id, email, is_admin, is_active, role)
SELECT 
  id, 
  email, 
  CASE WHEN email = 'contatoluminarjoias@gmail.com' THEN TRUE ELSE FALSE END,
  TRUE,
  CASE WHEN email = 'contatoluminarjoias@gmail.com' THEN 'admin' ELSE 'user' END
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    is_admin = CASE WHEN EXCLUDED.email = 'contatoluminarjoias@gmail.com' THEN TRUE ELSE public.profiles.is_admin END,
    role = CASE WHEN EXCLUDED.email = 'contatoluminarjoias@gmail.com' THEN 'admin' ELSE public.profiles.role END;

-- Sincronizar as Custom Claims dos usuários existentes para compatibilidade imediata no Edge
UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'is_admin', CASE WHEN email = 'contatoluminarjoias@gmail.com' THEN TRUE ELSE FALSE END,
    'is_active', TRUE,
    'role', CASE WHEN email = 'contatoluminarjoias@gmail.com' THEN 'admin' ELSE 'user' END
  );
