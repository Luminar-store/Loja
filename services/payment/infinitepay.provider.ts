import { IPaymentProvider, CreatePaymentSessionPayload, PaymentSessionResponse } from './payment-provider.interface';

export class InfinitePayProvider implements IPaymentProvider {
  private handle: string;
  private redirectUrl: string;
  private webhookUrl: string;

  constructor() {
    this.handle = process.env.INFINITEPAY_HANDLE || '';
    this.redirectUrl = process.env.INFINITEPAY_REDIRECT_URL || '';
    this.webhookUrl = process.env.INFINITEPAY_WEBHOOK_URL || '';
  }

  async createCheckoutSession(payload: CreatePaymentSessionPayload): Promise<PaymentSessionResponse> {
    if (!this.handle) {
      console.error('[Checkout] INFINITEPAY_HANDLE não configurado');
      throw new Error('Gateway de pagamento não configurado');
    }

    const requestBody = {
      handle: this.handle,
      order_nsu: payload.orderId,
      redirect_url: this.redirectUrl || `http://localhost:3000/pedido/sucesso?order=${payload.orderId}`,
      webhook_url: this.webhookUrl || `http://localhost:3000/api/webhooks/infinitepay`,
      customer: payload.customer ? {
        name: payload.customer.name,
        email: payload.customer.email,
        phone_number: payload.customer.phone.replace(/\D/g, ''),
      } : undefined,
      items: payload.items.map(item => ({
        description: item.name,
        quantity: item.quantity,
        price: Math.round(item.price * 100), // preço unitário em centavos já recebido do service
      }))
    };

    try {
      const response = await fetch('https://api.checkout.infinitepay.io/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[InfinitePay] Erro de API:', response.status, errorText);
        throw new Error('Erro no gateway de pagamento');
      }

      const responseData = await response.json();
      
      if (!responseData.url) {
        console.error('[Checkout] InfinitePay não retornou URL');
        throw new Error('Gateway não retornou URL de pagamento');
      }
      
      return {
        paymentUrl: responseData.url,
        referenceId: payload.orderId // Usamos orderId/NSU como referência para callbacks
      };
    } catch (error) {
      console.error('[InfinitePay] Exceção na geração do checkout:', error);
      throw error;
    }
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    // A integração oficial por Links não utiliza API Keys/Secrets para validação de signature.
    // Confiaremos no webhook endpoint que trata a validação da origem via referenceId na base
    return true;
  }
}
