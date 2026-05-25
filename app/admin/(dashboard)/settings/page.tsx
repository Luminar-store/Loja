'use client';

import { motion } from 'motion/react';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Configurações</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie as preferências e integrações da loja.</p>
        </div>
        <button className="bg-[#d4af37] text-black px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#ebd070] transition-colors flex items-center gap-2 w-fit">
          <Save className="w-4 h-4" /> Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium bg-[#d4af37]/10 text-[#d4af37] transition-colors">
            Geral
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            WhatsApp
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            Frete
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            Cupons
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Informações da Loja</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Nome da Loja</label>
                <input type="text" defaultValue="Luminar Joias" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Email de Contato</label>
                <input type="email" defaultValue="contato@luminarjoias.com" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Moeda Padrão</label>
              <select className="w-full sm:w-1/2 bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors">
                <option>BRL (R$)</option>
                <option>USD ($)</option>
                <option>EUR (€)</option>
              </select>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <div className="flex items-center justify-between pointer-events-none">
              <div>
                <h2 className="text-lg font-serif">Integração WhatsApp</h2>
                <p className="text-white/50 text-sm mt-1">Configure o botão flutuante e mensagens.</p>
              </div>
              <div className="relative pointer-events-auto">
                <input type="checkbox" id="toggle" className="sr-only" defaultChecked />
                <label htmlFor="toggle" className="flex items-center cursor-pointer">
                  <div className="relative w-10 h-6 bg-[#d4af37] rounded-full">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-black rounded-full transition transform translate-x-4"></div>
                  </div>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Número do WhatsApp</label>
              <input type="text" defaultValue="5575988313060" className="w-full sm:w-1/2 bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Mensagem Automática</label>
              <textarea rows={3} defaultValue="Olá! Vim pelo site da Luminar Joias e gostaria de saber mais sobre os produtos." className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors resize-none"></textarea>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
