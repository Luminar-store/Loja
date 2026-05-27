import { IPaymentProvider, CreatePaymentSessionPayload, PaymentSessionResponse } from './payment-provider.interface';
import crypto from 'crypto';

export class InfinitePayProvider implements IPaymentProvider {
  private apiKey: string;
  private webhookSecret: string;
  private isProduction: boolean;

  constructor() {
    this.apiKey = process.env.INFINITEPAY_API_KEY || '';
    this.webhookSecret = process.env.INFINITEPAY_WEBHOOK_SECRET || '';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  async createCheckoutSession(payload: CreatePaymentSessionPayload): Promise<PaymentSessionResponse> {
    // Validação estrita de segurança para produção (P0 - Hardening de produção)
    if (this.isProduction) {
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey.includes('dummy')) {
        console.error('[InfinitePay Security] Bloqueio de checkout em produção: INFINITEPAY_API_KEY está ausente ou inválida.');
        throw new Error('Erro de Configuração do Sistema: Chave de API de pagamento ausente em produção.');
      }
      if (!this.webhookSecret || this.webhookSecret.trim() === '' || this.webhookSecret.includes('dummy')) {
        console.error('[InfinitePay Security] Bloqueio de checkout em produção: INFINITEPAY_WEBHOOK_SECRET está ausente ou inválida.');
        throw new Error('Erro de Configuração do Sistema: Segredo de webhook de pagamento ausente em produção.');
      }
    }

    const storeUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Na InfinitePay, o valor ('amount') é em centavos (inteiro)
    const amountInCents = Math.round(payload.amount * 100);

    const requestBody = {
      amount: amountInCents,
      currency: 'BRL',
      reference_id: payload.orderId,
      redirect_url: `${storeUrl}/pedido/sucesso?order_id=${payload.orderId}`,
      webhook_url: `${storeUrl}/api/webhooks/infinitepay`,
      customer: {
        name: payload.customer.name,
        email: payload.customer.email,
        phone: payload.customer.phone.replace(/\D/g, ''),
      },
      items: payload.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: Math.round(item.price * 100), // preço unitário em centavos
      })),
      metadata: {
        order_id: payload.orderId,
        store: 'Luminar Joias'
      }
    };

    try {
      // Se não tiver API Key em dev local, gera um link simulado para desenvolvimento tolerante a falhas
      if (!this.apiKey || this.apiKey.includes('dummy')) {
        console.warn('[InfinitePay] Chave API inexistente ou de teste. Retornando link simulado.');
        return {
          paymentUrl: `https://pay.infinitepay.io/dummy-checkout/${payload.orderId}?amount=${amountInCents}`,
          referenceId: `inf_${crypto.randomBytes(8).toString('hex')}`
        };
      }

      // Requisição à API Real da InfinitePay
      const apiUrl = this.isProduction 
        ? 'https://api.infinitepay.io/v1/payment-links'
        : 'https://api.sandbox.infinitepay.io/v1/payment-links';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[InfinitePay] Erro de API:', errorText);
        throw new Error(`InfinitePay respondeu ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      
      return {
        paymentUrl: responseData.url || responseData.payment_url,
        referenceId: responseData.id || responseData.reference_id || `inf_${crypto.randomBytes(8).toString('hex')}`
      };
    } catch (error) {
      console.error('[InfinitePay] Exceção na geração do checkout:', error);
      throw error;
    }
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    // Bloqueio rigoroso de webhook sem validação em produção (P0 - Hardening de produção)
    if (this.isProduction) {
      if (!signature || !this.webhookSecret || this.webhookSecret.trim() === '' || this.webhookSecret.includes('dummy')) {
        console.error('[InfinitePay Webhook Security] Bloqueio em produção: Assinatura ou segredo do webhook ausentes/inválidos.');
        return false;
      }
    }

    if (!signature || !this.webhookSecret) {
      // Se não houver segredo em ambiente local, passa em dev apenas se a env for dummy
      if (this.webhookSecret.includes('dummy') || !this.isProduction) {
        console.warn('[InfinitePay Webhook] Pulando validação criptográfica em ambiente de desenvolvimento.');
        return true;
      }
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const computedSignature = hmac.update(body).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature));
    } catch (err) {
      console.error('[InfinitePay Webhook] Erro ao validar assinatura:', err);
      return false;
    }
  }
}
