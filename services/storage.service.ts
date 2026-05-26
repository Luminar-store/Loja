import { supabase } from '@/lib/supabase';
import { validateImageFile, sanitizeFileName } from '@/lib/upload-validator';
import imageCompression from 'browser-image-compression';

export type StorageFolder = 'products' | 'categories' | 'banners' | 'avatars';

export const storageService = {
  /**
   * uploadImage: Comprime a imagem no client-side e faz upload para o Supabase Storage
   * com suporte a pastas organizadas e geração de nome único no formato timestamp + slug.
   */
  async uploadImage(
    file: File,
    folder: StorageFolder,
    slug: string
  ): Promise<string> {
    // 1. Validar antes do upload (limite de 5MB)
    const validation = await validateImageFile(file, 'product');
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Arquivo inválido');
    }

    // 2. Compressão automática client-side
    let processedFile = file;
    if (typeof window !== 'undefined') {
      try {
        const options = {
          maxSizeMB: 1.5,            // tamanho máximo de saída
          maxWidthOrHeight: 1200,   // limita resolução excessiva
          useWebWorker: true,
          fileType: 'image/webp',   // converter para WebP
          initialQuality: 0.8,      // qualidade equilibrada
        };
        processedFile = await imageCompression(file, options);
      } catch (err) {
        console.warn('Erro ao comprimir imagem, utilizando arquivo original:', err);
      }
    }

    // 3. Geração automática de nome único: timestamp + slug + extensão
    const cleanSlug = slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9-_]/g, '_')
      .substring(0, 50);
    const filePath = `${folder}/${Date.now()}_${cleanSlug}.webp`;

    // 4. Upload para o bucket 'products'
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, processedFile, {
        cacheControl: '31536000',
        upsert: false,
        contentType: 'image/webp',
      });

    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    return this.getPublicUrl(data.path);
  },

  /**
   * uploadProductImage: Método de compatibilidade legada, redireciona para uploadImage
   */
  async uploadProductImage(file: File, fileName: string): Promise<string> {
    const slug = fileName.split('.')[0] || 'product';
    return this.uploadImage(file, 'products', slug);
  },

  /**
   * uploadCustomOrderReference: Upload de imagem de referência de pedido personalizado.
   * Usa bucket separado 'custom-orders'.
   */
  async uploadCustomOrderReference(file: File, fileName: string): Promise<string> {
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
      console.warn('Bucket custom-orders não encontrado, usando products:', error.message);
      return this.uploadProductImage(file, fileName);
    }

    const { data: urlData } = supabase.storage
      .from('custom-orders')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  /**
   * getPublicUrl: Retorna a URL pública do bucket products
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * deleteImage: Remove uma imagem física do bucket products baseado na sua URL pública
   */
  async deleteImage(url: string): Promise<void> {
    try {
      if (!url) return;
      const parts = url.split('/storage/v1/object/public/products/');
      if (parts.length > 1) {
        const filePath = decodeURIComponent(parts[1]);
        const { error } = await supabase.storage
          .from('products')
          .remove([filePath]);

        if (error) {
          console.warn(`Aviso ao remover imagem física (${filePath}):`, error.message);
        }
      }
    } catch (err: any) {
      console.error('Erro na remoção da imagem física:', err.message);
    }
  },

  /**
   * deleteProductImage: Método de compatibilidade legada
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
