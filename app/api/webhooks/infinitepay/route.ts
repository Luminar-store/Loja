import { NextResponse } from 'next/server';
import { paymentService } from '@/services/payment/payment.service';

export async function POST(req: Request) {
  const bodyText = await req.text();

  // 1. Captura a assinatura criptográfica dos headers
  const signature = req.headers.get('x-infinitepay-signature')
    || req.headers.get('x-signature')
    || req.headers.get('signature')
    || '';

  console.info('[Webhook InfinitePay] Callback recebido via HTTP POST');

  // 2. Encaminha o processamento de forma centralizada e transacional ao paymentService
  const processed = await paymentService.handleWebhook(bodyText, signature);

  if (!processed) {
    console.error('[Webhook InfinitePay] Falha na validação ou no processamento do evento.');
    return NextResponse.json(
      { error: 'Webhook processing failed or signature invalid' },
      { status: 400 }
    );
  }

  // 3. Retorna sucesso conforme especificação oficial do gateway
  return NextResponse.json({ success: true, message: 'Event processed successfully' });
}
