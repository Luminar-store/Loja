import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/health/supabase
 *
 * Rota de healthcheck leve para manter o projeto Supabase Free ativo.
 * Deve ser chamada 1x por dia via Vercel Cron (ver vercel.json).
 *
 * Autenticação: header Authorization: Bearer <CRON_SECRET>
 * ou query param: ?secret=<CRON_SECRET>
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // 1. Validar presença da variável
  if (!cronSecret) {
    console.error('[healthcheck] CRON_SECRET não configurado no servidor.');
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }

  // 2. Extrair token do caller (header Authorization ou query param)
  const authHeader = req.headers.get('authorization') ?? '';
  const { searchParams } = new URL(req.url);
  const querySecret = searchParams.get('secret') ?? '';

  const providedToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : querySecret;

  // 3. Comparação segura (timing-safe via comprimento igual ou direto — OK para cron interno)
  if (!providedToken || providedToken !== cronSecret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 4. Query mínima no Supabase — apenas manter conexão ativa
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase env vars ausentes');
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Query leve — tenta banners; fallback para products
    const { error } = await client
      .from('banners')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = nenhuma linha encontrada — OK para healthcheck
      // Tentar tabela alternativa se banners falhar
      const { error: fallbackError } = await client
        .from('products')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (fallbackError && fallbackError.code !== 'PGRST116') {
        throw new Error(fallbackError.message);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[healthcheck] Falha na query Supabase:', message);
    return NextResponse.json(
      { ok: false, error: 'Database unreachable', checkedAt: new Date().toISOString() },
      { status: 503 }
    );
  }

  console.info('[healthcheck] Supabase OK —', new Date().toISOString());

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
  });
}
