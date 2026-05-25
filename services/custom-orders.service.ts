import { supabase } from '@/lib/supabase';
import { CustomOrder, CreateCustomOrderPayload } from '@/types/custom-orders';

export const customOrdersService = {
  async createOrder(payload: CreateCustomOrderPayload): Promise<CustomOrder> {
    const { data, error } = await (supabase as any)
      .from('custom_orders')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating custom order:', error);
      throw error;
    }

    return data;
  },

  async getOrders(): Promise<CustomOrder[]> {
    const { data, error } = await (supabase as any)
      .from('custom_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom orders:', error);
      throw error;
    }

    return data;
  },

  async getOrderById(id: string): Promise<CustomOrder> {
    const { data, error } = await (supabase as any)
      .from('custom_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching custom order:', error);
      throw error;
    }

    return data;
  },

  async updateOrderStatus(id: string, status: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('custom_orders')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating custom order status:', error);
      throw error;
    }
  }
};
