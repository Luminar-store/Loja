'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Order {
  id: string;
  order_nsu: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  items: unknown;
  subtotal: number | null;
  shipping_price: number | null;
  total_price: number | null;
  payment_status: string | null;
  status: string | null;
  shipping_address: unknown;
  capture_method: string | null;
  transaction_nsu: string | null;
  invoice_slug: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
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
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
