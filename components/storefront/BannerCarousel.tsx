'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BannerRow } from '@/services/banner.service';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BannerCarouselProps {
  banners: BannerRow[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide a cada 6 segundos se houver mais de 1 banner
  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    // Banner padrão de luxo com fallback se nenhum banner estiver no Supabase
    return (
      <section className="relative h-[100dvh] min-h-[700px] w-full flex items-center justify-center overflow-hidden bg-[#131313]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/40 to-[#0B0B0B] opacity-90 block"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mt-16">
          <span className="font-sans text-[#f2ca50] text-[12px] font-bold uppercase tracking-[0.4em] mb-6 block">Alta Joalheria Exclusiva</span>
          <h1 className="font-serif text-5xl md:text-[64px] text-[#e5e2e1] mb-6 leading-tight">
            Joias premium criadas para <br/><span className="italic font-light text-[#D4AF37]">marcar presença.</span>
          </h1>
          <p className="font-sans text-white/70 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Design sofisticado, acabamento refinado e produção sob encomenda.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link href="/categoria" className="bg-[#d4af37] text-[#241a00] px-12 sm:px-32 py-4 font-sans text-[12px] font-bold uppercase tracking-widest transition-all duration-400 hover:brightness-110 active:scale-95">
              Explorar Coleção
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentIndex];

  return (
    <section className="relative h-[100dvh] min-h-[700px] w-full overflow-hidden bg-[#131313]">
      {/* Slides com AnimatePresence */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Tag picture para suporte de imagens duais responsivas e leves no Mobile */}
            <picture className="w-full h-full">
              <source media="(max-width: 768px)" srcSet={currentBanner.mobile_image_url || currentBanner.desktop_image_url} />
              <img 
                src={currentBanner.desktop_image_url} 
                alt={currentBanner.title} 
                className={`w-full h-full object-center pointer-events-none transition-all duration-350 ${
                  currentBanner.hide_overlay 
                    ? 'object-contain md:object-cover bg-[#131313]' 
                    : 'object-cover'
                }`}
                referrerPolicy="no-referrer"
              />
            </picture>
            
            {/* Overlay Gradiente de Luxo */}
            {!currentBanner.hide_overlay && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#131313] opacity-90"></div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Conteúdo Dinâmico Centralizado */}
      {!currentBanner.hide_overlay ? (
        <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-6 sm:px-16 flex flex-col justify-center items-center text-center mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-4xl space-y-6"
            >
              {currentBanner.subtitle && (
                <span className="font-sans text-[#f2ca50] text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.4em] block">
                  {currentBanner.subtitle}
                </span>
              )}
              
              <h1 className="font-serif text-4xl sm:text-6xl md:text-[64px] text-[#e5e2e1] leading-tight tracking-wide">
                {currentBanner.title}
              </h1>

              <div className="w-12 h-[1px] bg-[#f2ca50]/50 mx-auto my-4"></div>

              {/* Ações / Botão CTA */}
              {currentBanner.link_url && (
                <div className="pt-6">
                  <Link 
                    href={currentBanner.link_url} 
                    className="inline-flex items-center gap-2 bg-[#d4af37] text-[#241a00] px-12 py-4 font-sans text-[11px] font-bold uppercase tracking-widest transition-all duration-400 hover:brightness-110 active:scale-95 shadow-lg shadow-[#d4af37]/10"
                  >
                    {currentBanner.button_text || 'Explorar Coleção'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Se hide_overlay for verdadeiro, o banner inteiro vira um grande link absoluto sobreposto */
        currentBanner.link_url && (
          <Link 
            href={currentBanner.link_url}
            className="absolute inset-0 z-10 w-full h-full cursor-pointer"
            aria-label={`Visualizar detalhes do banner: ${currentBanner.title}`}
          />
        )
      )}

      {/* Setas Laterais de Navegação (Apenas se houver múltiplos banners) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={handlePrev} 
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 border border-white/10 rounded-full bg-black/40 hover:bg-black/60 hover:border-white/30 text-white transition-all z-20"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNext} 
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 border border-white/10 rounded-full bg-black/40 hover:bg-black/60 hover:border-white/30 text-white transition-all z-20"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicadores de Posição */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-[#d4af37] w-6' : 'bg-white/30 hover:bg-white/50'}`}
                aria-label={`Ir para o banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
