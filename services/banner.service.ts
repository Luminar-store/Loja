import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type BannerRow = Database['public']['Tables']['banners']['Row'];
export type BannerInsert = Database['public']['Tables']['banners']['Insert'];
export type BannerUpdate = Database['public']['Tables']['banners']['Update'];

export const bannerService = {
  /**
   * listBanners: Retorna todos os banners cadastrados
   * Permite filtrar apenas ativos (ideal para storefront) ou trazer todos (para admin)
   */
  async listBanners(onlyActive: boolean = false): Promise<BannerRow[]> {
    try {
      let query = supabase
        .from('banners')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (err: any) {
      console.error('Erro ao listar banners:', err.message);
      return [];
    }
  },

  /**
   * getBannerById: Retorna as informações de um banner específico
   */
  async getBannerById(id: string): Promise<BannerRow | null> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err: any) {
      console.error(`Erro ao obter banner ${id}:`, err.message);
      return null;
    }
  },

  /**
   * createBanner: Cria um novo banner
   */
  async createBanner(banner: BannerInsert): Promise<BannerRow | null> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .insert([banner])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Ao alterar banners, notificamos que o cache da storefront deve ser limpo na Vercel/Next
      await this.triggerRevalidation();

      return data;
    } catch (err: any) {
      console.error('Erro ao criar banner:', err.message);
      throw err;
    }
  },

  /**
   * updateBanner: Atualiza um banner existente
   */
  async updateBanner(id: string, updates: BannerUpdate): Promise<BannerRow | null> {
    try {
      const { data, error } = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await this.triggerRevalidation();

      return data;
    } catch (err: any) {
      console.error(`Erro ao atualizar banner ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * deleteBanner: Remove um banner do Supabase
   */
  async deleteBanner(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      await this.triggerRevalidation();
    } catch (err: any) {
      console.error(`Erro ao deletar banner ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * triggerRevalidation: Aciona a revalidação de cache sob demanda na Storefront
   * Chamada no Server Side caso implementada via Server Action no admin.
   */
  async triggerRevalidation() {
    try {
      if (typeof window === 'undefined') {
        const { revalidateTag } = require('next/cache');
        revalidateTag('storefront');
      } else {
        // Fallback Client-side: chama api de revalidação local se necessário
        await fetch('/api/revalidate?tag=storefront', { method: 'POST' }).catch(() => {});
      }
    } catch (err) {
      // Ignora erro se executado fora de Server Component/Action em compilação
    }
  }
};
