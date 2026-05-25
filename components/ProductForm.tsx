'use client';

import { ProductRow } from '@/services/product.service';
import { useProductOptions } from '@/hooks/useProductOptions';
import { ProductVariantSelector } from './ProductVariantSelector';
import { AddToCartButton } from './AddToCartButton';
import { formatPrice } from '@/lib/data';
import { FadeIn } from './animations';
import { Heart } from 'lucide-react';

interface ProductFormProps {
  product: ProductRow;
}

export function ProductForm({ product }: ProductFormProps) {
  const {
    options,
    selectedOptions,
    loading,
    handleSelectOption,
    calculatedPrice,
    calculatedPromotionalPrice
  } = useProductOptions(product.id, product.price, product.promotional_price);

  return (
    <>
      <FadeIn delay={0.4} direction="left">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-sans text-[18px] md:text-[24px] font-bold tracking-widest text-[#D4AF37]">
            {formatPrice(calculatedPromotionalPrice || calculatedPrice)}
          </span>
          {calculatedPromotionalPrice && (
            <span className="font-sans text-[14px] text-white/50 tracking-wider mix-blend-difference line-through">
              {formatPrice(calculatedPrice)}
            </span>
          )}
        </div>
        <p className="font-sans text-[12px] text-white/50 uppercase tracking-widest font-bold">
          Ou 10x de {formatPrice((calculatedPromotionalPrice || calculatedPrice) / 10)}
        </p>
      </FadeIn>

      <ProductVariantSelector 
        options={options} 
        selectedOptions={selectedOptions} 
        onSelectOption={handleSelectOption} 
        loading={loading} 
      />

      <FadeIn delay={0.7} direction="left" className="pt-4 space-y-4">
        {/* We need to update AddToCartButton to accept selectedOptions */}
        <AddToCartButton product={product} selectedOptions={selectedOptions} currentPrice={calculatedPromotionalPrice || calculatedPrice} />
        <p className="text-center font-sans text-[10px] text-white/50 uppercase tracking-widest font-bold">
          ✦ Produção sob encomenda: 7 a 15 dias úteis.
        </p>
      </FadeIn>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[#0B0B0B] border-t border-[#D4AF37]/30 z-40 lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="h-16 grid grid-cols-2">
          <button className="text-white flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
            <Heart className="w-5 h-5" strokeWidth={2} />
            <span className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] hidden sm:block">Lista de desejos</span>
          </button>
          <div className="h-full">
            <AddToCartButton product={product} selectedOptions={selectedOptions} currentPrice={calculatedPromotionalPrice || calculatedPrice} isBottomBar />
          </div>
        </div>
      </div>
    </>
  );
}
