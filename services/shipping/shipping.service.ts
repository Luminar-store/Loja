import { SuperFreteProvider } from './superfrete.provider';
import { ShippingCalculationPayload, ShippingRate } from './shipping-provider.interface';

export const shippingService = {
  provider: new SuperFreteProvider(),

  /**
   * calculateShipping: Calcula frete de forma tolerante a falhas.
   */
  async calculateShipping(payload: ShippingCalculationPayload): Promise<ShippingRate[]> {
    try {
      if (!payload.cepDestino) {
        throw new Error('CEP de destino é obrigatório.');
      }
      return await this.provider.calculateRates(payload);
    } catch (err) {
      console.error('[ShippingService] Falha geral no cálculo de frete:', err);
      // Retorna fallback robusto
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
          price: 49.90,
          deliveryTimeDays: 3
        }
      ];
    }
  }
};
