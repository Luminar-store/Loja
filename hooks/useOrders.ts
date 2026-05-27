'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Order {
  id: string;
  customer_id: string | null;
  status: string;
  payment_status: string;
  shipping_status: string;
  subtotal: number;
  shipping_price: number;
  total_price: number;
  gateway: string;
  gateway_reference: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: unknown;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setOrders((data as Order[]) ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar pedidos';
      console.error('[useOrders]', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchOrders();
    };

    init();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
