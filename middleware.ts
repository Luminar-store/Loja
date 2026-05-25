import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware server-side para proteção das rotas admin.
 * Verifica a sessão do Supabase e as flags de administrador ANTES de renderizar
 * qualquer página admin ou processar qualquer chamada de API admin.
 * Isso impede acesso direto via curl, bots e browsers sem JavaScript.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Interceptar rotas de páginas admin (excluindo a página de login) e rotas de API do admin
  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Criar cliente Supabase com SSR para ler cookies da sessão de forma Edge-friendly
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Verificar sessão ativa de forma segura
  const { data: { session } } = await supabase.auth.getSession();

  // Caso 1: Usuário NÃO autenticado
  if (!session) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Caso 2: Usuário autenticado -> Verificar se possui permissão de administrador ativo
  const appMetadata = session.user.app_metadata || {};
  let isAuthorized = false;

  // Método A: Validar localmente através de Custom Claims JWT (Zero chamadas de rede / Máxima Performance)
  if (
    appMetadata.is_admin === true &&
    appMetadata.is_active === true &&
    appMetadata.role === 'admin'
  ) {
    isAuthorized = true;
  } else {
    // Método B: Fallback seguro via banco de dados (apenas se as claims locais ainda não foram atualizadas)
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin, is_active, role')
        .eq('id', session.user.id)
        .single();

      if (
        !error &&
        profile &&
        profile.is_admin === true &&
        profile.is_active === true &&
        profile.role === 'admin'
      ) {
        isAuthorized = true;
      }
    } catch (err) {
      console.error('[Middleware] Erro ao verificar autorização via banco de dados:', err);
    }
  }

  // Se o usuário não for administrador autorizado, negar acesso imediatamente
  if (!isAuthorized) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: 'Acesso proibido: Permissão administrativa negada' },
        { status: 403 }
      );
    }
    // Redireciona usuários autenticados comuns para a home principal com bloqueio total
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Proteger todas as rotas de páginas administrativas e APIs de administração
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
