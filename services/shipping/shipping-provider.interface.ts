export interface ShippingCalculationPayload {
  cepDestino: string;
  weight: number;
  width: number;
  height: number;
  length: number;
}

export interface ShippingRate {
  id: string; // ex: 'pac', 'sedex'
  name: string; // ex: 'PAC', 'SEDEX'
  price: number;
  deliveryTimeDays: number;
  error?: string;
}

export interface IShippingProvider {
  calculateRates(payload: ShippingCalculationPayload): Promise<ShippingRate[]>;
}
