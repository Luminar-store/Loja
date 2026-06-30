import { NextResponse } from 'next/server';
import { createAdminClient, getAdminSessionUser } from '@/lib/supabase-server';
import { generateUniqueSlug } from '@/lib/slug';

/**
 * PUT /api/admin/products/[id]
 * Atualiza um produto existente.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Validar a sessão de admin
  const user = await getAdminSessionUser();
  if (!user) {
    console.warn('[AdminProductAPI] Tentativa não autorizada de atualizar produto');
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
  }

  // 2. Parse do payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  // 3. Executar atualização usando o cliente Admin
  const supabase = createAdminClient();

  // 3.1 Garantir a geração/atualização do slug (na edição completa, o body.slug ou body.name dita o slug)
  let slug = body.slug;
  if (!slug || slug.trim() === '') {
    if (body.name) {
      slug = await generateUniqueSlug(body.name, id);
    }
  } else {
    slug = await generateUniqueSlug(body.slug, id);
  }

  // 3.2 Parse de imagens para unificar a arquitetura
  const mediaList: { url: string; position: number; is_primary: boolean }[] = [];

  if (body.media && Array.isArray(body.media)) {
    body.media.forEach((item: any, index: number) => {
      mediaList.push({
        url: item.url,
        position: item.position ?? index,
        is_primary: !!item.is_primary
      });
    });
  } else {
    // Fallback de compatibilidade transparente
    if (body.image_url) {
      mediaList.push({
        url: body.image_url,
        position: 0,
        is_primary: true
      });
    }
    if (body.images && Array.isArray(body.images)) {
      body.images.forEach((img: string, idx: number) => {
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

  const fallbackPrimaryImg = mediaList.find(m => m.is_primary) || mediaList[0];
  const fallbackImageUrl = fallbackPrimaryImg ? fallbackPrimaryImg.url : null;
  const fallbackImages = mediaList.length > 0 ? mediaList.map(m => m.url) : null;

  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: body.name,
        slug: slug,
        description: body.description,
        price: body.price,
        promotional_price: body.promotional_price,
        stock: body.stock,
        status: body.status,
        category: body.category,
        material: body.material,
        weight: body.weight,
        width: body.width,
        height: body.height,
        image_url: fallbackImageUrl !== null ? fallbackImageUrl : undefined,
        images: fallbackImages !== null ? fallbackImages : undefined,
        is_featured: body.is_featured,
        is_made_to_order: body.is_made_to_order,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[AdminProductAPI] Erro no Supabase ao atualizar produto ${id}:`, error.message);
      return NextResponse.json({ error: `Erro no banco de dados: ${error.message}` }, { status: 500 });
    }

    // 4. Sincronizar imagens de forma atômica na tabela vinculada product_images
    // (a lógica de parsing de mediaList foi movida para cima para alimentar o fallback da tabela products)

    // Deleta os registros antigos de mídias do produto
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id);

    // Reinsere a lista de mídias atualizada
    if (mediaList.length > 0) {
      const imagesToInsert = mediaList.map(media => ({
        product_id: id,
        url: media.url,
        position: media.position,
        is_primary: media.is_primary
      }));

      const { error: mediaError } = await supabase
        .from('product_images')
        .insert(imagesToInsert);

      if (mediaError) {
        console.error(`[AdminProductAPI] Erro ao sincronizar mídias do produto ${id}:`, mediaError.message);
      }
    }

    console.info('[AdminProductAPI] Produto atualizado com sucesso por:', user.email, { productId: id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error(`[AdminProductAPI] Exceção ao atualizar produto ${id}:`, err.message);
    return NextResponse.json({ error: 'Erro interno ao processar a atualização.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Atualiza parcialmente um produto existente.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Validar a sessão de admin
  const user = await getAdminSessionUser();
  if (!user) {
    console.warn('[AdminProductAPI] Tentativa não autorizada de atualizar produto');
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
  }

  // 2. Parse do payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  // 3. Montar dados para atualização parcial (apenas campos definidos em body)
  const updateData: Record<string, any> = {};
  const allowedFields = [
    'name',
    'slug',
    'description',
    'price',
    'promotional_price',
    'stock',
    'status',
    'category',
    'material',
    'weight',
    'width',
    'height',
    'images', // mantém como fallback, mas Source of Truth é product_images
    'is_featured',
    'is_made_to_order',
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0 && !body.media && !body.image_url) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualização fornecido' }, { status: 400 });
  }

  // 3.1 Garantir slug na atualização parcial se o nome ou slug mudou
  if (updateData.slug) {
    if (updateData.slug.trim() === '') {
      // se veio slug em branco mas com name novo, usa o name novo ou falha
      if (updateData.name) {
        updateData.slug = await generateUniqueSlug(updateData.name, id);
      } else {
        // não tem como gerar um slug de algo não enviado, mantém o original no DB não mandando no updateData
        delete updateData.slug;
      }
    } else {
      updateData.slug = await generateUniqueSlug(updateData.slug, id);
    }
  } else if (updateData.name && !updateData.slug && body.slug === undefined) {
    // Se mudou o nome mas não mandou slug, pode ser que o usuário queira autogerar o slug.
    // Opcional: Para manter comportamento previsível de PATCH, se não mandar slug, não toca no slug.
    // Caso contrário: updateData.slug = await generateUniqueSlug(updateData.name, id);
  }

  // 3.2 Parsing de mídias para fallback na tabela products
  if (body.media && Array.isArray(body.media)) {
    const mediaList: { url: string; position: number; is_primary: boolean }[] = [];
    body.media.forEach((item: any, index: number) => {
      mediaList.push({
        url: item.url,
        position: item.position ?? index,
        is_primary: !!item.is_primary
      });
    });

    const fallbackPrimaryImg = mediaList.find(m => m.is_primary) || mediaList[0];
    if (fallbackPrimaryImg) {
      updateData.image_url = fallbackPrimaryImg.url;
    }
    if (mediaList.length > 0) {
      updateData.images = mediaList.map(m => m.url);
    }
  }

  // 4. Executar atualização usando o cliente Admin
  const supabase = createAdminClient();

  try {
    let data: any = null;
    
    if (Object.keys(updateData).length > 0) {
      const { data: updatedProd, error } = await supabase
        .from('products')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`[AdminProductAPI] Erro no Supabase ao atualizar produto parcialmente ${id}:`, error.message);
        return NextResponse.json({ error: `Erro no banco de dados: ${error.message}` }, { status: 500 });
      }
      data = updatedProd;
    }

    // Se vier mídias no PATCH, sincronizamos atômica na tabela product_images
    if (body.media && Array.isArray(body.media)) {
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id);

      const imagesToInsert = body.media.map((media: any, index: number) => ({
        product_id: id,
        url: media.url,
        position: media.position ?? index,
        is_primary: !!media.is_primary
      }));

      const { error: mediaError } = await supabase
        .from('product_images')
        .insert(imagesToInsert);

      if (mediaError) {
        console.error(`[AdminProductAPI] Erro no PATCH ao sincronizar mídias do produto ${id}:`, mediaError.message);
      }
    }

    console.info('[AdminProductAPI] Produto atualizado parcialmente por:', user.email, { productId: id });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error(`[AdminProductAPI] Exceção ao atualizar produto parcialmente ${id}:`, err.message);
    return NextResponse.json({ error: 'Erro interno ao processar a atualização parcial.' }, { status: 500 });
  }
}


/**
 * DELETE /api/admin/products/[id]
 * Remove um produto existente.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Validar a sessão de admin
  const user = await getAdminSessionUser();
  if (!user) {
    console.warn('[AdminProductAPI] Tentativa não autorizada de deletar produto');
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
  }

  // 2. Executar remoção usando o cliente Admin
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[AdminProductAPI] Erro no Supabase ao deletar produto ${id}:`, error.message);
      return NextResponse.json({ error: `Erro no banco de dados: ${error.message}` }, { status: 500 });
    }

    console.info('[AdminProductAPI] Produto deletado com sucesso por:', user.email, { productId: id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[AdminProductAPI] Exceção ao deletar produto ${id}:`, err.message);
    return NextResponse.json({ error: 'Erro interno ao processar a remoção.' }, { status: 500 });
  }
}
