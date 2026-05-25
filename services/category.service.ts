import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export const categoryService = {
  async listCategories(): Promise<Category[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela categories não existe ainda.');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (err: any) {
      console.error('Erro ao listar categorias:', err.message);
      return [];
    }
  },

  async createCategory(category: { name: string; slug: string }): Promise<Category | null> {
    const { data, error } = await (supabase as any)
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateCategory(id: string, updates: { name?: string; slug?: string }): Promise<Category | null> {
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
  }
};
