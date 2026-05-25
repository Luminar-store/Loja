'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProductOption, SelectedOption } from '@/types/product-options';
import { productOptionsService } from '@/services/product-options.service';

export function useProductOptions(productId: string, basePrice: number, basePromotionalPrice: number | null = null) {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const data = await productOptionsService.getOptionsByProductId(productId);
        if (isMounted) {
          setOptions(data);
          
          // Pre-select first values by default
          const defaultSelections: SelectedOption[] = data.map(opt => {
            const firstValue = opt.values?.[0];
            return {
              option_id: opt.id,
              option_name: opt.name,
              value_id: firstValue?.id || '',
              value_name: firstValue?.value || '',
              price_modifier: firstValue?.price_modifier || 0
            };
          }).filter(s => s.value_id !== ''); // only keep if it has a value

          setSelectedOptions(defaultSelections);
        }
      } catch (error) {
        console.error('Error in useProductOptions:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleSelectOption = useCallback((optionId: string, valueId: string) => {
    setOptions(prevOptions => {
      const option = prevOptions.find(o => o.id === optionId);
      if (!option) return prevOptions;
      
      const value = option.values?.find(v => v.id === valueId);
      if (!value) return prevOptions;

      setSelectedOptions(prev => {
        const filtered = prev.filter(s => s.option_id !== optionId);
        return [...filtered, {
          option_id: optionId,
          option_name: option.name,
          value_id: valueId,
          value_name: value.value,
          price_modifier: value.price_modifier
        }];
      });
      return prevOptions;
    });
  }, []);

  const totalModifiers = useMemo(() => {
    return selectedOptions.reduce((acc, opt) => acc + Number(opt.price_modifier), 0);
  }, [selectedOptions]);

  const calculatedPrice = useMemo(() => {
    return basePrice + totalModifiers;
  }, [basePrice, totalModifiers]);

  const calculatedPromotionalPrice = useMemo(() => {
    return basePromotionalPrice ? basePromotionalPrice + totalModifiers : null;
  }, [basePromotionalPrice, totalModifiers]);

  return {
    options,
    selectedOptions,
    loading,
    handleSelectOption,
    calculatedPrice,
    calculatedPromotionalPrice,
    totalModifiers
  };
}
