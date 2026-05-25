import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase-server';
import { checkoutSchema } from '@/lib/validators/checkout.schema';

// Timeout helper para chamadas externas
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${label} demorou mais de ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function POST(req: Request) {
  // ─────────────────────────────────────────────────
  // 1. PARSE & VALIDAÇÃO ZOD
  // ─────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstError?.message ?? 'Dados inválidos no checkout' },
      { status: 400 }
    );
  }

  const { cartItems, customer, shipping, shippingAddress } = parsed.data;

  // ─────────────────────────────────────────────────
  // 2. USAR SERVICE ROLE (bypass RLS)
  // ─────────────────────────────────────────────────
  const supabase = createAdminClient();

  // ─────────────────────────────────────────────────
  // 3. BUSCAR TODOS OS PRODUTOS EM UMA ÚNICA QUERY (anti N+1)
  // ─────────────────────────────────────────────────
  const productIds = cartItems.map((item) => item.id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, promotional_price, status')
    .in('id', productIds);

  if (productsError || !products) {
    console.error('[Checkout] Erro ao buscar produtos:', productsError?.message);
    return NextResponse.json({ error: 'Erro ao validar produtos' }, { status: 500 });
  }

  // 3.1 Buscar todos os modificadores de variação na tabela option_values (anti N+1)
  const optionValueIds = cartItems
    .flatMap((item) => item.options?.map((opt) => opt.value_id) || [])
    .filter(Boolean);

  let dbOptionValues: { id: string; price_modifier: number }[] = [];
  if (optionValueIds.length > 0) {
    const { data: optValues, error: optValuesError } = await supabase
      .from('option_values')
      .select('id, price_modifier')
      .in('id', optionValueIds);

    if (optValuesError) {
      console.error('[Checkout] Erro ao buscar valores das opções:', optValuesError.message);
      return NextResponse.json({ error: 'Erro ao validar opções do produto' }, { status: 500 });
    }
    if (optValues) {
      dbOptionValues = optValues as any[];
    }
  }

  const optionValueMap = new Map<string, number>(
    dbOptionValues.map((v) => [v.id, Number(v.price_modifier || 0)])
  );

  // Indexar produtos por ID para busca O(1)
  const productMap = new Map(products.map((p) => [p.id, p]));

  // ─────────────────────────────────────────────────
  // 4. VALIDAR PREÇOS SERVER-SIDE
  // ─────────────────────────────────────────────────
  let subtotal = 0;
  const validItems: typeof cartItems = [];
  const infinitePayItems: { description: string; quantity: number; price: number }[] = [];

  for (const item of cartItems) {
    const product = productMap.get(item.id);

    if (!product) {
      return NextResponse.json(
        { error: `Produto não encontrado (ID: ${item.id})` },
        { status: 400 }
      );
    }

    if (product.status !== 'Ativo') {
      return NextResponse.json(
        { error: `Produto indisponível: ${product.name}` },
        { status: 400 }
      );
    }

    // Calcular preço com modificadores reais do banco (Confiança Zero no frontend)
    let itemPrice = Number(product.promotional_price ?? product.price);
    const validatedOptions: any[] = [];

    for (const opt of item.options ?? []) {
      const realModifier = optionValueMap.get(opt.value_id);

      if (realModifier === undefined) {
        return NextResponse.json(
          { error: `Opção de produto inválida ou não cadastrada (ID: ${opt.value_id})` },
          { status: 400 }
        );
      }

      // Rejeitar modificadores negativos por segurança extrema
      if (realModifier < 0) {
        return NextResponse.json(
          { error: 'Parâmetro de preço inválido detectado no servidor' },
          { status: 400 }
        );
      }

      itemPrice += realModifier;
      validatedOptions.push({
        ...opt,
        price_modifier: realModifier, // Garantir persistência do valor real do banco
      });
    }

    // Garantir que o preço final do item seja estritamente positivo
    if (itemPrice <= 0) {
      return NextResponse.json(
        { error: `Preço inválido para produto: ${product.name}` },
        { status: 400 }
      );
    }

    subtotal += itemPrice * item.quantity;
    validItems.push({
      ...item,
      options: validatedOptions,
    });

    // Montar descrição para InfinitePay
    const optionsLabel =
      item.options && item.options.length > 0
        ? ` (${item.options.map((o) => o.value_name).join(', ')})`
        : '';

    infinitePayItems.push({
      description: `${product.name}${optionsLabel}`,
      quantity: item.quantity,
      price: Math.round(itemPrice * 100), // centavos
    });
  }

  const shippingPrice = Number(shipping.price);
  const total_price = subtotal + shippingPrice;

  // ─────────────────────────────────────────────────
  // 5. GERAR LINK INFINITEPAY PRIMEIRO (antes de salvar no banco)
  // ─────────────────────────────────────────────────
  const handle = process.env.INFINITEPAY_HANDLE;
  if (!handle) {
    console.error('[Checkout] INFINITEPAY_HANDLE não configurado');
    return NextResponse.json({ error: 'Gateway de pagamento não configurado' }, { status: 500 });
  }

  // NSU único com UUID (sem colisão)
  const order_nsu = `LUM-${randomUUID().split('-')[0].toUpperCase()}`;

  const redirect_url = `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/sucesso?order=${order_nsu}`;

  const infinitePayPayload = {
    handle,
    redirect_url,
    order_nsu,
    items: infinitePayItems,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    address: {
      street: shippingAddress.street,
      number: shippingAddress.number,
      complement: shippingAddress.complement ?? '',
      neighborhood: shippingAddress.neighborhood ?? '',
      city: shippingAddress.city ?? '',
      state: shippingAddress.state ?? '',
      zip: shippingAddress.cep,
    },
  };

  let checkoutUrl: string;
  try {
    const checkoutResponse = await withTimeout(
      fetch('https://api.checkout.infinitepay.io/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(infinitePayPayload),
      }),
      10_000, // 10 segundos
      'InfinitePay'
    );

    if (!checkoutResponse.ok) {
      const err = await checkoutResponse.text();
      console.error('[Checkout] InfinitePay error:', checkoutResponse.status, err);
      return NextResponse.json({ error: 'Erro no gateway de pagamento' }, { status: 502 });
    }

    const { url } = await checkoutResponse.json();
    if (!url) {
      console.error('[Checkout] InfinitePay não retornou URL');
      return NextResponse.json({ error: 'Gateway não retornou URL de pagamento' }, { status: 502 });
    }

    checkoutUrl = url;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[Checkout] Falha na chamada InfinitePay:', message);
    return NextResponse.json(
      { error: 'Gateway de pagamento indisponível. Tente novamente.' },
      { status: 503 }
    );
  }

  // ─────────────────────────────────────────────────
  // 6. SALVAR PEDIDO NO BANCO (após URL garantida)
  // ─────────────────────────────────────────────────
  const { error: orderError } = await supabase.from('orders').insert([
    {
      order_nsu,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      items: validItems,
      subtotal,
      shipping_price: shippingPrice,
      total_price,
      payment_status: 'pending',
      status: 'pending',
      shipping_address: shippingAddress,
    },
  ]);

  if (orderError) {
    console.error('[Checkout] Erro ao criar pedido no banco:', orderError.message);
    // URL do InfinitePay já foi gerada — retornar mesmo assim para o cliente poder pagar
    // O pedido pode ser reconciliado depois via webhook
    console.warn('[Checkout] Retornando URL mesmo com erro no banco — reconciliar via webhook');
  }

  console.info('[Checkout] Pedido criado com sucesso', {
    order_nsu,
    total_price,
    items: validItems.length,
  });

  return NextResponse.json({ success: true, checkout_url: checkoutUrl });
}
