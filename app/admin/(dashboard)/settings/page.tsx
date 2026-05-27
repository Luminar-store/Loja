'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Loader2, Settings, MessageCircle, Globe, Sparkles } from 'lucide-react';
import { settingsService } from '@/services/settings.service';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'whatsapp' | 'seo'>('general');

  // Configurações unificadas
  const [settings, setSettings] = useState({
    // Geral
    store_name: 'Luminar Joias',
    contact_email: 'contato@luminarjoias.com',
    store_currency: 'BRL (R$)',
    
    // WhatsApp
    whatsapp_enabled: true,
    whatsapp_number: '5575988313060',
    whatsapp_message: 'Olá! Vim pelo site da Luminar Joias e gostaria de saber mais sobre as peças.',
    
    // SEO
    seo_title: 'Luminar Joias — Alta Joalheria Exclusiva',
    seo_description: 'Descubra joias premium criadas sob encomenda com ouro certificado, brilhantes e acabamento artesanal de luxo.'
  });

  // Carrega configurações ao iniciar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        const [
          storeName,
          contactEmail,
          storeCurrency,
          whatsappEnabled,
          whatsappNumber,
          whatsappMessage,
          seoTitle,
          seoDescription
        ] = await Promise.all([
          settingsService.getSetting('store_name', 'Luminar Joias'),
          settingsService.getSetting('contact_email', 'contato@luminarjoias.com'),
          settingsService.getSetting('store_currency', 'BRL (R$)'),
          settingsService.getSetting('whatsapp_enabled', true),
          settingsService.getSetting('whatsapp_number', '5575988313060'),
          settingsService.getSetting('whatsapp_message', 'Olá! Vim pelo site da Luminar Joias e gostaria de saber mais sobre as peças.'),
          settingsService.getSetting('seo_title', 'Luminar Joias — Alta Joalheria Exclusiva'),
          settingsService.getSetting('seo_description', 'Descubra joias premium criadas sob encomenda com ouro certificado, brilhantes e acabamento artesanal de luxo.')
        ]);

        setSettings({
          store_name: storeName,
          contact_email: contactEmail,
          store_currency: storeCurrency,
          whatsapp_enabled: whatsappEnabled,
          whatsapp_number: whatsappNumber,
          whatsapp_message: whatsappMessage,
          seo_title: seoTitle,
          seo_description: seoDescription
        });
      } catch (err: any) {
        toast.error('Erro ao carregar as configurações do banco.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setSettings(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Salva no banco de dados Supabase via settingsService (KV Store)
  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Salva cada chave individualmente com tipo e grupo corretos
      await settingsService.setSetting('store_name', settings.store_name, 'string', 'general');
      await settingsService.setSetting('contact_email', settings.contact_email, 'string', 'general');
      await settingsService.setSetting('store_currency', settings.store_currency, 'string', 'general');
      
      await settingsService.setSetting('whatsapp_enabled', settings.whatsapp_enabled, 'boolean', 'whatsapp');
      await settingsService.setSetting('whatsapp_number', settings.whatsapp_number, 'string', 'whatsapp');
      await settingsService.setSetting('whatsapp_message', settings.whatsapp_message, 'string', 'whatsapp');
      
      await settingsService.setSetting('seo_title', settings.seo_title, 'string', 'seo');
      await settingsService.setSetting('seo_description', settings.seo_description, 'string', 'seo');

      toast.success('Configurações salvas e cache do site revalidado!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Configurações</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie as preferências e parâmetros globais da Luminar.</p>
        </div>
        <button 
          disabled={saving}
          onClick={handleSaveSettings}
          className="bg-[#d4af37] text-black px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#ebd070] transition-colors flex items-center gap-2 w-fit disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          {saving ? 'Publicando...' : 'Publicar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Abas Laterais */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'general' 
                ? 'bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Geral
          </button>
          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'whatsapp' 
                ? 'bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            WhatsApp
          </button>
          <button 
            onClick={() => setActiveTab('seo')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'seo' 
                ? 'bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            SEO / Metatags
          </button>
        </div>

        {/* Formulários por Aba */}
        <div className="md:col-span-3">
          {activeTab === 'general' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
            >
              <h2 className="text-md font-serif text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <Settings className="w-4 h-4 text-[#d4af37]" />
                Informações da Loja
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Nome da Loja</label>
                  <input 
                    type="text" 
                    name="store_name"
                    value={settings.store_name} 
                    onChange={handleInputChange}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Email de Contato</label>
                  <input 
                    type="email" 
                    name="contact_email"
                    value={settings.contact_email} 
                    onChange={handleInputChange}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Moeda Padrão</label>
                <select 
                  name="store_currency"
                  value={settings.store_currency}
                  onChange={handleInputChange}
                  className="w-full sm:w-1/2 bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none transition-colors"
                >
                  <option value="BRL (R$)">BRL (R$)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>
            </motion.div>
          )}

          {activeTab === 'whatsapp' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-md font-serif text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#d4af37]" />
                  Integração WhatsApp
                </h2>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    id="whatsapp_enabled"
                    name="whatsapp_enabled"
                    checked={settings.whatsapp_enabled}
                    onChange={e => setSettings(prev => ({ ...prev, whatsapp_enabled: e.target.checked }))}
                    className="sr-only" 
                  />
                  <label htmlFor="whatsapp_enabled" className="flex items-center cursor-pointer select-none">
                    <div className={`relative w-10 h-6 rounded-full transition-colors ${settings.whatsapp_enabled ? 'bg-[#d4af37]' : 'bg-[#1A1A1A] border border-white/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform ${settings.whatsapp_enabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Número do WhatsApp (Código do País + DDD)</label>
                <input 
                  type="text" 
                  name="whatsapp_number"
                  value={settings.whatsapp_number}
                  onChange={handleInputChange}
                  placeholder="Ex: 5575988313060"
                  className="w-full sm:w-1/2 bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Mensagem Automática Inicial</label>
                <textarea 
                  rows={3} 
                  name="whatsapp_message"
                  value={settings.whatsapp_message}
                  onChange={handleInputChange}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none transition-colors resize-none"
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'seo' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
            >
              <h2 className="text-md font-serif text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <Globe className="w-4 h-4 text-[#d4af37]" />
                Indexação e SEO Global
              </h2>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Título de SEO Padrão (Meta Title)</label>
                <input 
                  type="text" 
                  name="seo_title"
                  value={settings.seo_title}
                  onChange={handleInputChange}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none transition-colors" 
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Descrição SEO Padrão (Meta Description)</label>
                <textarea 
                  rows={4} 
                  name="seo_description"
                  value={settings.seo_description}
                  onChange={handleInputChange}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none transition-colors resize-none"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
