import { createAdminClient } from '@/lib/supabase-server';

/**
 * Normaliza e gera um slug a partir de uma string.
 * Remove acentos, caracteres especiais e converte espaços em hifens.
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Separa os acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hifens
    .replace(/[^\w-]+/g, '') // Remove caracteres não alfanuméricos exceto hifens
    .replace(/--+/g, '-'); // Remove hifens múltiplos consecutivos
}

/**
 * Gera um slug único no banco de dados para a tabela de produtos.
 */
export async function generateUniqueSlug(baseText: string, currentProductId?: string): Promise<string> {
  const baseSlug = generateSlug(baseText);
  let uniqueSlug = baseSlug;
  let counter = 1;
  let isUnique = false;

  const supabase = createAdminClient();

  while (!isUnique) {
    let query = supabase.from('products').select('id').eq('slug', uniqueSlug);
    
    // Se estiver atualizando um produto, exclui o próprio produto da verificação
    if (currentProductId) {
      query = query.neq('id', currentProductId);
    }

    const { data: existingProduct, error } = await query.maybeSingle();

    if (error) {
      console.error('[SlugGenerator] Erro ao verificar unicidade do slug:', error.message);
      throw new Error('Falha ao verificar unicidade do slug');
    }

    if (existingProduct) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    } else {
      isUnique = true;
    }
  }

  return uniqueSlug;
}
