import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { verifyWebhookSignature, verifyWebhookTimestamp } from '@/lib/webhook-security';

export async function POST(req: Request) {
  const bodyText = await req.text();

  // ─────────────────────────────────────────────────
  // 1. VALIDAÇÃO DE ASSINATURA HMAC (Anti-forgery)
  // ─────────────────────────────────────────────────
  const webhookSecret = process.env.INFINITEPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] INFINITEPAY_WEBHOOK_SECRET não configurado');
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 500 });
  }

  const signature = req.headers.get('x-infinitepay-signature')
    ?? req.headers.get('x-signature')
    ?? req.headers.get('signature');

  const timestamp = req.headers.get('x-infinitepay-timestamp')
    ?? req.headers.get('x-timestamp');

  // Verificar timestamp para proteção contra replay attacks
  if (!verifyWebhookTimestamp(timestamp)) {
    console.warn('[Webhook] Timestamp fora da janela aceitável — possível replay attack', { timestamp });
    return NextResponse.json({ error: 'Webhook timestamp inválido' }, { status: 401 });
  }

  // Verificar assinatura HMAC
  // NOTA: Se a InfinitePay não enviar assinatura, logar e permitir em dev, bloquear em prod
  if (signature) {
    const isValid = verifyWebhookSignature(bodyText, signature, webhookSecret, timestamp);
    if (!isValid) {
      console.warn('[Webhook] Assinatura HMAC inválida — possível requisição forjada', {
        receivedSignature: signature?.substring(0, 20) + '...',
      });
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Em produção, bloquear webhooks sem assinatura
    console.warn('[Webhook] Requisição sem assinatura bloqueada em produção');
    return NextResponse.json({ error: 'Assinatura obrigatória' }, { status: 401 });
  } else {
    console.warn('[Webhook] Sem assinatura — permitindo em ambiente de desenvolvimento');
  }

  // ─────────────────────────────────────────────────
  // 2. PARSE DO PAYLOAD
  // ─────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    console.error('[Webhook] Payload JSON inválido');
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const { invoice_slug, capture_method, transaction_nsu, order_nsu, receipt_url, status } = body as {
    invoice_slug?: string;
    capture_method?: string;
    transaction_nsu?: string;
    order_nsu?: string;
    receipt_url?: string;
    status?: string;
  };

  console.info('[Webhook] InfinitePay recebido com sucesso', {
    order_nsu,
    status,
    hasTransactionNsu: !!transaction_nsu,
  });

  // ─────────────────────────────────────────────────
  // 3. VALIDAÇÃO DO order_nsu
  // ─────────────────────────────────────────────────
  if (!order_nsu || typeof order_nsu !== 'string') {
    console.warn('[Webhook] Recebido sem order_nsu válido');
    return NextResponse.json({ error: 'Missing order_nsu' }, { status: 400 });
  }

  // ─────────────────────────────────────────────────
  // 4. PROCESSAMENTO COM SERVICE ROLE (bypass RLS)
  // ─────────────────────────────────────────────────
  const supabase = createAdminClient();

  // Buscar pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, payment_status, order_nsu')
    .eq('order_nsu', order_nsu)
    .single();

  if (orderError || !order) {
    console.error('[Webhook] Pedido não encontrado no banco de dados', { order_nsu, error: orderError?.message });
    return NextResponse.json({ error: 'Order not found' }, { status: 400 });
  }

  // ─────────────────────────────────────────────────
  // 5. TRATAMENTO IDEMPOTENTE & MÁQUINA DE STATUS
  // ─────────────────────────────────────────────────
  const currentStatus = (status || '').toLowerCase();

  if (currentStatus === 'approved' || currentStatus === 'paid') {
    // IDEMPOTÊNCIA: Evitar processar se já for pago
    if (order.payment_status === 'paid') {
      console.info('[Webhook] Pedido já marcado como pago. Idempotência ativada.', { order_nsu });
      return NextResponse.json({ success: true, message: 'Already processed as paid' });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'production',
        capture_method: capture_method ?? null,
        transaction_nsu: transaction_nsu ?? null,
        invoice_slug: invoice_slug ?? null,
        receipt_url: receipt_url ?? null,
        paid_at: new Date().toISOString(),
      })
      .eq('order_nsu', order_nsu);

    if (updateError) {
      console.error('[Webhook] Erro ao atualizar pedido como pago no Supabase:', { order_nsu, error: updateError.message });
      return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
    }

    console.info('[Webhook] Pedido marcado como pago e em produção com sucesso', { order_nsu, transaction_nsu });
    return NextResponse.json({ success: true, message: 'Payment approved' });

  } else if (
    currentStatus === 'cancelled' ||
    currentStatus === 'refused' ||
    currentStatus === 'refunded' ||
    currentStatus === 'chargeback'
  ) {
    let targetPaymentStatus = 'failed';
    let targetOrderStatus = 'cancelled';

    if (currentStatus === 'refunded') {
      targetPaymentStatus = 'refunded';
    } else if (currentStatus === 'chargeback') {
      targetPaymentStatus = 'chargeback';
    }

    // IDEMPOTÊNCIA: Evitar processar se já estiver no status correto
    if (order.payment_status === targetPaymentStatus) {
      console.info('[Webhook] Pedido já marcado com status de falha correspondente. Idempotência ativada.', { order_nsu, status: targetPaymentStatus });
      return NextResponse.json({ success: true, message: `Already processed as ${targetPaymentStatus}` });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: targetPaymentStatus,
        status: targetOrderStatus,
        capture_method: capture_method ?? null,
        transaction_nsu: transaction_nsu ?? null,
        invoice_slug: invoice_slug ?? null,
      })
      .eq('order_nsu', order_nsu);

    if (updateError) {
      console.error('[Webhook] Erro ao atualizar cancelamento do pedido no Supabase:', { order_nsu, error: updateError.message });
      return NextResponse.json({ error: 'Error updating order cancellation' }, { status: 500 });
    }

    console.warn('[Webhook] Recebido status de cancelamento/falha. Pedido atualizado.', { order_nsu, status: targetPaymentStatus });
    return NextResponse.json({ success: true, message: `Payment failed. Set to ${targetPaymentStatus}` });

  } else if (currentStatus === 'pending') {
    console.info('[Webhook] Transação pendente. Aguardando processamento.', { order_nsu });
    return NextResponse.json({ success: true, message: 'Transaction is pending' });

  } else {
    console.warn('[Webhook] Status do gateway desconhecido ou não mapeado:', { order_nsu, status: currentStatus });
    return NextResponse.json({ success: true, message: 'Status ignored' });
  }
}
