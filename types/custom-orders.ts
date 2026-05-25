export interface CustomOrder {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  model: string;
  length: string;
  thickness: string;
  material: string;
  notes?: string;
  reference_image?: string;
  status: string;
  created_at?: string;
}

export interface CreateCustomOrderPayload {
  customer_name?: string;
  customer_phone?: string;
  model: string;
  length: string;
  thickness: string;
  material: string;
  notes?: string;
  reference_image?: string;
}
