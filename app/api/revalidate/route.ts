import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminSessionUser } from '@/lib/supabase-server';

/**
 * POST /api/revalidate
 * Protege o gatilho de revalidação estática do Next.js 15 contra abusos de DoS.
 * Permite acesso apenas com token secreto x-revalidate-secret OU com sessão admin ativa.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');

    if (!tag) {
      return NextResponse.json({ error: 'A tag é obrigatória' }, { status: 400 });
    }

    // 1. Defesa 1: Validação do token secreto pelo cabeçalho
    const tokenHeader = request.headers.get('x-revalidate-secret');
    const secretKey = process.env.REVALIDATE_SECRET;

    const isTokenValid = secretKey && tokenHeader === secretKey;

    // 2. Defesa 2: Validação via sessão de Administrador (para chamadas client-side do painel)
    let isSessionValid = false;
    if (!isTokenValid) {
      const user = await getAdminSessionUser();
      isSessionValid = !!user;
    }

    // Se nenhuma das defesas for satisfeita, nega o acesso de imediato
    if (!isTokenValid && !isSessionValid) {
      console.warn('[RevalidateAPI] Tentativa não autorizada de revalidação de tag:', tag);
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    // Executa a revalidação estática sob demanda no Next.js
    revalidateTag(tag);
    
    console.info('[RevalidateAPI] Tag revalidada com sucesso:', tag);
    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  } catch (err: any) {
    console.error('[RevalidateAPI] Exceção ao revalidar:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
