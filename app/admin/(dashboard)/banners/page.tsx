'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  UploadCloud, 
  Link as LinkIcon,
  X,
  Edit2
} from 'lucide-react';
import { bannerService, BannerRow } from '@/services/banner.service';
import { storageService } from '@/services/storage.service';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function BannersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'desktop' | 'mobile' | null>(null);

  // Form local para criação e edição de banner
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    desktop_image_url: '',
    mobile_image_url: '',
    link_url: '',
    button_text: 'Ver Detalhes',
    is_active: true,
    hide_overlay: false
  });

  const loadBanners = async () => {
    try {
      const data = await bannerService.listBanners();
      setBanners(data);
    } catch (err: any) {
      toast.error('Erro ao carregar banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBanners();
  }, []);

  const handleSelectFromStorage = (urls: string[]) => {
    if (urls.length === 0 || !mediaTarget) return;

    const selectedUrl = urls[0];
    setFormData(prev => ({
      ...prev,
      [mediaTarget === 'desktop' ? 'desktop_image_url' : 'mobile_image_url']: selectedUrl
    }));

    toast.success(`Imagem ${mediaTarget} selecionada do Storage!`);
    setMediaTarget(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Upload e compressão de imagens
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const isDesktop = type === 'desktop';

      if (isDesktop) setUploadingDesktop(true);
      else setUploadingMobile(true);

      try {
        const slug = formData.title ? formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'banner';
        const url = await storageService.uploadImage(file, 'banners', `${slug}_${type}`);
        
        setFormData(prev => ({
          ...prev,
          [isDesktop ? 'desktop_image_url' : 'mobile_image_url']: url
        }));
        
        toast.success(`Imagem ${type} carregada com compressão WebP!`);
      } catch (error: any) {
        toast.error(`Erro no upload: ${error.message}`);
      } finally {
        if (isDesktop) setUploadingDesktop(false);
        else setUploadingMobile(false);
      }
    }
  };

  // Limpa formulário
  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      desktop_image_url: '',
      mobile_image_url: '',
      link_url: '',
      button_text: 'Ver Detalhes',
      is_active: true,
      hide_overlay: false
    });
    setEditingBannerId(null);
  };

  // Criar ou atualizar banner
  const handleSaveBanner = async () => {
    if (!formData.title || !formData.desktop_image_url) {
      toast.error('Preencha pelo menos o Título e carregue a Imagem Desktop.');
      return;
    }

    // Se não houver imagem mobile, usa a desktop como fallback para evitar quebrar layouts mobile
    const payload = {
      ...formData,
      mobile_image_url: formData.mobile_image_url || formData.desktop_image_url,
      position: editingBannerId ? undefined : banners.length
    };

    try {
      setSaving(true);
      if (editingBannerId) {
        await bannerService.updateBanner(editingBannerId, payload);
        toast.success('Banner atualizado com sucesso!');
      } else {
        await bannerService.createBanner(payload);
        toast.success('Novo banner criado com sucesso!');
      }
      resetForm();
      await loadBanners();
    } catch (err: any) {
      toast.error('Erro ao salvar banner.');
    } finally {
      setSaving(false);
    }
  };

  // Carregar dados de banner existente para edição
  const handleStartEdit = (banner: BannerRow) => {
    setEditingBannerId(banner.id);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      desktop_image_url: banner.desktop_image_url,
      mobile_image_url: banner.mobile_image_url || '',
      link_url: banner.link_url || '',
      button_text: banner.button_text || 'Ver Detalhes',
      is_active: banner.is_active || false,
      hide_overlay: banner.hide_overlay || false
    });
  };

  // Deletar banner fisicamente
  const handleDeleteBanner = async (banner: BannerRow) => {
    const confirmDelete = confirm(`Deseja excluir o banner "${banner.title}" permanentemente do Storage e do banco?`);
    if (!confirmDelete) return;

    try {
      // Exclui do banco
      await bannerService.deleteBanner(banner.id);

      // Exclui mídias do storage
      if (banner.desktop_image_url) {
        await storageService.deleteImage(banner.desktop_image_url).catch(console.error);
      }
      if (banner.mobile_image_url && banner.mobile_image_url !== banner.desktop_image_url) {
        await storageService.deleteImage(banner.mobile_image_url).catch(console.error);
      }

      toast.success('Banner excluído permanentemente!');
      await loadBanners();
    } catch (err: any) {
      toast.error('Erro ao excluir o banner.');
    }
  };

  // Mover banners de posição (reordenação vertical premium estável)
  const handleMoveBanner = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...banners];

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Atualiza posições localmente
    const reordered = updated.map((b, idx) => ({
      ...b,
      position: idx
    }));
    setBanners(reordered);

    try {
      // Atualiza no banco de dados de forma sequencial
      for (const item of reordered) {
        await bannerService.updateBanner(item.id, { position: item.position });
      }
      toast.success('Nova ordem dos banners aplicada com sucesso!');
    } catch (err) {
      toast.error('Falha ao salvar a nova ordem dos banners.');
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Gerenciador de Banners</h1>
          <p className="text-white/50 text-sm mt-1">Configure carrosséis de imagens responsivas e direcionamentos promocionais na storefront.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Cadastro / Edição */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-4">
            <h2 className="text-md font-serif text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#d4af37]" />
              {editingBannerId ? 'Editar Banner' : 'Novo Banner'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5 font-semibold">Título Principal</label>
                <input name="title" value={formData.title} onChange={handleInputChange} required type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none text-xs transition-colors" placeholder="Coleção Diamantes Raros" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5 font-semibold">Subtítulo (Opcional)</label>
                <input name="subtitle" value={formData.subtitle} onChange={handleInputChange} type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none text-xs transition-colors" placeholder="Elegância Eterna" />
              </div>

              {/* Upload Desktop */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Imagem Desktop (Ideal 1920x800)</label>
                {formData.desktop_image_url ? (
                  <div className="relative aspect-[21/9] w-full bg-black rounded-lg border border-white/10 overflow-hidden mb-2 group">
                    <Image src={formData.desktop_image_url} alt="Desktop Preview" fill className="object-cover" referrerPolicy="no-referrer" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, desktop_image_url: '' }))} className="absolute top-2 right-2 p-1 bg-red-500 text-black hover:bg-red-400 rounded-md transition-colors shadow">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-grow border border-dashed border-white/10 rounded-lg p-3 text-center hover:border-[#d4af37]/40 transition-all cursor-pointer">
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'desktop')} disabled={uploadingDesktop} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                      {uploadingDesktop ? (
                        <Loader2 className="w-4 h-4 text-[#d4af37] mx-auto animate-spin" />
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-white/30 mx-auto mb-0.5" />
                          <span className="text-[9px] text-white/40 font-mono">Upload Local</span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaTarget('desktop');
                        setShowMediaLibrary(true);
                      }}
                      className="px-3 border border-[#d4af37]/35 hover:border-[#d4af37]/80 bg-[#d4af37]/5 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 active:scale-[0.98] cursor-pointer"
                    >
                      Storage
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Mobile */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-semibold">Imagem Mobile (Opcional - Ideal 600x800)</label>
                {formData.mobile_image_url ? (
                  <div className="relative aspect-[3/4] w-24 bg-black rounded-lg border border-white/10 overflow-hidden mb-2 group mx-auto">
                    <Image src={formData.mobile_image_url} alt="Mobile Preview" fill className="object-cover" referrerPolicy="no-referrer" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, mobile_image_url: '' }))} className="absolute top-2 right-2 p-1 bg-red-500 text-black hover:bg-red-400 rounded-md transition-colors shadow">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-grow border border-dashed border-white/10 rounded-lg p-3 text-center hover:border-[#d4af37]/40 transition-all cursor-pointer">
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'mobile')} disabled={uploadingMobile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                      {uploadingMobile ? (
                        <Loader2 className="w-4 h-4 text-[#d4af37] mx-auto animate-spin" />
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-white/30 mx-auto mb-0.5" />
                          <span className="text-[9px] text-white/40 font-mono">Upload Local</span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaTarget('mobile');
                        setShowMediaLibrary(true);
                      }}
                      className="px-3 border border-[#d4af37]/35 hover:border-[#d4af37]/80 bg-[#d4af37]/5 text-[#d4af37] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 active:scale-[0.98] cursor-pointer"
                    >
                      Storage
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5 font-semibold">Texto do CTA</label>
                  <input name="button_text" value={formData.button_text} onChange={handleInputChange} type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none text-xs transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5 font-semibold">Link do CTA</label>
                  <input name="link_url" value={formData.link_url} onChange={handleInputChange} type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none text-xs transition-colors" placeholder="/categoria/brincos" />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-[#1A1A1A] checked:bg-[#d4af37] checked:border-[#d4af37] transition-all" />
                    <svg className="absolute w-2.5 h-2.5 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Banner Ativo na Vitrine</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" name="hide_overlay" checked={formData.hide_overlay} onChange={handleInputChange} className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-[#1A1A1A] checked:bg-[#d4af37] checked:border-[#d4af37] transition-all" />
                    <svg className="absolute w-2.5 h-2.5 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Ocultar texto sobre o banner</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                {editingBannerId && (
                  <button type="button" onClick={resetForm} className="w-1/2 py-2 border border-white/10 hover:bg-white/5 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                    Cancelar
                  </button>
                )}
                <button 
                  disabled={saving} 
                  onClick={handleSaveBanner} 
                  className={`${editingBannerId ? 'w-1/2' : 'w-full'} py-2 bg-[#d4af37] hover:bg-[#ebd070] text-black text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1`}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editingBannerId ? 'Atualizar' : 'Salvar Banner'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Listagem de Banners Existentes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#131313] border border-white/5 p-6 rounded-2xl">
            <h2 className="text-md font-serif text-white mb-6">Lista de Banners</h2>
            
            {banners.length === 0 ? (
              <div className="h-48 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/30 text-xs">
                Nenhum banner cadastrado no momento.
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((banner, idx) => (
                  <div key={banner.id} className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 hover:border-white/10 transition-colors">
                    {/* Imagem Desktop Preview */}
                    <div className="relative aspect-[16/7] w-full md:w-32 bg-black rounded-lg border border-white/10 overflow-hidden flex-shrink-0">
                      <Image src={banner.desktop_image_url} alt={banner.title} fill className="object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <div className="flex-grow space-y-1 text-center md:text-left min-w-0">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        {banner.is_active ? (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold uppercase tracking-widest rounded">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-bold uppercase tracking-widest rounded">
                            Oculto
                          </span>
                        )}
                        {banner.hide_overlay && (
                          <span className="px-1.5 py-0.5 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 text-[8px] font-bold uppercase tracking-widest rounded">
                            Arte Limpa
                          </span>
                        )}
                        <span className="text-[10px] text-white/30 font-mono">Ordem #{idx + 1}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate max-w-xs">{banner.title}</h3>
                      <p className="text-xs text-white/40 truncate max-w-xs">{banner.subtitle || 'Sem subtítulo'}</p>
                      {banner.link_url && (
                        <p className="text-[10px] text-[#d4af37] flex items-center justify-center md:justify-start gap-1 font-mono">
                          <LinkIcon className="w-2.5 h-2.5" />
                          {banner.link_url}
                        </p>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 w-full md:w-auto justify-center">
                      <button 
                        type="button"
                        onClick={() => handleStartEdit(banner)}
                        className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleDeleteBanner(banner)}
                        className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                        title="Deletar permanentemente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Ordenação */}
                      <div className="flex flex-col gap-0.5 border border-white/10 rounded-lg p-0.5 bg-black/40">
                        <button 
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveBanner(idx, 'up')}
                          className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          type="button"
                          disabled={idx === banners.length - 1}
                          onClick={() => handleMoveBanner(idx, 'down')}
                          className="p-0.5 text-white/40 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de Mídia */}
      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => {
          setShowMediaLibrary(false);
          setMediaTarget(null);
        }}
        onSelectImages={handleSelectFromStorage}
        allowMultiple={false}
        title={`Selecionar Imagem do Banner (${mediaTarget === 'desktop' ? 'Desktop' : 'Mobile'})`}
      />
    </div>
  );
}
