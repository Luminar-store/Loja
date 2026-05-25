import { supabase } from '@/lib/supabase';
import { ProductOption, OptionValue } from '@/types/product-options';

export const productOptionsService = {
  async getOptionsByProductId(productId: string): Promise<ProductOption[]> {
    try {
      // Fetch options
      const { data: optionsData, error: optionsError } = await (supabase as any)
        .from('product_options')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (optionsError) {
        if (optionsError.code === '42P01') { // relation does not exist
          console.warn('Tabela product_options não existe ainda. Usando mock temporário ou array vazio.');
          return [];
        }
        throw optionsError;
      }

      const options: ProductOption[] = optionsData || [];
      if (!options || options.length === 0) return [];

      // Fetch values for these options
      const optionIds = options.map((opt: ProductOption) => opt.id);
      const { data: valuesData, error: valuesError } = await (supabase as any)
        .from('option_values')
        .select('*')
        .in('option_id', optionIds)
        .order('created_at', { ascending: true });

      if (valuesError) {
        if (valuesError.code === '42P01') return options; // Return options without values if values table missing
        throw valuesError;
      }

      const values: OptionValue[] = valuesData || [];

      // Group values by option
      return options.map((opt: ProductOption) => ({
        ...opt,
        values: values.filter((val: OptionValue) => val.option_id === opt.id) || []
      }));
    } catch (error) {
      console.error('Error fetching product options:', error);
      return [];
    }
  },

  // Admin / CRUD methods skeleton for future
  async createOption(option: Partial<ProductOption>) {
    const { data, error } = await (supabase as any).from('product_options').insert(option).select().single();
    if (error) throw error;
    return data;
  },

  async updateOption(id: string, updates: Partial<ProductOption>) {
    const { data, error } = await (supabase as any).from('product_options').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteOption(id: string) {
    const { error } = await (supabase as any).from('product_options').delete().eq('id', id);
    if (error) throw error;
  },

  async createOptionValue(value: Partial<OptionValue>) {
    const { data, error } = await (supabase as any).from('option_values').insert(value).select().single();
    if (error) throw error;
    return data;
  },

  async updateOptionValue(id: string, updates: Partial<OptionValue>) {
    const { data, error } = await (supabase as any).from('option_values').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteOptionValue(id: string) {
    const { error } = await (supabase as any).from('option_values').delete().eq('id', id);
    if (error) throw error;
  }
};
