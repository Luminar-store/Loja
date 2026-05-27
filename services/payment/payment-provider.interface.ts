export interface CreatePaymentSessionPayload {
  orderId: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PaymentSessionResponse {
  paymentUrl: string;
  referenceId: string;
}

export interface IPaymentProvider {
  createCheckoutSession(payload: CreatePaymentSessionPayload): Promise<PaymentSessionResponse>;
  verifyWebhookSignature(body: string, signature: string): boolean;
}
