'use client';

import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { X, Minus, Plus, ArrowRight } from 'lucide-react';

export function CartDrawer() {
  const { isOpen, closeCart, cartItems: items, removeFromCart: removeItem, increaseQuantity, decreaseQuantity, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);

  // Fechar ao pressionar ESC
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      closeCart();
    }
  }, [isOpen, closeCart]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Controlar o scroll do body e evento do teclado
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted) return null;

  const currentTotal = subtotal;
  const freeShippingThreshold = 2000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentTotal);
  const progressPercent = Math.min(100, (currentTotal / freeShippingThreshold) * 100);

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-400 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      
      {/* Sidebar / Drawer */}
      <aside 
        className={`fixed top-0 right-0 h-full w-[85vw] md:w-[400px] max-w-[100vw] bg-[#0B0B0B] z-[70] shadow-2xl border-l border-white/10 flex flex-col transform transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        
        {/* Drawer Header */}
        <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/5">
          <h2 className="font-serif text-[20px] md:text-[24px] text-[#e5e2e1] uppercase tracking-widest">
            Seu Carrinho
          </h2>
          <button 
            onClick={closeCart}
            className="text-white/40 hover:text-[#D4AF37] transition-colors duration-400 p-2 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded"
            aria-label="Fechar carrinho"
          >
            <X strokeWidth={2} className="w-6 h-6" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="px-6 md:px-8 py-6 bg-[#1c1b1b]/30">
            <div className="flex justify-between items-center mb-3">
              <span className="font-sans text-[10px] font-bold text-white/60 tracking-widest uppercase">
                {remainingForFreeShipping === 0 ? 'Frete Grátis Alcançado' : 'Frete Grátis'}
              </span>
              {remainingForFreeShipping > 0 && (
                <span className="font-sans font-bold text-[10px] text-[#D4AF37] tracking-widest">
                  Faltam {formatPrice(remainingForFreeShipping)}
                </span>
              )}
            </div>
            <div className="w-full h-[2px] bg-white/10 relative">
              <div 
                className="absolute top-0 left-0 h-full bg-[#D4AF37] transition-all duration-700" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-4 space-y-8 no-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <p className="font-sans text-[12px] font-bold tracking-widest text-[#D4AF37] uppercase">Vazia</p>
              <p className="text-sm font-sans mt-4 mb-8 text-[#e5e2e1]">Nenhuma joia foi selecionada.</p>
              <button 
                onClick={closeCart}
                className="w-full border border-white/20 text-white py-4 px-6 font-sans font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-white/5 active:scale-[0.98] transition-all duration-400"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-6 group">
                  <div className="w-20 md:w-24 h-24 md:h-28 bg-[#20201f] overflow-hidden border border-white/5 flex-shrink-0 relative">
                    <button 
                      onClick={() => removeItem(item.cartItemId)}
                      className="absolute top-1 left-1 md:top-2 md:left-2 z-10 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-black transition-colors"
                      aria-label="Remover item"
                    >
                      <X strokeWidth={2} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                    <Image 
                      src={item.images && item.images.length > 0 ? item.images[0] : 'https://picsum.photos/seed/placeholder/800/1000'}
                      alt={item.name}
                      width={96}
                      height={112}
                      className="w-full h-full object-cover brightness-90 grayscale group-hover:grayscale-0 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="flex flex-col justify-between py-1 flex-1">
                    <div>
                      <h3 className="font-serif text-sm md:text-base text-[#e5e2e1] mb-1 leading-tight">{item.name}</h3>
                      <p className="font-sans font-bold text-[10px] text-white/40 tracking-widest uppercase">
                        {item.category === 'aneis' ? 'Anel' : item.category === 'colares' ? 'Colar' : item.category === 'brincos' ? 'Brincos' : 'Pulseira'}
                      </p>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.selectedOptions.map(opt => (
                            <p key={opt.option_id} className="font-sans text-[10px] text-white/50">
                              <span className="font-bold text-[#D4AF37]/70 uppercase">{opt.option_name}:</span> {opt.value_name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="flex items-center border border-white/10 h-7 md:h-8">
                        <button 
                          onClick={() => decreaseQuantity(item.cartItemId)}
                          className="px-2 md:px-3 hover:text-[#D4AF37] transition-colors text-white/50"
                        >
                          <Minus strokeWidth={2} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        </button>
                        <span className="font-sans font-bold text-xs px-1 md:px-2 text-white">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => increaseQuantity(item.cartItemId)}
                          className="px-2 md:px-3 hover:text-[#D4AF37] transition-colors text-white/50"
                        >
                          <Plus strokeWidth={2} className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        </button>
                      </div>
                      
                      <span className="font-sans font-bold text-[12px] md:text-sm text-[#D4AF37] tracking-widest">
                        {formatPrice(item.promotional_price || item.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Upsell Section */}
              <div className="pt-8 border-t border-white/5">
                <h4 className="font-sans font-bold text-[11px] text-white/40 tracking-[0.2em] uppercase mb-6">Complete seu look</h4>
                <div className="flex gap-3 md:gap-4">
                  <div className="flex-1 bg-[#1c1b1b] p-3 md:p-4 border border-white/5 group cursor-pointer hover:border-[#D4AF37]/30 transition-colors duration-400">
                    <div className="w-full aspect-square relative mb-4">
                      <Image 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_2i7iJLfguxNoxZzd7ikl1JRJRfWyKULM5NyUF-p-3jBVT7vMslTyrsfCHirQsKo1oq1XzcxIFMWzipolhivjB-b97WN8VxyLK9BKulaZo4Cj0huiFLVfT9PH64PxdIHaPKLoSkC3xBiDsB3Ya3dHBK-0qTXkHTCqHI-vxAxqUcS6LIgcdpImt15KeYEWJcW2DK4ZmVcoXDOA3FRcFNF1LeBUVLDXbN7ob66wAc8vy33IFHrYnvmC0S5vRrJKSFOxkBN1DtHWA-g" 
                        alt="Anel Solitário" 
                        fill
                        className="object-cover brightness-75 grayscale group-hover:grayscale-0 transition-all" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="font-serif text-[10px] md:text-[12px] text-[#e5e2e1] text-center mb-1">Anel Solitário</p>
                    <p className="font-sans font-bold text-[8px] md:text-[10px] text-[#D4AF37] tracking-widest uppercase text-center">R$ 4.500,00</p>
                  </div>
                  <div className="flex-1 bg-[#1c1b1b] p-3 md:p-4 border border-white/5 group cursor-pointer hover:border-[#D4AF37]/30 transition-colors duration-400">
                    <div className="w-full aspect-square relative mb-4">
                      <Image 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1f62-Jcg95DG4a6czAg2eLrEGHk2TtrfL48KNR7PTF1qrlm52uwPrykQZ2m1Jj9kLyiswHuoqah1a2FcK3RaPbtkuUPGS0S8ggR98uQCLsRjwRWgI8J0_SFONT78lB_O9qbY_KPm5chomQMWpvcQ_PKBEFl4xFaoH6gBk0rV3fL1cWJfEROZM0LBZhD8eCvlgA7Ln7WOedT0lwX26BFveLeN1kA_WPrmPYQRjaVUU171py5x1ZCtk_0AsKT0jvRYSd-p5CrEo89E" 
                        alt="Kit Limpeza" 
                        fill
                        className="object-cover brightness-75 grayscale group-hover:grayscale-0 transition-all" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="font-serif text-[10px] md:text-[12px] text-[#e5e2e1] text-center mb-1">Kit Cuidados</p>
                    <p className="font-sans font-bold text-[8px] md:text-[10px] text-[#D4AF37] tracking-widest uppercase text-center">R$ 120,00</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 md:p-8 bg-[#0B0B0B] border-t border-white/10 space-y-4 md:space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-sans text-[12px] font-bold tracking-widest uppercase text-white/60">Subtotal</span>
              <span className="font-serif text-[20px] md:text-[24px] text-[#D4AF37]">{formatPrice(currentTotal)}</span>
            </div>
            
            <p className="text-[9px] md:text-[10px] font-sans font-bold text-white/30 text-center uppercase tracking-widest">Taxas e frete calculados no checkout</p>
            
            <div className="space-y-3">
              <Link 
                href="/checkout"
                onClick={closeCart}
                className="w-full bg-[#D4AF37] text-black py-4 md:py-5 font-sans font-bold uppercase text-[10px] md:text-[12px] tracking-[0.3em] hover:brightness-110 active:scale-[0.98] transition-all duration-400 flex items-center justify-center gap-3"
              >
                Finalizar Compra
                <ArrowRight strokeWidth={2} className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />
              </Link>
              
              <button 
                onClick={closeCart}
                className="w-full border border-white/20 text-white py-4 md:py-5 font-sans font-bold uppercase text-[10px] md:text-[12px] tracking-[0.3em] hover:bg-white/5 active:scale-[0.98] transition-all duration-400 flex items-center justify-center gap-3"
              >
                Continuar comprando
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
