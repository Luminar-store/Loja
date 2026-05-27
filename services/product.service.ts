import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export const productService = {
  /**
   * listProducts: Retorna todos os produtos ativos com join transparente na tabela product_images
   * Obtém a imagem destaque via is_primary = true e ordena a galeria por position.
   */
  async listProducts(): Promise<ProductRow[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            url,
            position,
            is_primary
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Se a coluna/tabela product_images não existir no banco na nuvem ainda,
        // executa um fallback dinâmico transparente sem join para não quebrar o build
        if (error.code === '42P01' || error.message.includes('product_images') || error.message.includes('column')) {
          console.warn('Tabela product_images ou coluna url inexistente na nuvem. Executando fallback de compatibilidade.');
          return this.listProductsFallback();
        }
        throw new Error(error.message);
      }

      // Mapeamento de compatibilidade reativa (desacopla image_url e images da tabela products física)
      return (data || []).map(prod => {
        const imgs = (prod as any).product_images || [];
        const sortedImgs = [...imgs].sort((a, b) => a.position - b.position);
        const primaryImg = sortedImgs.find(img => img.is_primary) || sortedImgs[0];

        return {
          ...prod,
          image_url: primaryImg ? primaryImg.url : null,
          images: sortedImgs.map(img => img.url)
        } as ProductRow;
      });
    } catch (err: any) {
      console.error('Erro ao listar produtos:', err.message);
      throw err;
    }
  },

  /**
   * listProductsFallback: Fallback de segurança para listar produtos sem join
   */
  async listProductsFallback(): Promise<ProductRow[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(prod => ({
        ...prod,
        image_url: (prod as any).image_url || null,
        images: (prod as any).images || []
      } as ProductRow));
    } catch (err: any) {
      console.error('Erro no fallback de listagem:', err.message);
      return [];
    }
  },

  /**
   * getProductById: Retorna as informações de um produto específico com sua galeria de product_images
   */
  async getProductById(id: string): Promise<ProductRow | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            url,
            position,
            is_primary
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === '42P01' || error.message.includes('product_images') || error.message.includes('column')) {
          console.warn(`Tabela product_images inexistente ao buscar produto ${id}. Usando fallback.`);
          return this.getProductByIdFallback(id);
        }
        throw new Error(error.message);
      }

      if (!data) return null;

      const imgs = (data as any).product_images || [];
      const sortedImgs = [...imgs].sort((a, b) => a.position - b.position);
      const primaryImg = sortedImgs.find(img => img.is_primary) || sortedImgs[0];

      return {
        ...data,
        image_url: primaryImg ? primaryImg.url : null,
        images: sortedImgs.map(img => img.url)
      } as ProductRow;
    } catch (err: any) {
      console.error(`Erro ao obter produto ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * getProductByIdFallback: Fallback de segurança para obter produto por ID sem join
   */
  async getProductByIdFallback(id: string): Promise<ProductRow | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) return null;

      return {
        ...data,
        image_url: (data as any).image_url || null,
        images: (data as any).images || []
      } as ProductRow;
    } catch (err: any) {
      console.error(`Erro no fallback de produto ${id}:`, err.message);
      return null;
    }
  },

  /**
   * createProduct: Cria um novo produto de forma segura via backend API e limpa o cache
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

      // Aciona revalidação do cache estático para atualizar a loja imediatamente
      if (result.data?.id) {
        await this.triggerRevalidation(result.data.id);
      }

      return result.data;
    } catch (err: any) {
      console.error('Erro ao criar produto:', err.message);
      throw err;
    }
  },

  /**
   * updateProduct: Atualiza um produto existente de forma segura via backend API e limpa o cache
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

      // Invalida o cache sob demanda para este produto e para a storefront
      await this.triggerRevalidation(id);

      return result.data;
    } catch (err: any) {
      console.error(`Erro ao atualizar produto ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * deleteProduct: Remove um produto de forma segura via backend API e limpa o cache
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

      await this.triggerRevalidation(id);
    } catch (err: any) {
      console.error(`Erro ao deletar produto ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * listFeaturedProducts: Retorna apenas produtos em destaque e ativos limitados.
   * Totalmente otimizado no Supabase para evitar overfetching e economizar TTFB.
   */
  async listFeaturedProducts(limit: number = 4): Promise<ProductRow[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            url,
            position,
            is_primary
          )
        `)
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === '42P01' || error.message.includes('product_images') || error.message.includes('column')) {
          console.warn('Fallback ativado no listFeaturedProducts por tabela inexistente.');
          return this.listProductsFallback();
        }
        throw new Error(error.message);
      }

      return (data || []).map(prod => {
        const imgs = (prod as any).product_images || [];
        const sortedImgs = [...imgs].sort((a, b) => a.position - b.position);
        const primaryImg = sortedImgs.find(img => img.is_primary) || sortedImgs[0];

        return {
          ...prod,
          image_url: primaryImg ? primaryImg.url : null,
          images: sortedImgs.map(img => img.url)
        } as ProductRow;
      });
    } catch (err: any) {
      console.error('Erro ao listar produtos destacados:', err.message);
      return [];
    }
  },

  /**
   * triggerRevalidation: Dispara a invalidação de cache do Next.js 15 sob demanda
   */
  async triggerRevalidation(id?: string) {
    try {
      if (typeof window === 'undefined') {
        const { revalidateTag } = require('next/cache');
        revalidateTag('storefront');
        if (id) {
          revalidateTag(`product-${id}`);
        }
      } else {
        await fetch('/api/revalidate?tag=storefront', { method: 'POST' }).catch(() => {});
        if (id) {
          await fetch(`/api/revalidate?tag=product-${id}`, { method: 'POST' }).catch(() => {});
        }
      }
    } catch (err) {
      // Ignora fora do Next Server
    }
  }
};
