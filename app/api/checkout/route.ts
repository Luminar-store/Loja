import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { checkoutSchema } from '@/lib/validators/checkout.schema';
import { paymentService } from '@/services/payment/payment.service';

export async function POST(req: Request) {
  try {
    // 1. Parse e validação do payload com Zod
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    const parsed = checkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? 'Dados inválidos no checkout.' },
        { status: 400 }
      );
    }

    const { cartItems, customer, shipping, shippingAddress } = parsed.data;

    // 2. Conexão administrativa do Supabase (para bypass RLS e gravação segura)
    const supabase = createAdminClient();

    // 3. Buscar informações atualizadas de todos os produtos do carrinho em lote (anti-N+1)
    const productIds = cartItems.map(item => item.id);
    const { data: dbProducts, error: dbProdError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (dbProdError || !dbProducts || dbProducts.length === 0) {
      console.error('[Checkout] Erro ao buscar produtos:', dbProdError?.message);
      return NextResponse.json({ error: 'Erro ao validar produtos no servidor.' }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // 4. Recalcular subtotal e validar integridade dos produtos (Segurança P0)
    let subtotal = 0;
    const orderItemsToInsert: any[] = [];

    for (const item of cartItems) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Joia não encontrada no catálogo (ID: ${item.id}).` },
          { status: 400 }
        );
      }

      // Validar status ativo
      if (dbProduct.status !== 'active') {
        return NextResponse.json(
          { error: `A joia "${dbProduct.name}" não está disponível para venda no momento.` },
          { status: 400 }
        );
      }

      // Preço ativo (promocional ou normal) direto da base de dados do servidor
      const activeUnitPrice = dbProduct.promotional_price !== null && dbProduct.promotional_price !== undefined
        ? Number(dbProduct.promotional_price)
        : Number(dbProduct.price);

      subtotal += activeUnitPrice * item.quantity;

      // Cria o snapshot em JSONB do produto para histórico
      const productSnapshot = {
        name: dbProduct.name,
        slug: dbProduct.slug,
        material: dbProduct.material,
        weight: dbProduct.weight,
        selected_options: item.options || []
      };

      orderItemsToInsert.push({
        product_id: dbProduct.id,
        quantity: item.quantity,
        unit_price: activeUnitPrice,
        product_snapshot: productSnapshot
      });
    }

    // A taxa de entrega será recalculada. O provedor tem fallback de R$ 29,90.
    const finalShippingPrice = Number(shipping.price) >= 0 ? Number(shipping.price) : 29.90;
    const finalTotalPrice = subtotal + finalShippingPrice;

    // 5. Inserir o pedido na tabela principal 'orders' (status inicial: pending, payment_status: pending)
    const { data: newOrder, error: newOrderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        subtotal: subtotal,
        shipping_price: finalShippingPrice,
        total_price: finalTotalPrice,
        payment_status: 'pending',
        status: 'pending',
        shipping_status: 'pending',
        gateway: 'infinitepay',
        shipping_address: shippingAddress,
        metadata: {
          browser_shipping_name: shipping.name,
          browser_shipping_days: shipping.delivery_time
        }
      })
      .select('*')
      .single();

    if (newOrderError || !newOrder) {
      console.error('[Checkout] Erro ao gravar o pedido principal:', newOrderError?.message);
      return NextResponse.json(
        { error: 'Não foi possível registrar o pedido na base de dados.' },
        { status: 500 }
      );
    }

    const orderId = newOrder.id;
    console.log("[Checkout] Novo pedido:", newOrder.id);

    // 6. Inserir os itens do pedido na tabela secundária 'order_items' (anti N+1)
    const itemsPayload = orderItemsToInsert.map(item => ({
      ...item,
      order_id: orderId
    }));

    const { data: insertedItems, error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(itemsPayload)
      .select('*');

    if (itemsInsertError) {
      console.error('[Checkout] Erro ao gravar itens do pedido:', itemsInsertError.message);
      // Rollback manual deletando o pedido principal para evitar orfandade
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: 'Falha ao registrar itens do pedido.' }, { status: 500 });
    }

    if (!insertedItems) {
      await supabase.from('orders').delete().eq('id', orderId);
      throw new Error("Itens do pedido não foram retornados após o insert.");
    }

    console.log("[Checkout] Itens criados:", insertedItems.length);


    console.log("[Checkout] Iniciando criação da sessão InfinitePay");
    // 7. Chamar o paymentService para recalcular e gerar o checkout link seguro na InfinitePay
    const checkoutUrl = await paymentService.processCheckout(newOrder, insertedItems);

    console.log("[Checkout] Checkout URL:", checkoutUrl);
    console.log("[Checkout] Fluxo concluído com sucesso");
    
    // 8. Retornar a URL para redirecionamento transparente e seguro
    return NextResponse.json({ success: true, checkout_url: checkoutUrl });
  } catch (error: any) {
    console.error('[Checkout Route] Exceção crítica:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a finalização da compra.' },
      { status: 500 }
    );
  }
}
