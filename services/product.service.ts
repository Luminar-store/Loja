import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export const productService = {
  /**
   * listProducts: Retorna todos os produtos
   */
  async listProducts(): Promise<ProductRow[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (err: any) {
      console.error('Erro ao listar produtos:', err.message);
      throw err;
    }
  },

  /**
   * getProductById: Retorna as informações de um produto específico
   */
  async getProductById(id: string): Promise<ProductRow | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err: any) {
      console.error(`Erro ao obter produto ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * createProduct: Cria um novo produto de forma segura via backend API
   */
  async createProduct(product: ProductInsert): Promise<ProductRow | null> {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar produto via API');
      }

      return result.data;
    } catch (err: any) {
      console.error('Erro ao criar produto:', err.message);
      throw err;
    }
  },

  /**
   * updateProduct: Atualiza um produto existente de forma segura via backend API
   */
  async updateProduct(id: string, updates: ProductUpdate): Promise<ProductRow | null> {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar produto via API');
      }

      return result.data;
    } catch (err: any) {
      console.error(`Erro ao atualizar produto ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * deleteProduct: Remove um produto de forma segura via backend API
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar produto via API');
      }
    } catch (err: any) {
      console.error(`Erro ao deletar produto ${id}:`, err.message);
      throw err;
    }
  },
};
