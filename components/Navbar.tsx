'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import { Menu, ShoppingBag, ShoppingCart, Heart, X, MapPin } from 'lucide-react';

export function Navbar() {
  const { openCart, totalItems } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const itemCount = totalItems;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isScrolled ? 'bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/10' : 'bg-[#0B0B0B]/40 border-b border-transparent backdrop-blur-sm'
        } h-20 px-6 sm:px-10 lg:px-16 flex justify-between items-center`}
      >
        <div className="flex items-center justify-start min-w-[50px]">
          <button 
            className="text-[#D4AF37] hover:text-white transition-colors duration-400"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu strokeWidth={2} className="w-6 h-6" />
          </button>
        </div>

        <Link href="/" className="text-xl font-serif tracking-[0.3em] text-[#D4AF37] uppercase flex-1 text-center">
          LUMINAR JOIAS
        </Link>

        <div className="flex items-center justify-end gap-4 min-w-[50px]">
          <button 
            onClick={openCart}
            className="relative text-[#D4AF37] hover:text-white transition-colors duration-400"
          >
            <ShoppingBag strokeWidth={2} className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#f2ca50] text-[#241a00] text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0B0B0B] border-t border-[#D4AF37]/30 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="h-16 grid grid-cols-2">
          <button 
            onClick={openCart}
            className="bg-[#D4AF37] text-black w-full h-full flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <ShoppingCart strokeWidth={2} className="w-5 h-5" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest">
              {itemCount > 0 ? `Comprar (${itemCount})` : 'Comprar agora'}
            </span>
          </button>
          <Link 
            href="/categoria"
            className="text-white w-full h-full flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Heart strokeWidth={2} className="w-5 h-5" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest">Desejos</span>
          </Link>
        </div>
      </nav>

      {/* Mobile/Desktop Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0B]/95 backdrop-blur-3xl flex flex-col pt-24 px-6 pb-12">
          <button 
            className="absolute top-6 left-6 text-white hover:text-[#D4AF37] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X strokeWidth={2} className="w-8 h-8" />
          </button>
          
          <nav className="flex flex-col gap-8 mt-12 items-center text-center">
            <Link 
              href="/" 
              className="font-serif text-3xl text-white hover:text-[#D4AF37] transition-colors uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              href="/categoria" 
              className="font-serif text-3xl text-white hover:text-[#D4AF37] transition-colors uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Coleções
            </Link>
            <Link 
              href="/personalizados" 
              className="font-serif text-3xl text-white hover:text-[#D4AF37] transition-colors uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Personalizados
            </Link>
            <Link 
              href="/rastreio" 
              className="font-serif text-3xl text-white hover:text-[#D4AF37] transition-colors uppercase tracking-widest"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rastreio
            </Link>
          </nav>

          <div className="mt-auto text-center border-t border-white/5 pt-8">
            <p className="font-sans text-[10px] text-white/50 tracking-widest uppercase mb-4">
              Acompanhe sua produção
            </p>
            <Link href="/rastreio" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center gap-2 border border-[#D4AF37] text-[#D4AF37] px-6 py-3 font-sans text-xs uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors">
              <MapPin strokeWidth={2} className="w-4 h-4" />
              Status do Pedido
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
