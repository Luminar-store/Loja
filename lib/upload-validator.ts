// Tipos MIME permitidos e seus magic bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

// Tamanho máximo: 5MB para produtos, 3MB para referências de pedido
const MAX_PRODUCT_SIZE = 5 * 1024 * 1024;
const MAX_REFERENCE_SIZE = 3 * 1024 * 1024;

// Magic bytes para validação real de tipo (não confiar apenas em file.type)
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37], [0x47, 0x49, 0x46, 0x38, 0x39]], // GIF87a, GIF89a
};

export type UploadContext = 'product' | 'custom-order';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida um arquivo de imagem antes do upload.
 * Verifica MIME type, tamanho e magic bytes.
 */
export async function validateImageFile(
  file: File,
  context: UploadContext = 'product'
): Promise<ValidationResult> {
  const maxSize = context === 'product' ? MAX_PRODUCT_SIZE : MAX_REFERENCE_SIZE;

  // 1. Validar MIME type declarado
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido: ${file.type}. Use JPEG, PNG, WebP ou GIF.`,
    };
  }

  // 2. Validar tamanho
  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxMB}MB.`,
    };
  }

  // 3. Validar magic bytes (os primeiros bytes do arquivo)
  try {
    const arrayBuffer = await file.slice(0, 12).arrayBuffer();
    const bytes = Array.from(new Uint8Array(arrayBuffer));
    const expectedMagics = MAGIC_BYTES[file.type];

    if (expectedMagics) {
      const isValid = expectedMagics.some((magic) =>
        magic.every((byte, i) => bytes[i] === byte)
      );

      if (!isValid) {
        return {
          valid: false,
          error: 'Arquivo corrompido ou tipo incorreto. O conteúdo não corresponde à extensão.',
        };
      }
    }
  } catch {
    return { valid: false, error: 'Não foi possível verificar o arquivo.' };
  }

  return { valid: true };
}

/**
 * Sanitiza o nome do arquivo removendo caracteres perigosos e padronizando.
 */
export function sanitizeFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  const safeExt = allowedExtensions.includes(ext) ? ext : 'jpg';

  // Remove tudo que não seja alfanumérico, hífen ou underscore
  const baseName = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);

  return `${baseName}.${safeExt}`;
}
