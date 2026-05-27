import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type SettingRow = Database['public']['Tables']['settings']['Row'];
export type SettingInsert = Database['public']['Tables']['settings']['Insert'];
export type SettingUpdate = Database['public']['Tables']['settings']['Update'];

export const settingsService = {
  /**
   * getSetting: Retorna o valor de uma chave específica e converte baseado no tipo cadastrado.
   */
  async getSetting<T = any>(key: string, defaultValue: T): Promise<T> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Registro não encontrado no Supabase, retorna valor padrão
          return defaultValue;
        }
        throw error;
      }

      return this.parseValue(data.value, data.type) as T;
    } catch (err: any) {
      console.warn(`Aviso ao ler chave '${key}':`, err.message);
      return defaultValue;
    }
  },

  /**
   * setSetting: Grava ou atualiza uma chave no formato KV Store
   */
  async setSetting(key: string, value: any, type: string = 'string', group: string = 'general'): Promise<SettingRow | null> {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      const { data, error } = await supabase
        .from('settings')
        .upsert({
          key,
          value: stringValue,
          type,
          group,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Ao alterar configurações da loja, limpamos o cache de storefront dinâmico
      await this.triggerRevalidation();

      return data;
    } catch (err: any) {
      console.error(`Erro ao salvar chave settings '${key}':`, err.message);
      throw err;
    }
  },

  /**
   * listSettingsByGroup: Retorna todas as chaves associadas a um grupo específico
   */
  async listSettingsByGroup(group: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('group', group);

      if (error) {
        throw error;
      }

      const settingsMap: Record<string, any> = {};
      if (data) {
        data.forEach(item => {
          settingsMap[item.key] = this.parseValue(item.value, item.type);
        });
      }

      return settingsMap;
    } catch (err: any) {
      console.error(`Erro ao listar configurações do grupo '${group}':`, err.message);
      return {};
    }
  },

  /**
   * parseValue: Conversor de tipos interno para a KV Store
   */
  parseValue(value: string, type: string): any {
    try {
      switch (type) {
        case 'boolean':
          return value === 'true';
        case 'number':
          return Number(value);
        case 'json':
          return JSON.parse(value);
        default:
          return value;
      }
    } catch (e) {
      return value;
    }
  },

  /**
   * triggerRevalidation: Aciona a revalidação de cache sob demanda na Storefront
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
      // Ignora erros client-side
    }
  }
};
