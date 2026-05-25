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
  secret: string
): boolean {
  if (!signatureHeader) return false;

  try {
    // Remove prefixo "sha256=" se presente
    const receivedSig = signatureHeader.replace(/^sha256=/, '');

    const expectedSig = createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    const receivedBuf = Buffer.from(receivedSig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    if (receivedBuf.length !== expectedBuf.length) return false;

    return timingSafeEqual(receivedBuf, expectedBuf);
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
