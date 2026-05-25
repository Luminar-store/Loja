'use client';

import React, { useState, useEffect } from 'react';

export function WhatsAppButton() {
  const phoneNumber = '5575988313060';
  const message = 'Olá! Vim pelo site da Luminar Joias e gostaria de saber mais sobre os produtos.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelper(true);
      setTimeout(() => setShowHelper(false), 5000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-[80px] md:bottom-4 right-4 z-50 flex items-end justify-end pointer-events-none">
      {/* Helper message */}
      <div 
        className={`absolute right-[70px] bottom-2 bg-white text-black text-xs font-sans px-5 py-4 rounded-lg shadow-2xl shadow-black/40 whitespace-nowrap transition-all duration-500 origin-bottom-right ${showHelper ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}
      >
        <span className="font-bold block mb-1 text-[10px] uppercase tracking-widest text-[#D4AF37]">Luminar Joias</span>
        Precisa de ajuda? Fale com nossa equipe
        <div className="absolute right-[-6px] bottom-5 w-4 h-4 bg-white transform rotate-45 rounded-sm"></div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center justify-center w-[54px] h-[54px] bg-[#25D366] text-white rounded-full shadow-[0_4px_16px_rgba(37,211,102,0.3)] hover:scale-105 hover:shadow-[0_6px_20px_rgba(37,211,102,0.4)] transition-all duration-300 group relative"
        aria-label="Fale conosco no WhatsApp"
        title="Fale conosco no WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[28px] h-[28px]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
        
        {/* Pulse effect sutil */}
        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse opacity-20 pointer-events-none"></div>
        
        {/* Tooltip */}
        <div className={`absolute right-full mr-4 bg-[#111] text-white/90 text-[10px] font-sans border border-white/5 font-bold tracking-widest uppercase px-3 py-2 rounded-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max ${showHelper ? 'hidden' : ''}`}>
          Fale conosco no WhatsApp
        </div>
      </a>
    </div>
  );
}
