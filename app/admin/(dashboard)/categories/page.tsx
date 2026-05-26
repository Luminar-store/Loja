'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Loader2, Edit2, Trash2, UploadCloud, X } from 'lucide-react';
import { categoryService, Category } from '@/services/category.service';
import { storageService } from '@/services/storage.service';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({ name: '', slug: '', image_url: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.listCategories();
      setCategories(data);
    } catch {
      toast.error('Erro ao listar categorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCategories();
    };

    init();
  }, []);

  const handleCategoryImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadingImage(true);
      
      try {
        // Se já tiver uma imagem antiga cadastrada, remove do Supabase Storage
        if (formData.image_url) {
          await storageService.deleteImage(formData.image_url);
        }
        
        const slugName = formData.slug || formData.name || 'category';
        const url = await storageService.uploadImage(file, 'categories', slugName);
        
        setFormData(prev => ({
          ...prev,
          image_url: url
        }));
        toast.success('Imagem da categoria enviada com compressão WebP!');
      } catch (error: any) {
        toast.error(`Erro no upload: ${error.message}`);
      } finally {
        setUploadingImage(false);
      }
      
      e.target.value = '';
    }
  };

  const removeCategoryImage = async () => {
    if (!formData.image_url) return;
    const oldUrl = formData.image_url;
    
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }));
    
    try {
      await storageService.deleteImage(oldUrl);
      toast.success('Imagem da categoria removida!');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) return toast.error('Preencha os campos obrigatórios');
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
        toast.success('Categoria atualizada');
      } else {
        await categoryService.createCategory(formData);
        toast.success('Categoria criada');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: string, name: string, imageUrl?: string | null) => {
    if (!confirm(`Tem certeza que deseja deletar a categoria "${name}"?`)) return;
    try {
      await categoryService.deleteCategory(id);
      if (imageUrl) {
        await storageService.deleteImage(imageUrl);
      }
      toast.success('Categoria removida');
      loadCategories();
    } catch {
      toast.error('Erro ao deletar categoria');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Categorias</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie as categorias de produtos da loja.</p>
        </div>
        <button 
          onClick={() => { setEditingCategory(null); setFormData({ name: '', slug: '', image_url: '' }); setIsModalOpen(true); }}
          className="bg-[#d4af37] text-black px-6 py-2.5 rounded-lg font-bold text-sm tracking-widest uppercase hover:brightness-110 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      <div className="bg-[#131313] border border-white/5 rounded-2xl overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-white/50">Nenhuma categoria encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-white/50 uppercase tracking-widest bg-[#1A1A1A]">
                <tr>
                  <th className="px-6 py-4 font-medium">Imagem</th>
                  <th className="px-6 py-4 font-medium">Nome</th>
                  <th className="px-6 py-4 font-medium">Slug</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-[#1A1A1A] border border-white/10 overflow-hidden relative flex items-center justify-center">
                        {cat.image_url ? (
                          <Image src={cat.image_url} alt={cat.name} fill className="object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider text-center px-1">Sem foto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{cat.name}</td>
                    <td className="px-6 py-4 text-white/50">{cat.slug}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingCategory(cat); setFormData({ name: cat.name, slug: cat.slug, image_url: cat.image_url || '' }); setIsModalOpen(true); }} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all text-white/50">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cat.id, cat.name, cat.image_url)} className="w-8 h-8 rounded-lg bg-red-400/10 text-red-400 flex items-center justify-center hover:bg-red-400/20 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-serif mb-6">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Nome</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#131313] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Slug</label>
                <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full bg-[#131313] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#d4af37] outline-none" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Imagem de Destaque</label>
                {formData.image_url ? (
                  <div className="relative aspect-video w-full bg-[#131313] rounded-lg border border-[#d4af37]/30 overflow-hidden group shadow-md">
                    <Image src={formData.image_url} alt="Categoria" fill className="object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" onClick={removeCategoryImage} className="text-white text-[10px] uppercase tracking-widest font-bold bg-red-500/20 hover:bg-red-500 py-1.5 px-3 border border-red-500 rounded transition-all">
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`relative border border-dashed ${uploadingImage ? 'border-[#d4af37]/50 bg-[#d4af37]/5' : 'border-white/10 hover:border-[#d4af37]/50'} rounded-lg p-6 text-center transition-all cursor-pointer`}>
                    <input type="file" accept="image/*" onChange={handleCategoryImageChange} disabled={uploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                    {uploadingImage ? (
                      <div className="space-y-2 py-2">
                        <Loader2 className="w-5 h-5 text-[#d4af37] mx-auto animate-spin" />
                        <p className="text-[10px] text-[#d4af37] font-medium">Comprimindo e enviando...</p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-white/40 mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-white/70">Carregar Imagem</p>
                        <p className="text-[10px] text-white/40">PNG, JPG, WebP (Max. 5MB)</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">Cancelar</button>
              <button onClick={handleSave} className="bg-[#d4af37] text-black px-5 py-2 rounded-lg font-bold text-xs tracking-widest uppercase hover:brightness-110">Salvar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
