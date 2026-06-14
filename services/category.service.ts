import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  is_active?: boolean;
  position?: number | null;
  created_at?: string;
}

export const categoryService = {
  /**
   * listCategories: Retorna categorias ativas ordenadas por position ASC.
   * Funciona mesmo se os campos is_active/position não existirem na tabela.
   */
  async listCategories(): Promise<Category[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('categories')
        .select('id, name, slug, image_url, is_active, position, created_at')
        .order('name', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          // Tabela ainda não existe
          console.warn('[categoryService] Tabela categories não existe ainda.');
          return [];
        }
        throw error;
      }

      const rows: Category[] = data ?? [];

      // Filtrar apenas ativas (se o campo existir na resposta)
      const active = rows.filter(
        (c) => c.is_active === undefined || c.is_active === null || c.is_active === true
      );

      // Ordenar por position ASC (se existir), depois por name
      active.sort((a, b) => {
        const posA = a.position ?? 9999;
        const posB = b.position ?? 9999;
        if (posA !== posB) return posA - posB;
        return a.name.localeCompare(b.name, 'pt-BR');
      });

      return active;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[categoryService] Erro ao listar categorias:', message);
      return [];
    }
  },

  async createCategory(category: {
    name: string;
    slug: string;
    image_url?: string | null;
  }): Promise<Category | null> {
    const { data, error } = await (supabase as any)
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateCategory(
    id: string,
    updates: { name?: string; slug?: string; image_url?: string | null }
  ): Promise<Category | null> {
    const { data, error } = await (supabase as any)
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};
