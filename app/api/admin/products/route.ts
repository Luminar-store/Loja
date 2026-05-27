import { NextResponse } from 'next/server';
import { createAdminClient, getAdminSessionUser } from '@/lib/supabase-server';

/**
 * POST /api/admin/products
 * Cria um novo produto de forma segura no servidor.
 * Protegido por autenticação de administrador baseada em cookies.
 */
export async function POST(req: Request) {
  // 1. Validar a sessão de admin
  const user = await getAdminSessionUser();
  if (!user) {
    console.warn('[AdminProductAPI] Tentativa não autorizada de criar produto');
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 2. Parse do payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  // 3. Validação simples server-side (garantir campos essenciais)
  if (!body.name || typeof body.price !== 'number') {
    return NextResponse.json(
      { error: 'Nome do produto e preço numérico são obrigatórios.' },
      { status: 400 }
    );
  }

  // 4. Executar inserção usando o cliente Admin (bypass RLS)
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: body.name,
          slug: body.slug || null,
          description: body.description || null,
          price: body.price,
          promotional_price: body.promotional_price ?? null,
          stock: body.stock ?? 0,
          status: body.status || 'draft', // Usa o status padrão draft da Fase 2
          category: body.category || null,
          material: body.material || null,
          weight: body.weight ?? null,
          width: body.width ?? null,
          height: body.height ?? null,
          images: body.images || null, // mantém como fallback, mas a Source of Truth é product_images
          is_featured: !!body.is_featured,
          is_made_to_order: !!body.is_made_to_order,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[AdminProductAPI] Erro no Supabase ao criar produto:', error.message);
      return NextResponse.json({ error: `Erro no banco de dados: ${error.message}` }, { status: 500 });
    }

    // 5. Inserir imagens na tabela profissional product_images
    const mediaList: { url: string; position: number; is_primary: boolean }[] = [];

    if (body.media && Array.isArray(body.media)) {
      // Formato Profissional CMS-driven
      body.media.forEach((item: any, index: number) => {
        mediaList.push({
          url: item.url,
          position: item.position ?? index,
          is_primary: !!item.is_primary
        });
      });
    } else {
      // Fallback de compatibilidade transparente para payloads legados
      if (body.image_url) {
        mediaList.push({
          url: body.image_url,
          position: 0,
          is_primary: true
        });
      }
      if (body.images && Array.isArray(body.images)) {
        body.images.forEach((img: string, idx: number) => {
          // Evita duplicar a imagem principal
          if (img !== body.image_url) {
            mediaList.push({
              url: img,
              position: idx + 1,
              is_primary: false
            });
          }
        });
      }
    }

    if (mediaList.length > 0) {
      const imagesToInsert = mediaList.map(media => ({
        product_id: data.id,
        url: media.url,
        position: media.position,
        is_primary: media.is_primary
      }));

      const { error: mediaError } = await supabase
        .from('product_images')
        .insert(imagesToInsert);

      if (mediaError) {
        console.error('[AdminProductAPI] Erro ao salvar mídias vinculadas:', mediaError.message);
        // Não falha a criação do produto inteiro, mas loga o aviso
      }
    }

    console.info('[AdminProductAPI] Produto criado com sucesso por:', user.email, { productId: data.id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[AdminProductAPI] Exceção ao criar produto:', err.message);
    return NextResponse.json({ error: 'Erro interno ao processar a criação do produto.' }, { status: 500 });
  }
}
