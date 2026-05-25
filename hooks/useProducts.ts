import { useState, useEffect, useCallback } from 'react';
import { productService, ProductRow } from '@/services/product.service';

export function useProducts() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.listProducts();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar produtos');
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProducts();
    }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}
