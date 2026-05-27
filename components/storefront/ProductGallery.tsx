'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  isMadeToOrder?: boolean;
}

export function ProductGallery({ images, productName, isMadeToOrder }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Fallback se não houver nenhuma imagem
  const galleryImages = images.length > 0 
    ? images 
    : ['/images/placeholder-premium.svg'];

  const mainImage = galleryImages[activeIdx] || galleryImages[0];

  return (
    <section className="flex flex-col md:flex-row-reverse gap-4 w-full">
      {/* Imagem Principal Premium Destaque */}
      <div className="w-full aspect-square bg-[#1A1A1A] overflow-hidden relative border border-white/5">
        {isMadeToOrder && (
          <div className="absolute top-6 right-6 z-10 px-3 py-1 bg-[#131313]/70 backdrop-blur-md border border-[#d4af37]/30 shadow-md">
            <span className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold">
              ✦ Sob Encomenda
            </span>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full relative"
          >
            <Image
              src={mainImage}
              alt={`${productName} — Imagem ${activeIdx + 1}`}
              fill
              className="object-cover object-center"
              priority
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Miniaturas Secundárias (Thumbs) - Oculta se houver apenas 1 imagem */}
      {galleryImages.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto no-scrollbar md:w-20 w-full pt-2 md:pt-0">
          {galleryImages.map((img, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 relative overflow-hidden transition-all duration-300 ${
                  isActive 
                    ? 'border border-[#d4af37] scale-102 opacity-100' 
                    : 'border border-white/10 opacity-55 hover:opacity-100 hover:scale-102'
                }`}
              >
                <Image 
                  src={img} 
                  alt={`${productName} thumb ${idx + 1}`} 
                  fill 
                  className="object-cover" 
                  referrerPolicy="no-referrer"
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
