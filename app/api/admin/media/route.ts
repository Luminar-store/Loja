import { NextResponse } from 'next/server';
import { createAdminClient, getAdminSessionUser } from '@/lib/supabase-server';

/**
 * GET /api/admin/media
 * Lista os arquivos de uma determinada pasta no Supabase Storage.
 * Protegido por sessão de administrador ativa.
 */
export async function GET(req: Request) {
  // 1. Validar a sessão de admin
  const user = await getAdminSessionUser();
  if (!user) {
    console.warn('[AdminMediaAPI] Tentativa não autorizada de listar mídia');
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 2. Parse da query string
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder') || 'products';

  // 3. Executar a listagem usando o cliente Admin (bypass RLS de Storage)
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase.storage
      .from('products')
      .list(folder, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`[AdminMediaAPI] Erro ao listar pasta ${folder}:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Filtrar e mapear os arquivos gerando URLs públicas seguras
    const files = (data || [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const filePath = `${folder}/${f.name}`;
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        return {
          name: f.name,
          path: filePath,
          url: urlData.publicUrl,
          id: f.id,
          created_at: f.created_at,
          metadata: f.metadata
        };
      });

    return NextResponse.json({ success: true, files });
  } catch (err: any) {
    console.error('[AdminMediaAPI] Exceção ao listar mídias:', err.message);
    return NextResponse.json({ error: 'Erro interno ao processar a listagem de mídias.' }, { status: 500 });
  }
}
