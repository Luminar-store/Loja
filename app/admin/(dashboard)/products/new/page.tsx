'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, UploadCloud, X, Save, Loader2 } from 'lucide-react';
import { productService, ProductInsert } from '@/services/product.service';
import { storageService } from '@/services/storage.service';
import { categoryService, Category } from '@/services/category.service';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    categoryService.listCategories().then(cats => {
      if (cats.length > 0) setCategories(cats);
    }).catch(console.error);
  }, []);
  
  const [formData, setFormData] = useState<ProductInsert>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    promotional_price: null,
    stock: 0,
    status: 'Ativo',
    category: 'Anéis',
    material: 'Ouro Amarelo',
    weight: null,
    width: null,
    height: null,
    images: [],
    is_featured: false,
    is_made_to_order: false,
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingImages(true);
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        try {
          const url = await storageService.uploadProductImage(file, file.name);
          uploadedUrls.push(url);
        } catch (error) {
          toast.error(`Erro ao fazer upload de ${file.name}`);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls]
      }));
      setUploadingImages(false);
      
      e.target.value = ''; // limpa o input
    }
  };

  const removeImage = async (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter(img => img !== imageUrl)
    }));
    // Note: To be perfectly clean we could also delete from Supabase storage here
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
      toast.error('Preencha pelo menos o nome e preço.');
      return;
    }

    try {
      setLoading(true);

      // Add product
      await productService.createProduct(formData);

      toast.success('Produto criado com sucesso!');
      router.push('/admin/products');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar o produto.');
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
          <p className="text-white/50 text-sm mt-1">Preencha os detalhes para cadastrar uma nova joia.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Informações Básicas</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Nome do Produto</label>
                <input name="name" value={formData.name} onChange={handleChange} required type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="Ex: Colar Diamante Gota" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Slug (URL)</label>
                <input name="slug" value={formData.slug || ''} onChange={handleChange} type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="colar-diamante-gota" />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Descrição</label>
                <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors resize-none" placeholder="Detalhes sobre a joia, inspiração, etc..."></textarea>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Mídia</h2>
            
            {(formData.images && formData.images.length > 0) && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.images.map((img, i) => (
                  <div key={i} className="aspect-square bg-[#1A1A1A] rounded-xl border border-[#d4af37] overflow-hidden relative group">
                    <Image src={img} alt="Preview" fill className="object-cover"  referrerPolicy="no-referrer" />
                    {i === 0 && (
                      <div className="absolute top-2 left-2 bg-[#d4af37] text-black text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm z-10">
                        Principal
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer gap-2">
                      {i !== 0 && (
                        <button 
                          onClick={() => {
                            const newImages = [...(formData.images || [])];
                            newImages.splice(i, 1);
                            newImages.unshift(img);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="text-white text-xs uppercase tracking-widest font-bold bg-[#d4af37]/20 hover:bg-[#d4af37] hover:text-black py-1 px-3 border border-[#d4af37] rounded-full transition-all"
                        >
                          Tornar Principal
                        </button>
                      )}
                      <button 
                        onClick={() => removeImage(img)} 
                        className="text-white text-xs uppercase tracking-widest font-bold bg-white/10 hover:bg-white hover:text-black py-1 px-3 border border-white/30 rounded-full transition-all flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`relative border-2 border-dashed ${uploadingImages ? 'border-[#d4af37]/50 bg-[#d4af37]/5' : 'border-white/10 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5'} rounded-xl p-8 text-center transition-all cursor-pointer`}>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} disabled={uploadingImages} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
              {uploadingImages ? (
                <>
                  <Loader2 className="w-8 h-8 text-[#d4af37] mx-auto mb-4 animate-spin" />
                  <p className="text-sm text-[#d4af37] mb-1">Fazendo upload das imagens...</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-white/40 mx-auto mb-4" />
                  <p className="text-sm text-white/70 mb-1">Clique para fazer upload ou arraste as imagens</p>
                  <p className="text-xs text-white/40">SVG, PNG, JPG (Max. 5MB)</p>
                </>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Preço & Estoque</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Preço (R$)</label>
                <input name="price" value={formData.price} onChange={handleChange} required type="number" step="0.01" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Preço Promocional (Opcional)</label>
                <input name="promotional_price" value={formData.promotional_price || ''} onChange={handleChange} type="number" step="0.01" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Estoque (Unidades)</label>
                <input name="stock" value={formData.stock || 0} onChange={handleChange} type="number" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" placeholder="0" />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <h2 className="text-lg font-serif">Organização</h2>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors">
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Rascunho">Rascunho</option>
                <option value="Esgotado">Esgotado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Categoria</label>
              <select name="category" value={formData.category || ''} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors">
                <option value="">Selecione...</option>
                {categories.length > 0 ? categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                )) : (
                  <>
                    <option>Anéis</option>
                    <option>Colares</option>
                    <option>Pulseiras</option>
                    <option>Brincos</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Material Principal</label>
              <select name="material" value={formData.material || ''} onChange={handleChange} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors">
                <option>Ouro Amarelo</option>
                <option>Ouro Branco</option>
                <option>Ouro Rosé</option>
                <option>Prata</option>
                <option>Platina</option>
              </select>
            </div>

            <div className="pt-4 space-y-4 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" name="is_featured" checked={formData.is_featured || false} onChange={handleChange} className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-[#1A1A1A] checked:bg-[#d4af37] checked:border-[#d4af37] transition-all" />
                  <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">Produto em Destaque</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" name="is_made_to_order" checked={formData.is_made_to_order || false} onChange={handleChange} className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-[#1A1A1A] checked:bg-[#d4af37] checked:border-[#d4af37] transition-all" />
                  <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">Sob Encomenda</span>
              </label>
            </div>
          </motion.div>

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

      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-[#131313]/80 backdrop-blur-md border-t border-white/5 flex justify-end gap-4 z-20">
        <Link href="/admin/products" className="px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors">
          Descartar
        </Link>
        <button disabled={loading} onClick={handleSave} className="px-6 py-2.5 bg-[#d4af37] text-black text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#ebd070] transition-colors flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {loading ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </div>
  );
}
