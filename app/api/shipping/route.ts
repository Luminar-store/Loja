import { NextResponse } from 'next/server';
import { shippingService } from '@/services/shipping/shipping.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cepDestino, weight, height, width, length } = body;

    if (!cepDestino) {
      return NextResponse.json({ error: 'CEP de destino é obrigatório.' }, { status: 400 });
    }

    // Limpa o CEP
    const cepLimpo = String(cepDestino).replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido. Deve possuir 8 dígitos.' }, { status: 400 });
    }

    // Executa a cotação no shippingService de forma tolerante a falhas (timeout de 3.5s integrado)
    const rates = await shippingService.calculateShipping({
      cepDestino: cepLimpo,
      weight: Number(weight) || 0.3,
      width: Number(width) || 15,
      height: Number(height) || 5,
      length: Number(length) || 20
    });

    // Mapeamento seguro para dupla compatibilidade com as propriedades lidas pelo frontend (delivery_time e deliveryTimeDays)
    const mappedRates = rates.map(rate => ({
      id: rate.id,
      name: rate.name,
      price: rate.price,
      delivery_time: rate.deliveryTimeDays, // Compatível com opt.delivery_time no frontend atual
      deliveryTimeDays: rate.deliveryTimeDays
    }));

    return NextResponse.json(mappedRates);
  } catch (error: any) {
    console.error('[API Shipping] Exceção na rota de cálculo:', error);
    
    // Retorno de Fallback Absoluto e Resistente se tudo falhar (Segurança e Resiliência Operacional P0)
    const fallbackRates = [
      {
        id: 'pac',
        name: 'PAC (Sob Encomenda)',
        price: 29.90,
        delivery_time: 8,
        deliveryTimeDays: 8
      },
      {
        id: 'sedex',
        name: 'SEDEX Express',
        price: 49.90,
        delivery_time: 3,
        deliveryTimeDays: 3
      }
    ];

    return NextResponse.json(fallbackRates);
  }
}
