'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, UploadCloud, Save, Loader2, X } from 'lucide-react';
import { productService, ProductUpdate } from '@/services/product.service';
import { storageService } from '@/services/storage.service';
import { categoryService, Category } from '@/services/category.service';
import { ProductOptionsManager } from '@/components/admin/ProductOptionsManager';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState<ProductUpdate>({
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
    image_url: null,
    is_featured: false,
    is_made_to_order: false,
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const prod = await productService.getProductById(id);
        if (prod) {
          setFormData({
            name: prod.name,
            slug: prod.slug,
            description: prod.description,
            price: prod.price,
            promotional_price: prod.promotional_price,
            stock: prod.stock,
            status: prod.status,
            category: prod.category,
            material: prod.material,
            weight: prod.weight,
            width: prod.width,
            height: prod.height,
            images: prod.images || [],
            image_url: prod.image_url || null,
            is_featured: prod.is_featured || false,
            is_made_to_order: prod.is_made_to_order || false,
          });
        }
        
        try {
          const cats = await categoryService.listCategories();
          if (cats.length > 0) setCategories(cats);
        } catch (e) {
          console.error(e);
        }
      } catch (error) {
        toast.error('Erro ao carregar produto.');
      } finally {
        setInitialLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const handlePrimaryImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadingImages(true);
      
      try {
        // Se já tiver uma imagem antiga cadastrada, remove do Supabase Storage
        if (formData.image_url) {
          await storageService.deleteImage(formData.image_url);
        }
        
        const slugName = formData.slug || formData.name || 'product';
        const url = await storageService.uploadImage(file, 'products', slugName);
        
        setFormData(prev => ({
          ...prev,
          image_url: url
        }));
        toast.success('Imagem principal enviada com compressão WebP!');
      } catch (error: any) {
        toast.error(`Erro no upload: ${error.message}`);
      } finally {
        setUploadingImages(false);
      }
      
      e.target.value = ''; // limpa o input
    }
  };

  const removePrimaryImage = async () => {
    if (!formData.image_url) return;
    const oldUrl = formData.image_url;
    
    setFormData(prev => ({
      ...prev,
      image_url: null
    }));
    
    try {
      await storageService.deleteImage(oldUrl);
      toast.success('Imagem principal removida do Storage!');
    } catch (error) {
      console.error('Erro ao deletar imagem antiga:', error);
    }
  };

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
      
      e.target.value = ''; // clean input
    }
  };

  const removeExistingImage = async (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter(img => img !== imageUrl),
    }));
    try {
      await storageService.deleteImage(imageUrl);
    } catch (error) {
      console.error(error);
    }
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
    try {
      setSaving(true);
      await productService.updateProduct(id, formData);

      toast.success('Produto atualizado!');
      router.push('/admin/products');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar produto.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Editar Produto #{id}</h1>
          <p className="text-white/50 text-sm mt-1">Atualize as informações do produto.</p>
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
                <input name="name" value={formData.name} onChange={handleChange} required type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Slug (URL)</label>
                <input name="slug" value={formData.slug || ''} onChange={handleChange} type="text" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Descrição</label>
                <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors resize-none"></textarea>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#131313] border border-white/5 p-6 rounded-2xl space-y-6"
          >
            <div>
              <h2 className="text-lg font-serif">Imagem de Destaque</h2>
              <p className="text-xs text-white/40 mt-1">Esta será a imagem principal da joia, exibida no catálogo e buscas.</p>
            </div>
            
            {/* Primary Image Preview / Upload */}
            <div className="space-y-4">
              {formData.image_url ? (
                <div className="relative aspect-video max-w-md mx-auto bg-[#1A1A1A] rounded-xl border border-[#d4af37]/30 overflow-hidden group shadow-lg shadow-black/40">
                  <Image 
                    src={formData.image_url} 
                    alt="Imagem Principal" 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="text-white text-xs uppercase tracking-widest font-bold bg-[#d4af37]/20 hover:bg-[#d4af37] hover:text-black py-2 px-4 border border-[#d4af37] rounded-lg transition-all cursor-pointer">
                      Substituir
                      <input type="file" accept="image/*" onChange={handlePrimaryImageChange} className="hidden" />
                    </label>
                    <button 
                      onClick={removePrimaryImage}
                      className="text-white text-xs uppercase tracking-widest font-bold bg-red-500/20 hover:bg-red-500 py-2 px-4 border border-red-500 rounded-lg transition-all"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`relative border-2 border-dashed ${uploadingImages ? 'border-[#d4af37]/50 bg-[#d4af37]/5' : 'border-white/10 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5'} rounded-xl p-8 text-center transition-all cursor-pointer`}>
                  <input type="file" accept="image/*" onChange={handlePrimaryImageChange} disabled={uploadingImages} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                  {uploadingImages ? (
                    <div className="py-4 space-y-3">
                      <Loader2 className="w-8 h-8 text-[#d4af37] mx-auto animate-spin" />
                      <p className="text-sm text-[#d4af37] font-medium">Comprimindo e enviando para o Supabase...</p>
                      <div className="w-48 h-1.5 bg-white/5 mx-auto rounded-full overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 left-0 bg-[#d4af37] w-2/3 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-white/40 mx-auto mb-4 animate-bounce" />
                      <p className="text-sm text-white/70 mb-1">Carregar Imagem de Destaque</p>
                      <p className="text-xs text-white/40">PNG, JPG ou WebP (Será convertido para WebP até 5MB)</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Gallery (Imagens Secundárias) */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-white/80">Galeria Secundária (Opcional)</h3>
                <p className="text-xs text-white/40 mt-1">Imagens complementares exibidas na página de detalhes da joia.</p>
              </div>

              {(formData.images && formData.images.length > 0) && (
                <div className="grid grid-cols-4 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden relative group">
                      <Image src={img} alt="Preview" fill className="object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <button 
                          onClick={() => removeExistingImage(img)} 
                          className="text-white text-[10px] uppercase tracking-widest font-bold bg-white/10 hover:bg-white hover:text-black py-1 px-2 border border-white/30 rounded transition-all"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative border border-dashed border-white/5 hover:border-white/20 rounded-xl p-4 text-center transition-all cursor-pointer">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} disabled={uploadingImages} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                <p className="text-xs text-white/50">Clique para adicionar fotos adicionais à galeria</p>
              </div>
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
                <input name="price" value={formData.price} onChange={handleChange} required type="number" step="0.01" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Estoque (Unidades)</label>
                <input name="stock" value={formData.stock || 0} onChange={handleChange} required type="number" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none transition-colors" />
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
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ProductOptionsManager productId={id} />
      </motion.div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-[#131313]/80 backdrop-blur-md border-t border-white/5 flex justify-end gap-4 z-20">
        <Link href="/admin/products" className="px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors">
          Cancelar
        </Link>
        <button disabled={saving} onClick={handleSave} className="px-6 py-2.5 bg-[#d4af37] text-black text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#ebd070] transition-colors flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? 'Atualizando...' : 'Atualizar Produto'}
        </button>
      </div>
    </div>
  );
}
