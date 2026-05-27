'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const [phoneNumber, setPhoneNumber] = useState('5575988313060');
  const [storeName, setStoreName] = useState('Luminar Joias');
  const [showHelper, setShowHelper] = useState(false);

  // Carrega as configurações VIP em tempo real da KV Store settings do Supabase (Zero Mocks)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('key, value');
        
        if (data && data.length > 0) {
          const phoneSetting = data.find(s => s.key === 'whatsapp_number');
          const nameSetting = data.find(s => s.key === 'store_name');
          if (phoneSetting) setPhoneNumber(phoneSetting.value);
          if (nameSetting) setStoreName(nameSetting.value);
        }
      } catch (err) {
        console.error('[Concierge Widget] Erro ao carregar configurações de WhatsApp:', err);
      }
    };
    loadSettings();

    // Timer cinematográfico de entrada da mensagem VIP de ajuda
    const timer = setTimeout(() => {
      setShowHelper(true);
      setTimeout(() => setShowHelper(false), 6000);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const message = `Olá! Vim pela storefront da ${storeName} e gostaria de um atendimento personalizado Concierge sobre a coleção de alta joalheria.`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-[84px] md:bottom-6 right-4 z-50 flex items-end justify-end pointer-events-none select-none">
      
      {/* Helper message Concierge Dourada / Arestas 1px (Luxury style) */}
      <div 
        className={`absolute right-[64px] bottom-1 bg-[#101010] text-[#e5e2e1] text-xs font-sans p-5 border border-[#d4af37]/30 shadow-2xl whitespace-nowrap transition-all duration-500 origin-bottom-right rounded-none ${showHelper ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}
      >
        <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" />
          <span>Atendimento Concierge</span>
        </div>
        <p className="text-[10px] text-white/70 font-light">Seu mestre joalheiro pessoal está online.</p>
        <p className="text-[10px] text-white/70 font-light mt-0.5">Deseja atendimento exclusivo via WhatsApp VIP?</p>
        
        {/* Seta dourada minimalista */}
        <div className="absolute right-[-5px] bottom-4 w-2 h-2 bg-[#101010] border-t border-r border-[#d4af37]/30 transform rotate-45"></div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center justify-center w-[50px] h-[50px] bg-[#121211] text-[#D4AF37] border border-[#d4af37]/40 shadow-xl hover:scale-105 hover:bg-[#d4af37] hover:text-black transition-all duration-300 group relative rounded-none"
        aria-label="Atendimento Concierge WhatsApp VIP"
        title="Atendimento Concierge WhatsApp VIP"
      >
        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
        
        {/* Glow effect sutil dourado */}
        <div className="absolute inset-0 border border-[#d4af37]/40 group-hover:border-[#d4af37] animate-pulse opacity-40 pointer-events-none rounded-none"></div>
      </a>
    </div>
  );
}
