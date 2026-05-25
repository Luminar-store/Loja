import { supabase } from '@/lib/supabase';
import { validateImageFile, sanitizeFileName } from '@/lib/upload-validator';

export const storageService = {
  /**
   * uploadProductImage: Faz upload de imagem de produto com validação completa.
   */
  async uploadProductImage(file: File, fileName: string): Promise<string> {
    // Validar antes do upload
    const validation = await validateImageFile(file, 'product');
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Arquivo inválido');
    }

    const safeName = sanitizeFileName(fileName);
    const filePath = `images/${Date.now()}_${safeName}`;

    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(error.message);
    }

    return this.getPublicUrl(data.path);
  },

  /**
   * uploadCustomOrderReference: Upload de imagem de referência de pedido personalizado.
   * Usa bucket separado 'custom-orders'.
   */
  async uploadCustomOrderReference(file: File, fileName: string): Promise<string> {
    // Validar com limite menor para referências
    const validation = await validateImageFile(file, 'custom-order');
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Arquivo inválido');
    }

    const safeName = sanitizeFileName(fileName);
    const filePath = `references/${Date.now()}_${safeName}`;

    const { data, error } = await supabase.storage
      .from('custom-orders')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      // Fallback: tentar no bucket products se custom-orders não existir
      console.warn('Bucket custom-orders não encontrado, usando products:', error.message);
      return this.uploadProductImage(file, fileName);
    }

    const { data: urlData } = supabase.storage
      .from('custom-orders')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  /**
   * getPublicUrl: Retorna a URL pública do bucket products.
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * deleteProductImage: Remove uma imagem do bucket products.
   */
  async deleteProductImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('products')
      .remove([path]);

    if (error) {
      throw new Error(error.message);
    }
  },
};
