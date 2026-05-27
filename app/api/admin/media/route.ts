import { NextResponse } from 'next/server';
import { createAdminClient, getAdminSessionUser } from '@/lib/supabase-server';

/**
 * GET /api/admin/media
 * Lista os arquivos do bucket público 'products' no Supabase Storage,
 * varrendo de forma recursiva/dinâmica todas as subpastas e categorias reais.
 * Protegido por sessão de administrador ativa.
 */
export async function GET(req: Request) {
  // 1. Validar a sessão de admin
  const user = await getAdminSessionUser();
  if (!user) {
    console.warn('[AdminMediaAPI] Tentativa não autorizada de listar mídia');
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 2. Executar a listagem usando o cliente Admin (bypass RLS de Storage)
  const supabase = createAdminClient();
  const imageExtensions = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'avif'];

  try {
    // A. Listar itens na raiz do bucket 'products'
    const { data: rootItems, error: rootError } = await supabase.storage
      .from('products')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (rootError) {
      console.error('[AdminMediaAPI] Erro ao listar raiz do bucket products:', rootError.message);
      return NextResponse.json({ error: rootError.message }, { status: 500 });
    }

    const allFiles: any[] = [];

    // B. Mapear pastas e arquivos na raiz
    // Pastas reais retornadas pela listagem do Supabase têm id como null ou metadata indefinido.
    const folders = (rootItems || []).filter(
      item => !item.id || item.metadata === null || !item.metadata
    );
    const rootFiles = (rootItems || []).filter(
      item => item.id && item.metadata !== null
    );

    // C. Processar arquivos soltos na raiz (se houver)
    rootFiles.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && imageExtensions.includes(ext) && file.name !== '.emptyFolderPlaceholder') {
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(file.name);

        allFiles.push({
          name: file.name,
          path: file.name,
          url: urlData.publicUrl,
          folder: 'raiz',
          created_at: file.created_at
        });
      }
    });

    // D. Listar e mapear arquivos de cada subpasta real encontrada no bucket (ex: aneis, brincos, etc.)
    for (const folderItem of folders) {
      const folderName = folderItem.name;
      if (folderName === '.emptyFolderPlaceholder') continue;

      const { data: folderContents, error: folderError } = await supabase.storage
        .from('products')
        .list(folderName, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (folderError) {
        console.warn(`[AdminMediaAPI] Erro ao listar subpasta ${folderName}:`, folderError.message);
        continue; // não quebra a API inteira se uma subpasta falhar
      }

      (folderContents || []).forEach(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext && imageExtensions.includes(ext) && file.name !== '.emptyFolderPlaceholder') {
          const filePath = `${folderName}/${file.name}`;
          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          allFiles.push({
            name: file.name,
            path: filePath,
            url: urlData.publicUrl,
            folder: folderName,
            created_at: file.created_at
          });
        }
      });
    }

    return NextResponse.json({ success: true, files: allFiles });
  } catch (err: any) {
    console.error('[AdminMediaAPI] Exceção ao listar mídias:', err.message);
    return NextResponse.json({ error: 'Erro interno ao processar a listagem de mídias.' }, { status: 500 });
  }
}
