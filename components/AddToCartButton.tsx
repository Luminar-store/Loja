'use client';

import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/data';
import { useState } from 'react';
import { ProductRow } from '@/services/product.service';
import { SelectedOption } from '@/types/product-options';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  product: ProductRow;
  isBottomBar?: boolean;
  selectedOptions?: SelectedOption[];
  currentPrice?: number;
}

export function AddToCartButton({ product, isBottomBar, selectedOptions, currentPrice }: AddToCartButtonProps) {
  const { addToCart, openCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const displayPrice = currentPrice ?? (product.promotional_price || product.price);

  const handleAdd = () => {
    if (product.status === 'Esgotado') return;
    setIsAdding(true);
    addToCart(product, selectedOptions);
    setTimeout(() => {
      setIsAdding(false);
      openCart();
    }, 500); // give it a small feedback delay
  };

  if (isBottomBar) {
    return (
      <button 
        onClick={handleAdd}
        className={`w-full h-full flex items-center justify-center gap-2 transition-all ${
          product.status === 'Esgotado' 
            ? 'bg-[#333] text-white/50 cursor-not-allowed' 
            : 'bg-[#D4AF37] text-black hover:brightness-110 active:scale-95'
        }`}
        disabled={isAdding || product.status === 'Esgotado'}
      >
        <ShoppingCart strokeWidth={2} className="w-5 h-5 fill-current" />
        <span className="font-sans text-[12px] font-bold uppercase tracking-[0.2em]">{product.status === 'Esgotado' ? 'Esgotado' : (isAdding ? 'Adicionando...' : 'Comprar agora')}</span>
      </button>
    );
  }

  return (
    <button 
      onClick={handleAdd}
      className={`w-full font-sans text-[12px] font-bold px-12 py-5 tracking-[0.2em] uppercase transition-all ${
        product.status === 'Esgotado' 
          ? 'bg-[#333] text-white/50 cursor-not-allowed' 
          : 'bg-[#D4AF37] text-black hover:brightness-110 active:scale-[0.98] cursor-pointer'
      }`}
      disabled={isAdding || product.status === 'Esgotado'}
    >
      {product.status === 'Esgotado' ? 'Esgotado' : (isAdding ? 'Adicionando...' : `Adicionar à Seleção — ${formatPrice(displayPrice)}`)}
    </button>
  );
}
