'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, UploadCloud, X, Save, Loader2, Star, Trash2, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { productService } from '@/services/product.service';
import { storageService } from '@/services/storage.service';
import { categoryService, Category } from '@/services/category.service';
import Image from 'next/image';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';
import toast from 'react-hot-toast';

interface ProductMedia {
  url: string;
  position: number;
  is_primary: boolean;
  uploading?: boolean;
  name?: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaList, setMediaList] = useState<ProductMedia[]>([]);
  
  // Hardening eUX: Estados transacionais de mídias e modal expresso de categorias
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  
  useEffect(() => {
    categoryService.listCategories().then(cats => {
      if (cats.length > 0) setCategories(cats);
    }).catch(console.error);
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    promotional_price: null as number | null,
    stock: 0,
    status: 'draft', // status em inglês conforme Fase 2 (draft, active, hidden, archived)
    category: '',
    material: 'Ouro Amarelo',
    weight: null as number | null,
    width: null as number | null,
    height: null as number | null,
    is_featured: false,
    is_made_to_order: false,
  });

  // Upload de arquivos de mídias (múltiplos) com compressão WebP integrada
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImages(true);
      const files = Array.from(e.target.files);
      const slugName = formData.slug || formData.name || 'product';

      // Cria placeholders temporários de loading para cada arquivo
      const tempMedia: ProductMedia[] = files.map((file, idx) => ({
        url: '',
        position: mediaList.length + idx,
        is_primary: false,
        uploading: true,
        name: file.name
      }));
      setMediaList(prev => [...prev, ...tempMedia]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Upload com compressão client-side embutida no storageService
          const url = await storageService.uploadImage(file, 'products', `${slugName}_gal_${i}`);
          
          setMediaList(prev => {
            const updated = [...prev];
            const targetIdx = updated.findIndex(item => item.uploading && item.name === file.name);
            if (targetIdx !== -1) {
              updated[targetIdx] = {
                url,
                position: targetIdx,
                is_primary: updated.length === files.length && targetIdx === 0 ? true : false, // se for a primeira imagem, marca como destaque automática
                uploading: false
              };
            }
            // Auto-eleger imagem principal se nenhuma for marcada
            const hasPrimary = updated.some(item => item.is_primary && !item.uploading);
            const firstLoadedIdx = updated.findIndex(item => !item.uploading);
            if (!hasPrimary && firstLoadedIdx !== -1) {
              updated[firstLoadedIdx].is_primary = true;
            }
            return updated;
          });
        } catch (error: any) {
          toast.error(`Erro ao subir ${file.name}: ${error.message}`);
          // Remove o placeholder com falha
          setMediaList(prev => prev.filter(item => !(item.uploading && item.name === file.name)));
        }
      }
      
      setUploadingImages(false);
      e.target.value = ''; // Limpa o input
    }
  };

  // Tornar a imagem selecionada a imagem principal (is_primary = true)
  const handleSetPrimary = (index: number) => {
    setMediaList(prev => 
      prev.map((item, idx) => ({
        ...item,
        is_primary: idx === index
      }))
    );
    toast.success('Imagem principal definida!');
  };

  // Excluir imagem visualmente da lista e enfileirar para exclusão física tardia
  const handleRemoveMedia = async (index: number) => {
    const item = mediaList[index];
    if (item.uploading) return;

    const confirmRemove = confirm('Deseja remover esta imagem da galeria? A exclusão física será consolidada ao salvar.');
    if (!confirmRemove) return;

    // Atualiza o estado local removendo a imagem visualmente
    const updatedMedia = mediaList.filter((_, idx) => idx !== index);
    
    // Se a imagem deletada era a principal e restarem imagens, elege a primeira como principal
    if (item.is_primary && updatedMedia.length > 0) {
      updatedMedia[0].is_primary = true;
    }
    
    // Reajusta os índices de position
    const reorderedMedia = updatedMedia.map((m, idx) => ({
      ...m,
      position: idx
    }));

    setMediaList(reorderedMedia);

    // Enfileira a URL para exclusão física apenas ao salvar com sucesso (AUD-001)
    if (item.url) {
      setPendingDeletions(prev => [...prev, item.url]);
      toast.success('Imagem removida da galeria temporariamente.');
    }
  };

  // Selecionar imagens da biblioteca de mídias do storage
  const handleSelectFromStorage = (urls: string[]) => {
    // Filtra as URLs que já estão na galeria local do produto para impedir duplicidades
    const newUrls = urls.filter(url => !mediaList.some(item => item.url === url));
    
    if (newUrls.length === 0) {
      toast.error('As imagens selecionadas já estão na galeria do produto.');
      return;
    }

    const newMediaItems: ProductMedia[] = newUrls.map((url, idx) => ({
      url,
      position: mediaList.length + idx,
      is_primary: false,
      uploading: false
    }));

    setMediaList(prev => {
      const updated = [...prev, ...newMediaItems];
      
      // Auto-eleger imagem principal se nenhuma for marcada ou se a galeria estava vazia
      const hasPrimary = updated.some(item => item.is_primary);
      if (!hasPrimary && updated.length > 0) {
        updated[0].is_primary = true;
      }
      
      // Reordena as posições
      return updated.map((item, index) => ({
        ...item,
        position: index
      }));
    });

    toast.success(`${newUrls.length} imagem(ns) adicionada(s) do Storage!`);
  };

  // Mover imagem de posição (reordenação manual de alta estabilidade)
  const handleMoveMedia = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === mediaList.length - 1) return;

    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const updated = [...mediaList];
    
    // Inverte os elementos do array
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Reconstrói as posições dinamicamente
    const reordered = updated.map((item, idx) => ({
      ...item,
      position: idx
    }));

    setMediaList(reordered);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'price' || name === 'promotional_price' || name === 'stock' || name === 'weight' || name === 'width' || name === 'height' 
              ? (value ? Number(value) : null) 
              : value
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Preencha os campos obrigatórios (Nome e Preço).');
      return;
    }

    if (mediaList.length === 0) {
      toast.error('Adicione pelo menos uma imagem de destaque.');
      return;
    }

    const hasPrimary = mediaList.some(m => m.is_primary && !m.uploading);
    if (!hasPrimary) {
      toast.error('Selecione uma imagem principal clicando na estrela correspondente.');
      return;
    }

    try {
      setLoading(true);

      // Payload final acoplando o status em inglês e a lista de mídias reativa no campo 'media'
      const payload = {
        ...formData,
        category: formData.category || (categories[0]?.name ?? 'Geral'),
        media: mediaList.filter(m => !m.uploading).map(m => ({
          url: m.url,
          position: m.position,
          is_primary: m.is_primary
        }))
      };

      // Chama o serviço de produtos
      await productService.createProduct(payload as any);

      // Consolidar exclusões físicas no Storage de forma transparente após persistir com sucesso no banco de dados!
      if (pendingDeletions.length > 0) {
        Promise.all(
          pendingDeletions.map(url => storageService.deleteImage(url).catch(console.error))
        ).catch(console.error);
      }

      toast.success('Joia cadastrada com sucesso!');
      router.push('/admin/products');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao cadastrar o produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Novo Produto</h1>
          <p className="text-white/50 text-sm mt-1">Preencha os detalhes para cadastrar uma nova joia premium.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Informações Básicas</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Nome do Produto</label>
                <input name="name" value={formData.name} onChange={handleChange} required type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="Ex: Anel Solitário Brilhante Ouro Amarelo" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Slug (URL)</label>
                <input name="slug" value={formData.slug} onChange={handleChange} type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="anel-solitario-brilhante" />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Descrição</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors resize-none" placeholder="Escreva os detalhes sobre o acabamento, diamantes, peso e inspiração desta peça exclusiva..."></textarea>
              </div>
            </div>
          </motion.div>

          {/* Media Manager Real (Múltiplas Imagens, Position, is_primary) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <div>
              <h2 className="text-lg font-serif">Mídias da Joia</h2>
              <p className="text-xs text-white/40 mt-1">Carregue fotos de alta fidelidade. Defina a foto de destaque com a estrela e organize a ordem lateral.</p>
            </div>
            
            {/* Grid de Mídias Cadastradas */}
            {mediaList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mediaList.map((item, idx) => (
                  <div key={idx} className={`relative aspect-square bg-[#1A1A1A] rounded-xl border overflow-hidden group shadow-md transition-all ${item.is_primary ? 'border-[#d4af37]' : 'border-white/10'}`}>
                    {item.uploading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/40">
                        <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin mb-2" />
                        <span className="text-[10px] text-white/50 uppercase tracking-widest truncate max-w-full">Compactando...</span>
                      </div>
                    ) : (
                      <>
                        <Image src={item.url} alt="Mídia" fill className="object-cover" referrerPolicy="no-referrer" />
                        
                        {/* Overlay de Ações Rápidas */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 z-10">
                          <div className="flex justify-between items-center">
                            {/* Destaque (is_primary) */}
                            <button 
                              type="button" 
                              onClick={() => handleSetPrimary(idx)}
                              className={`p-1.5 rounded-lg transition-colors border ${item.is_primary ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-black/50 text-white/60 hover:text-white border-white/10'}`}
                              title={item.is_primary ? 'Imagem Principal' : 'Definir como Principal'}
                            >
                              <Star className="w-3.5 h-3.5" fill={item.is_primary ? 'currentColor' : 'none'} />
                            </button>

                            {/* Remover Imagem Física */}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveMedia(idx)}
                              className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-black rounded-lg border border-red-500/30 transition-colors"
                              title="Remover permanentemente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Reordenação por posição */}
                          <div className="flex justify-center gap-4 bg-black/60 py-1 px-3 border border-white/10 rounded-full w-fit mx-auto">
                            <button 
                              type="button" 
                              disabled={idx === 0} 
                              onClick={() => handleMoveMedia(idx, 'left')}
                              className="text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-mono text-white/50 select-none">#{idx + 1}</span>
                            <button 
                              type="button" 
                              disabled={idx === mediaList.length - 1} 
                              onClick={() => handleMoveMedia(idx, 'right')}
                              className="text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Indicador de Destaque */}
                        {item.is_primary && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#d4af37] text-black text-[9px] font-bold uppercase tracking-widest rounded shadow">
                            Principal
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Seletor de Imagens do Storage */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowMediaLibrary(true)}
                className="w-full py-3.5 border border-dashed border-[#d4af37]/35 bg-[#d4af37]/5 hover:border-[#d4af37]/80 text-[#d4af37] text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Selecionar do Storage
              </button>
            </div>

            {/* Upload Area */}
            <div className={`relative border-2 border-dashed ${uploadingImages ? 'border-[#d4af37]/50 bg-[#d4af37]/5' : 'border-white/10 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5'} rounded-xl p-8 text-center transition-all cursor-pointer`}>
              <input type="file" multiple accept="image/*" onChange={handleMediaUpload} disabled={uploadingImages} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
              {uploadingImages ? (
                <div className="py-4 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#d4af37] mx-auto animate-spin" />
                  <p className="text-sm text-[#d4af37] font-medium">Compactando arquivos e enviando ao bucket...</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-white/40 mx-auto mb-4 animate-bounce" />
                  <p className="text-sm text-white/70 mb-1">Carregar Imagens de Destaque & Galeria</p>
                  <p className="text-xs text-white/40">Selecione uma ou mais fotos.PNG, JPG ou WebP (Auto-conversão para WebP de alta qualidade)</p>
                </>
              )}
            </div>
          </motion.div>

          {/* Preço & Estoque */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Preço & Estoque</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Preço (R$)</label>
                <input name="price" value={formData.price || ''} onChange={handleChange} required type="number" step="0.01" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Preço Promocional (R$)</label>
                <input name="promotional_price" value={formData.promotional_price || ''} onChange={handleChange} type="number" step="0.01" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Estoque (Unidades)</label>
                <input name="stock" value={formData.stock} onChange={handleChange} type="number" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar de Organização */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Organização</h2>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors select-custom">
                <option value="draft">Rascunho (Draft)</option>
                <option value="active">Ativo (Active)</option>
                <option value="hidden">Oculto (Hidden)</option>
                <option value="archived">Arquivado (Archived)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs uppercase tracking-widest text-white/50">Categoria</label>
                <button 
                  type="button" 
                  onClick={() => {
                    setNewCategoryName('');
                    setNewCategorySlug('');
                    setShowCategoryModal(true);
                  }}
                  className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold hover:text-white transition-colors"
                >
                  + Nova Categoria
                </button>
              </div>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors">
                <option value="">Selecione...</option>
                {categories.length > 0 ? categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                )) : (
                  <>
                    <option value="Anéis">Anéis</option>
                    <option value="Colares">Colares</option>
                    <option value="Pulseiras">Pulseiras</option>
                    <option value="Brincos">Brincos</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Material Principal</label>
              <select name="material" value={formData.material || ''} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors">
                <option value="Ouro Amarelo">Ouro Amarelo</option>
                <option value="Ouro Branco">Ouro Branco</option>
                <option value="Ouro Rosé">Ouro Rosé</option>
                <option value="Prata">Prata</option>
                <option value="Platina">Platina</option>
              </select>
            </div>

            <div className="pt-4 space-y-4 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-[#1A1A1A] checked:bg-[#d4af37] checked:border-[#d4af37] transition-all" />
                  <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">Produto em Destaque</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" name="is_made_to_order" checked={formData.is_made_to_order} onChange={handleChange} className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-[#1A1A1A] checked:bg-[#d4af37] checked:border-[#d4af37] transition-all" />
                  <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">Sob Encomenda</span>
              </label>
            </div>
          </motion.div>

          {/* Frete e Dimensões */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Frete e Dimensões</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Peso (kg)</label>
                <input name="weight" value={formData.weight || ''} onChange={handleChange} type="number" step="0.01" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0.0" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Largura (cm)</label>
                <input name="width" value={formData.width || ''} onChange={handleChange} type="number" step="0.1" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Altura (cm)</label>
                <input name="height" value={formData.height || ''} onChange={handleChange} type="number" step="0.1" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Botões de Ações */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-[#131313]/80 backdrop-blur-md border-t border-white/5 flex justify-end gap-4 z-20">
        <Link href="/admin/products" className="px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors">
          Descartar
        </Link>
        <button disabled={loading} onClick={handleSave} className="px-6 py-2.5 bg-[#d4af37] text-black text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#ebd070] transition-colors flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {loading ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>

      {/* Modal Leve de Cadastro Rápido de Categoria (AUD-005) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#131313] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-md font-serif text-white uppercase tracking-wider">Nova Categoria</h3>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-semibold">Nome da Categoria</label>
                <input 
                  type="text" 
                  value={newCategoryName} 
                  onChange={e => {
                    setNewCategoryName(e.target.value);
                    setNewCategorySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none" 
                  placeholder="Ex: Brincos"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5 font-semibold">Slug (URL)</label>
                <input 
                  type="text" 
                  value={newCategorySlug} 
                  onChange={e => setNewCategorySlug(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white focus:border-[#d4af37] outline-none" 
                  placeholder="brincos"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button 
                type="button" 
                onClick={() => setShowCategoryModal(false)} 
                className="px-4 py-2 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-white/5"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={creatingCategory || !newCategoryName}
                onClick={async () => {
                  try {
                    setCreatingCategory(true);
                    const cat = await categoryService.createCategory({
                      name: newCategoryName,
                      slug: newCategorySlug
                    });
                    if (cat) {
                      setCategories(prev => [...prev, cat]);
                      setFormData(prev => ({ ...prev, category: cat.name }));
                      toast.success(`Categoria "${cat.name}" criada com sucesso!`);
                      setShowCategoryModal(false);
                    }
                  } catch (err: any) {
                    toast.error(`Erro ao criar categoria: ${err.message}`);
                  } finally {
                    setCreatingCategory(false);
                  }
                }}
                className="px-4 py-2 bg-[#d4af37] text-black text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#ebd070] disabled:opacity-50"
              >
                {creatingCategory ? 'Criando...' : 'Criar Categoria'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelectImages={handleSelectFromStorage}
        allowMultiple={true}
      />
    </div>
  );
}
