import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * Cria um cliente Supabase com service_role key para uso exclusivo server-side.
 * Bypassa RLS — usar APENAS em API routes e Server Components confiáveis.
 * NUNCA exportar este cliente para o browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Recupera o usuário autenticado da sessão atual de forma segura via cookies do servidor.
 * Retorna null se não houver sessão ativa.
 */
export async function getAdminSessionUser() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[AuthServer] Supabase URL ou Anon Key não configurados');
    return null;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar erros caso os cookies não possam ser modificados (ex: requisições GET)
          }
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Defesa em Profundidade Server-Side:
    // Consultar a tabela 'profiles' para validar se o usuário é administrador ativo.
    // Usamos createAdminClient() com privilégios de service_role para ler de forma confiável e independente de RLS.
    const adminDb = createAdminClient();
    const { data: profile, error: profileError } = await adminDb
      .from('profiles')
      .select('is_admin, is_active, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn(`[getAdminSessionUser] Acesso administrativo negado. Perfil não encontrado para: ${user.email}`);
      return null;
    }

    // Validar flags de segurança (is_admin, is_active e role) para expansão futura
    if (!profile.is_admin || !profile.is_active || profile.role !== 'admin') {
      console.warn(
        `[getAdminSessionUser] Acesso negado para ${user.email}. Motivo: is_admin=${profile.is_admin}, is_active=${profile.is_active}, role=${profile.role}`
      );
      return null;
    }

    return user;
  } catch (err) {
    console.error('[AuthServer] Erro ao obter usuário da sessão:', err);
    return null;
  }
}

