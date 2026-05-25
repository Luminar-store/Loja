import { NextResponse } from 'next/server';

// Timeout helper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('SuperFrete timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cepDestino, weight, height, width, length } = body;

    const cepOrigem = process.env.NEXT_PUBLIC_STORE_ZIP_CODE;
    const token = process.env.SUPERFRETE_TOKEN;

    if (!cepOrigem) {
      return NextResponse.json({ error: 'CEP de origem não configurado.' }, { status: 500 });
    }
    if (!token) {
      return NextResponse.json({ error: 'Token do SuperFrete não configurado.' }, { status: 500 });
    }

    // Validar CEP de destino
    const cepLimpo = String(cepDestino ?? '').replace(/\D/g, '');
    if (!/^\d{8}$/.test(cepLimpo)) {
      return NextResponse.json({ error: 'CEP inválido. Informe um CEP com 8 dígitos.' }, { status: 400 });
    }

    const payload = {
      from: { postal_code: cepOrigem.replace(/\D/g, '') },
      to: { postal_code: cepLimpo },
      services: '1,2', // PAC e SEDEX
      package: {
        weight: Number(weight) || 1,
        width: Math.max(Number(width) || 11, 11),
        height: Math.max(Number(height) || 2, 2),
        length: Math.max(Number(length) || 16, 16),
      },
    };

    const data = await withTimeout(
      fetch('https://api.superfrete.com/api/v0/calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'LuminarJoias/1.0',
        },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.text();
          console.error('[Shipping] SuperFrete error:', res.status, err);
          throw new Error(`SuperFrete respondeu ${res.status}`);
        }
        return res.json();
      }),
      8_000 // 8 segundos de timeout
    );

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Shipping] Erro no cálculo de frete:', message);

    if (message.includes('timeout') || message.includes('SuperFrete timeout')) {
      return NextResponse.json(
        { error: 'Cálculo de frete indisponível no momento. Tente novamente.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Erro ao calcular frete.' }, { status: 500 });
  }
}
