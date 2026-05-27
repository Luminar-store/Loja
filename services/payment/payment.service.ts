import { supabase } from '@/lib/supabase';
import { InfinitePayProvider } from './infinitepay.provider';

export const paymentService = {
  provider: new InfinitePayProvider(),

  /**
   * processCheckout: Valida consistência financeira no servidor e gera o Link de Pagamento.
   */
  async processCheckout(orderId: string): Promise<string> {
    try {
      // 1. Carrega o pedido do banco de dados
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error(`Pedido não encontrado: ${orderError?.message || ''}`);
      }

      // 2. Carrega os itens do pedido
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError || !orderItems || orderItems.length === 0) {
        throw new Error(`Itens do pedido não encontrados: ${itemsError?.message || ''}`);
      }

      // 3. Recalcular e validar a consistência financeira no servidor antes de enviar ao gateway (P3 - Hardening)
      let recalculatedSubtotal = 0;
      const gatewayItems = [];

      for (const item of orderItems) {
        // Busca o preço atualizado do produto direto na base de dados (Source of Truth)
        const { data: product, error: prodError } = await supabase
          .from('products')
          .select('price, promotional_price, name')
          .eq('id', item.product_id || '')
          .single();

        if (prodError || !product) {
          throw new Error(`Produto ${item.product_id} inexistente ou inativo.`);
        }

        const activePrice = product.promotional_price !== null && product.promotional_price !== undefined
          ? product.promotional_price 
          : product.price;

        // Se houver qualquer divergência de preço enviada pelo navegador, força a recalibração segura
        if (Number(activePrice) !== Number(item.unit_price)) {
          console.warn(`[Checkout Security] Divergência de preço detectada no produto ${product.name}. Recalibrando.`);
        }

        recalculatedSubtotal += Number(activePrice) * item.quantity;

        gatewayItems.push({
          name: product.name,
          quantity: item.quantity,
          price: Number(activePrice)
        });
      }

      // A taxa de frete mínima oficial de fallback é R$ 29,90 se a SuperFrete falhar. 
      // Em qualquer caso, re-validamos a consistência geral:
      const finalShippingPrice = Number(order.shipping_price) >= 0 ? Number(order.shipping_price) : 29.90;
      const finalTotalPrice = recalculatedSubtotal + finalShippingPrice;

      // Atualiza o pedido no banco de dados com os valores estritamente recalculados pelo servidor (Segurança P0)
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          subtotal: recalculatedSubtotal,
          shipping_price: finalShippingPrice,
          total_price: finalTotalPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        throw new Error(`Erro ao atualizar valores recalculados no pedido: ${updateError.message}`);
      }

      // 4. Cria a sessão de pagamento via InfinitePay
      const checkoutSession = await this.provider.createCheckoutSession({
        orderId: order.id,
        amount: finalTotalPrice,
        customer: {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
        },
        items: gatewayItems
      });

      // 5. Salva a referência da transação no banco
      const { error: txError } = await supabase
        .from('orders')
        .update({
          gateway_reference: checkoutSession.referenceId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (txError) {
        console.error('[Payment] Erro ao gravar gateway_reference:', txError.message);
      }

      // 6. Grava no histórico de transações de forma assíncrona e segura
      await supabase.from('payment_transactions').insert({
        order_id: orderId,
        gateway: 'infinitepay',
        transaction_id: checkoutSession.referenceId,
        status: 'pending',
        payload: {
          session_url: checkoutSession.paymentUrl,
          amount_cents: Math.round(finalTotalPrice * 100)
        }
      });

      return checkoutSession.paymentUrl;
    } catch (err) {
      console.error('[PaymentService] Erro no fluxo de processamento do checkout:', err);
      throw err;
    }
  },

  /**
   * handleWebhook: Processa o callback de confirmação transacional do webhook.
   */
  async handleWebhook(bodyText: string, signature: string): Promise<boolean> {
    try {
      // 1. Valida criptograficamente
      const isValid = this.provider.verifyWebhookSignature(bodyText, signature);
      if (!isValid) {
        console.error('[Webhook Payment] Assinatura digital inválida!');
        return false;
      }

      const eventData = JSON.parse(bodyText);
      const referenceId = eventData.id || eventData.reference_id || eventData.data?.id;
      const eventStatus = eventData.status || eventData.data?.status; // ex: 'approved', 'paid', 'canceled'

      if (!referenceId) {
        console.error('[Webhook Payment] reference_id / id não encontrado no payload.');
        return false;
      }

      // 2. Localiza o pedido correspondente por gateway_reference
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('gateway_reference', referenceId)
        .single();

      if (orderError || !order) {
        console.error(`[Webhook Payment] Pedido com referência ${referenceId} não encontrado:`, orderError?.message);
        return false;
      }

      // 3. Registra a transação de forma idempotente e previne processamento duplicado
      const { data: existingTx } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', referenceId)
        .eq('status', eventStatus)
        .single();

      if (existingTx) {
        console.warn(`[Webhook Payment] Callback duplicado ignorado (idempotência): Ref ${referenceId}, Status ${eventStatus}`);
        return true;
      }

      // Grava a nova transação no histórico
      await supabase.from('payment_transactions').insert({
        order_id: order.id,
        gateway: 'infinitepay',
        transaction_id: referenceId,
        status: eventStatus,
        payload: eventData
      });

      // 4. Mapeamento oficial de status:
      // Se aprovado/paid -> status = 'processing' (início da produção artesanal sob encomenda) e payment_status = 'paid'
      let newPaymentStatus = 'pending';
      let newOrderStatus = 'pending';

      if (eventStatus === 'approved' || eventStatus === 'paid' || eventStatus === 'confirmed') {
        newPaymentStatus = 'paid';
        newOrderStatus = 'processing'; // Inicia produção artesanal (sem controle físico de estoque conforme diretriz)
      } else if (eventStatus === 'canceled' || eventStatus === 'failed') {
        newPaymentStatus = 'failed';
        newOrderStatus = 'canceled';
      } else if (eventStatus === 'refunded') {
        newPaymentStatus = 'refunded';
        newOrderStatus = 'refunded';
      }

      // Atualiza o status do pedido
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: newPaymentStatus,
          status: newOrderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error(`[Webhook Payment] Erro ao atualizar status do pedido ${order.id}:`, updateError.message);
        return false;
      }

      console.log(`[Webhook Payment] Pedido ${order.id} atualizado com sucesso. Status: ${newOrderStatus}, Payment: ${newPaymentStatus}`);
      return true;
    } catch (err) {
      console.error('[Webhook Payment] Exceção geral no processamento:', err);
      return false;
    }
  }
};
