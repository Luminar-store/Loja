'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Layout, 
  Save, 
  Loader2, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Settings, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cmsService, StorefrontSectionRow } from '@/services/cms.service';
import toast from 'react-hot-toast';

export default function CMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<StorefrontSectionRow[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Carrega todas as seções cadastradas no Supabase
  useEffect(() => {
    const loadSections = async () => {
      try {
        const data = await cmsService.listAllSections();
        setSections(data);
        if (data.length > 0) {
          setActiveSectionId(data[0].id);
        }
      } catch (err: any) {
        toast.error('Erro ao carregar as seções do CMS.');
      } finally {
        setLoading(false);
      }
    };
    loadSections();
  }, []);

  // Mover seções de posição (reordenação vertical premium estável)
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...sections];

    // Swap de posições no array
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Ajusta o campo de posição (position) sequencialmente
    const reordered = updated.map((sec, idx) => ({
      ...sec,
      position: idx
    }));

    setSections(reordered);
  };

  // Alternar estado ativo/inativo da seção (is_active)
  const handleToggleActive = (index: number) => {
    const updated = [...sections];
    updated[index].is_active = !updated[index].is_active;
    setSections(updated);
    toast.success(`Seção "${updated[index].section_key.toUpperCase()}" ${updated[index].is_active ? 'ativada' : 'desativada'}!`);
  };

  // Alterar campos de payload JSONB
  const handlePayloadChange = (sectionId: string, key: string, value: any) => {
    setSections(prev => 
      prev.map(sec => {
        if (sec.id === sectionId) {
          const currentPayload = (sec.payload as Record<string, any>) || {};
          return {
            ...sec,
            payload: {
              ...currentPayload,
              [key]: value
            }
          };
        }
        return sec;
      })
    );
  };

  // Salvar alterações de ordenação e payloads no banco de dados real
  const handleSaveCMS = async () => {
    try {
      setSaving(true);

      // 1. Salva a nova ordem e status das seções
      const orderPayload = sections.map((sec, idx) => ({
        id: sec.id,
        position: idx,
        is_active: sec.is_active
      }));
      await cmsService.updateSectionsOrder(orderPayload);

      // 2. Atualiza individualmente os payloads JSONB modificados
      for (const sec of sections) {
        await cmsService.updateSection(sec.id, {
          payload: sec.payload || {}
        });
      }

      toast.success('Homepage CMS salva e cache revalidado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar as configurações do CMS.');
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

  const activeSection = sections.find(s => s.id === activeSectionId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">CMS Homepage</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie a ordem, visibilidade e os textos das seções da sua storefront pública.</p>
        </div>
        <button
          disabled={saving}
          onClick={handleSaveCMS}
          className="px-6 py-2.5 bg-[#d4af37] text-black text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#ebd070] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
          {saving ? 'Publicando...' : 'Publicar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de Seções com Ordenação Lateral */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#131313] border border-white/5 p-4 rounded-2xl">
            <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4 px-2 font-bold">Estrutura Visual da Home</h2>
            <div className="space-y-2">
              {sections.map((sec, idx) => {
                const isSelected = sec.id === activeSectionId;
                return (
                  <div 
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[#d4af37]/10 border-[#d4af37] text-white shadow-sm' 
                        : 'bg-[#1A1A1A] border-white/5 hover:border-white/15 text-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Layout className={`w-4 h-4 ${isSelected ? 'text-[#d4af37]' : 'text-white/30'}`} />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest font-mono">
                          {sec.section_key}
                        </span>
                        <span className="text-[10px] text-white/40 block mt-0.5">Posição #{idx + 1}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {/* Ativar/Desativar */}
                      <button 
                        type="button"
                        onClick={() => handleToggleActive(idx)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          sec.is_active 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                        title={sec.is_active ? 'Seção Ativa' : 'Seção Oculta'}
                      >
                        {sec.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Reordenação */}
                      <div className="flex flex-col gap-0.5 border border-white/10 rounded-lg p-0.5 bg-black/40">
                        <button 
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up')}
                          className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down')}
                          className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor de Payload Customizado por Seção */}
        <div className="lg:col-span-7">
          {activeSection ? (
            <motion.div 
              key={activeSection.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold font-mono uppercase tracking-wider rounded">
                      Seção CMS
                    </span>
                    <h2 className="text-lg font-serif text-white uppercase tracking-wider">{activeSection.section_key}</h2>
                  </div>
                  <p className="text-xs text-white/40 mt-1">Configure os textos e botões específicos desta seção da vitrine.</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeSection.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-white/60 font-medium">{activeSection.is_active ? 'Visível na Home' : 'Oculta na Home'}</span>
                </div>
              </div>

              {/* Formulários dinâmicos baseados no tipo de section_key */}
              <div className="space-y-4 pt-2">
                {activeSection.section_key === 'hero' && (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Título de Destaque</label>
                      <input 
                        type="text" 
                        value={(activeSection.payload as any)?.title || ''} 
                        onChange={e => handlePayloadChange(activeSection.id, 'title', e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                        placeholder="Joias premium criadas para marcar presença" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Subtítulo Exclusivo (Linha superior)</label>
                      <input 
                        type="text" 
                        value={(activeSection.payload as any)?.subtitle || ''} 
                        onChange={e => handlePayloadChange(activeSection.id, 'subtitle', e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                        placeholder="ELEGÂNCIA ETERNA" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Texto de Apoio</label>
                      <textarea 
                        rows={3}
                        value={(activeSection.payload as any)?.description || ''} 
                        onChange={e => handlePayloadChange(activeSection.id, 'description', e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors resize-none"
                        placeholder="Design sofisticado, acabamento refinado e produção sob encomenda..." 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Texto do Botão CTA</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.button_text || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'button_text', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="Explorar Coleção" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Link do Botão CTA</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.button_link || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'button_link', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="/categoria" 
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection.section_key === 'benefits' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 italic mb-4">Esta seção exibe até 3 benefícios institucionais importantes na home.</p>
                    <div className="p-4 border border-white/5 rounded-xl bg-black/20 space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Benefício 1 — Título</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.benefit1_title || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'benefit1_title', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 px-3 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="Frete Grátis" 
                        />
                      </div>
                    </div>
                    <div className="p-4 border border-white/5 rounded-xl bg-black/20 space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Benefício 2 — Título</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.benefit2_title || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'benefit2_title', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 px-3 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="Garantia Vitalícia" 
                        />
                      </div>
                    </div>
                    <div className="p-4 border border-white/5 rounded-xl bg-black/20 space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Benefício 3 — Título</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.benefit3_title || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'benefit3_title', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 px-3 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="Embalagem Luxo" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection.section_key === 'featured' && (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Título da Vitrine Destaques</label>
                      <input 
                        type="text" 
                        value={(activeSection.payload as any)?.title || ''} 
                        onChange={e => handlePayloadChange(activeSection.id, 'title', e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                        placeholder="Best Sellers" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Limite Máximo de Joias Exibidas</label>
                      <input 
                        type="number" 
                        min="1"
                        max="12"
                        value={(activeSection.payload as any)?.limit || 4} 
                        onChange={e => handlePayloadChange(activeSection.id, 'limit', Number(e.target.value))}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                        placeholder="4" 
                      />
                    </div>
                  </>
                )}

                {activeSection.section_key === 'categories' && (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Título da Seção de Categorias</label>
                      <input 
                        type="text" 
                        value={(activeSection.payload as any)?.title || ''} 
                        onChange={e => handlePayloadChange(activeSection.id, 'title', e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                        placeholder="Coleções Exclusivas" 
                      />
                    </div>
                    <p className="text-xs text-white/40 italic">As categorias exibidas serão carregadas automaticamente do banco de dados remetendo àquelas marcadas como destaque (`is_featured = true`) no painel administrativo.</p>
                  </>
                )}

                {activeSection.section_key === 'cta' && (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Frase de Destaque Final</label>
                      <textarea 
                        rows={3}
                        value={(activeSection.payload as any)?.title || ''} 
                        onChange={e => handlePayloadChange(activeSection.id, 'title', e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors resize-none"
                        placeholder="Cada peça é produzida sob encomenda, garantindo exclusividade e atenção aos detalhes." 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Texto do Botão CTA 1</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.button_text || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'button_text', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="Explorar Coleção" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Link do Botão CTA 1</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.button_link || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'button_link', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="/categoria" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Texto do Botão CTA 2 (Sob Encomenda)</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.button_order_text || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'button_order_text', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="Personalizar Joia" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Link do Botão CTA 2 (Sob Encomenda)</label>
                        <input 
                          type="text" 
                          value={(activeSection.payload as any)?.button_order_link || ''} 
                          onChange={e => handlePayloadChange(activeSection.id, 'button_order_link', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors"
                          placeholder="/personalizados" 
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-64 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-white/30 text-sm">
              Selecione uma seção ao lado para editar seus conteúdos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
