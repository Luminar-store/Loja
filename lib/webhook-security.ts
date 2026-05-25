import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifica a autenticidade de um webhook InfinitePay via HMAC-SHA256.
 * Usa comparação timing-safe para prevenir timing attacks.
 *
 * @param payload - Raw body string do webhook
 * @param signatureHeader - Header de assinatura recebido
 * @param secret - Webhook secret configurado (INFINITEPAY_WEBHOOK_SECRET)
 * @returns true se a assinatura for válida
 */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  timestampHeader?: string | null
): boolean {
  if (!signatureHeader) return false;

  try {
    // Remove prefixo "sha256=" se presente
    const receivedSig = signatureHeader.replace(/^sha256=/, '');
    const receivedBuf = Buffer.from(receivedSig, 'hex');

    // 1. Tentar validar com o padrão puro (apenas payload)
    const expectedSigPure = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    const expectedBufPure = Buffer.from(expectedSigPure, 'hex');

    let isValid = false;
    if (receivedBuf.length === expectedBufPure.length) {
      isValid = timingSafeEqual(receivedBuf, expectedBufPure);
    }

    // 2. Se falhar, e houver timestampHeader, tentar validar com padrão concatenado (timestamp.payload)
    if (!isValid && timestampHeader) {
      const concatenatedData = `${timestampHeader}.${payload}`;
      const expectedSigWithTimestamp = createHmac('sha256', secret)
        .update(concatenatedData, 'utf8')
        .digest('hex');
      const expectedBufWithTimestamp = Buffer.from(expectedSigWithTimestamp, 'hex');

      if (receivedBuf.length === expectedBufWithTimestamp.length) {
        isValid = timingSafeEqual(receivedBuf, expectedBufWithTimestamp);
      }
    }

    return isValid;
  } catch {
    return false;
  }
}

/**
 * Verifica se o webhook está dentro de uma janela de tempo aceitável
 * para prevenir replay attacks.
 *
 * @param timestampHeader - Header com timestamp Unix do webhook
 * @param toleranceSeconds - Janela de tolerância (padrão: 300s = 5 min)
 */
export function verifyWebhookTimestamp(
  timestampHeader: string | null,
  toleranceSeconds = 300
): boolean {
  if (!timestampHeader) return true; // Permitir se não houver timestamp (InfinitePay pode não enviar)

  const webhookTimestamp = parseInt(timestampHeader, 10);
  if (isNaN(webhookTimestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - webhookTimestamp);

  return diff <= toleranceSeconds;
}
