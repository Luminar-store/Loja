import { IShippingProvider, ShippingCalculationPayload, ShippingRate } from './shipping-provider.interface';

export class SuperFreteProvider implements IShippingProvider {
  private token: string;
  private cepOrigem: string;

  constructor() {
    this.token = process.env.SUPERFRETE_TOKEN || '';
    this.cepOrigem = process.env.NEXT_PUBLIC_STORE_ZIP_CODE || '40000000'; // CEP de origem padrão (ex: Salvador/BA)
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SuperFrete timeout')), ms)
    );
    return Promise.race([promise, timeout]);
  }

  async calculateRates(payload: ShippingCalculationPayload): Promise<ShippingRate[]> {
    const cepLimpoDestino = String(payload.cepDestino || '').replace(/\D/g, '');
    const cepLimpoOrigem = String(this.cepOrigem || '').replace(/\D/g, '');

    // 1. Ativação automática de fallback se a chave ou CEP não estiverem configurados
    if (!this.token || this.token.includes('dummy') || cepLimpoDestino.length !== 8) {
      console.warn('[SuperFrete] Credenciais de API ou CEP de destino inválidos. Ativando fallback de R$ 29,90.');
      return this.getFallbackRates();
    }

    const requestBody = {
      from: { postal_code: cepLimpoOrigem },
      to: { postal_code: cepLimpoDestino },
      services: '1,2', // PAC e SEDEX
      package: {
        weight: Number(payload.weight) || 0.3, // Peso leve de joias
        width: Math.max(Number(payload.width) || 11, 11),
        height: Math.max(Number(payload.height) || 2, 2),
        length: Math.max(Number(payload.length) || 16, 16),
      },
    };

    try {
      // 2. Executa a requisição real com limite estrito de timeout de 3.5 segundos para resiliência de UX (AUD-003)
      const data = await this.withTimeout(
        fetch('https://api.superfrete.com/api/v0/calculator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
            'User-Agent': 'LuminarJoias/1.0',
          },
          body: JSON.stringify(requestBody),
        }).then(async (res) => {
          if (!res.ok) {
            const err = await res.text();
            throw new Error(`SuperFrete HTTP ${res.status}: ${err}`);
          }
          return res.json();
        }),
        3500 // 3.5 segundos
      );

      // Mapeia o retorno da SuperFrete para nossa estrutura comum
      const rates: ShippingRate[] = [];
      
      if (Array.isArray(data)) {
        data.forEach((srv: any) => {
          if (!srv.error && srv.price) {
            rates.push({
              id: String(srv.id || srv.name || '').toLowerCase().includes('sedex') ? 'sedex' : 'pac',
              name: String(srv.name || '').toUpperCase().includes('SEDEX') ? 'SEDEX' : 'PAC',
              price: Number(srv.price),
              deliveryTimeDays: Number(srv.delivery) || 7
            });
          }
        });
      }

      if (rates.length === 0) {
        throw new Error('Nenhum serviço de frete disponível no payload de resposta.');
      }

      return rates;
    } catch (error) {
      console.error('[SuperFrete] Falha na cotação de frete. Retornando fallback de segurança R$ 29,90. Erro:', error);
      return this.getFallbackRates();
    }
  }

  /**
   * getFallbackRates: Retorna as opções de PAC e SEDEX de fallback com valor fixo de R$ 29,90 conforme instruído.
   */
  private getFallbackRates(): ShippingRate[] {
    return [
      {
        id: 'pac',
        name: 'PAC (Sob Encomenda)',
        price: 29.90,
        deliveryTimeDays: 8
      },
      {
        id: 'sedex',
        name: 'SEDEX Express',
        price: 49.90, // SEDEX opcional com valor de envio expresso equilibrado
        deliveryTimeDays: 3
      }
    ];
  }
}
