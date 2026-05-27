'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Image as ImageIcon, Folder, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface MediaFile {
  name: string;
  path: string;
  url: string;
  created_at: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImages: (urls: string[]) => void;
  allowMultiple?: boolean;
  title?: string;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectImages,
  allowMultiple = true,
  title = 'Biblioteca de Mídias do Storage'
}: MediaLibraryModalProps) {
  const [folder, setFolder] = useState<string>('products');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/media?folder=${folder}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao listar mídias');
      setFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      toast.error(`Falha ao listar mídias: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMedia();
      setSelectedUrls([]);
    }
  }, [isOpen, fetchMedia]);

  const handleToggleSelect = (url: string) => {
    if (!allowMultiple) {
      setSelectedUrls([url]);
      return;
    }

    setSelectedUrls(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedUrls.length === 0) {
      toast.error('Por favor, selecione pelo menos uma imagem.');
      return;
    }
    onSelectImages(selectedUrls);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-[#131313] border border-[#d4af37]/20 w-full max-w-4xl h-[85vh] flex flex-col rounded-none shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-[#d4af37]" />
              <h3 className="font-serif text-lg text-white uppercase tracking-wider">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 border border-transparent hover:border-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navegação de Pastas / Filtros */}
          <div className="flex items-center gap-3 px-6 py-4 bg-[#1A1A1A] border-b border-white/5">
            <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-widest mr-2">
              Pastas:
            </span>
            {[
              { key: 'products', name: 'Produtos' },
              { key: 'banners', name: 'Banners' },
              { key: 'categories', name: 'Categorias' },
              { key: 'avatars', name: 'Avatares' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFolder(tab.key)}
                className={`px-4 py-2 border font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  folder === tab.key
                    ? 'border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37]'
                    : 'border-white/10 text-white/55 hover:text-white hover:border-white/20'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Grid de Imagens */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#131313] no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
                <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
                <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
                  Consultando bucket do Supabase...
                </span>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 border border-dashed border-white/5 text-center p-8 bg-[#1A1A1A]/20">
                <ImageIcon className="w-10 h-10 text-white/10 mb-4" />
                <p className="font-sans text-xs text-white/50 uppercase tracking-widest">
                  Nenhuma imagem nesta pasta ainda.
                </p>
                <p className="font-sans text-[10px] text-white/30 mt-1 uppercase tracking-wider">
                  Os novos uploads criados pelos formulários aparecerão listados aqui de forma automática.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.map((file) => {
                  const isSelected = selectedUrls.includes(file.url);
                  return (
                    <div
                      key={file.path}
                      onClick={() => handleToggleSelect(file.url)}
                      className={`relative aspect-square bg-[#1A1A1A] border transition-all duration-300 cursor-pointer overflow-hidden group ${
                        isSelected 
                          ? 'border-[#d4af37] scale-[0.98]' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <Image
                        src={file.url}
                        alt={file.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Overlay seleção */}
                      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-[#d4af37] border-[#d4af37] text-black scale-110 shadow-md shadow-[#d4af37]/25' 
                            : 'bg-black/60 border-white/20 text-white/40'
                        }`}>
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </div>
                      </div>

                      {/* Nome do arquivo */}
                      <div className="absolute bottom-0 left-0 w-full bg-black/70 py-1.5 px-2 border-t border-white/5 truncate z-10">
                        <span className="text-[9px] font-mono text-white/50 block truncate uppercase" title={file.name}>
                          {file.name.substring(file.name.indexOf('_') + 1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Ações */}
          <div className="p-6 border-t border-white/10 bg-[#1A1A1A] flex items-center justify-between gap-4">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              {selectedUrls.length} imagem(ns) selecionada(s)
            </span>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 font-sans text-[10px] font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedUrls.length === 0}
                className="px-8 py-2.5 bg-[#d4af37] hover:bg-[#ebce67] text-black font-sans text-[10px] font-bold tracking-widest uppercase transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Adicionar Selecionadas
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
