import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type StorefrontSectionRow = Database['public']['Tables']['storefront_sections']['Row'];
export type StorefrontSectionInsert = Database['public']['Tables']['storefront_sections']['Insert'];
export type StorefrontSectionUpdate = Database['public']['Tables']['storefront_sections']['Update'];

export const cmsService = {
  /**
   * listActiveSections: Retorna a lista de seções ativas da homepage ordenadas por position
   */
  async listActiveSections(): Promise<StorefrontSectionRow[]> {
    try {
      const { data, error } = await supabase
        .from('storefront_sections')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (err: any) {
      console.error('Erro ao listar seções ativas do CMS:', err.message);
      return [];
    }
  },

  /**
   * listAllSections: Retorna todas as seções (ativas e inativas) para exibição no admin
   */
  async listAllSections(): Promise<StorefrontSectionRow[]> {
    try {
      const { data, error } = await supabase
        .from('storefront_sections')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (err: any) {
      console.error('Erro ao listar todas as seções do CMS:', err.message);
      return [];
    }
  },

  /**
   * updateSection: Atualiza a ordenação, ativação ou o payload JSONB de uma seção do CMS
   */
  async updateSection(id: string, updates: StorefrontSectionUpdate): Promise<StorefrontSectionRow | null> {
    try {
      const { data, error } = await supabase
        .from('storefront_sections')
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
      console.error(`Erro ao atualizar seção ${id} do CMS:`, err.message);
      throw err;
    }
  },

  /**
   * updateSectionsOrder: Atualiza a ordem e o estado de múltiplas seções de uma vez
   */
  async updateSectionsOrder(sections: { id: string; position: number; is_active?: boolean }[]): Promise<void> {
    try {
      // Faz atualizações sequenciais no Supabase
      for (const section of sections) {
        await supabase
          .from('storefront_sections')
          .update({
            position: section.position,
            ...(section.is_active !== undefined ? { is_active: section.is_active } : {})
          })
          .eq('id', section.id);
      }

      await this.triggerRevalidation();
    } catch (err: any) {
      console.error('Erro ao salvar reordenação das seções do CMS:', err.message);
      throw err;
    }
  },

  /**
   * triggerRevalidation: Limpa o cache da storefront
   */
  async triggerRevalidation() {
    try {
      if (typeof window === 'undefined') {
        const { revalidateTag } = require('next/cache');
        revalidateTag('storefront');
      } else {
        await fetch('/api/revalidate?tag=storefront', { method: 'POST' }).catch(() => {});
      }
    } catch {
      // Ignora fora do Next Server
    }
  }
};
