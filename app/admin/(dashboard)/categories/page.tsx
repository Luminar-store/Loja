'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Loader2, Edit2, Trash2 } from 'lucide-react';
import { categoryService, Category } from '@/services/category.service';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({ name: '', slug: '' });

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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar a categoria "${name}"?`)) return;
    try {
      await categoryService.deleteCategory(id);
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
          onClick={() => { setEditingCategory(null); setFormData({ name: '', slug: '' }); setIsModalOpen(true); }}
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
                  <th className="px-6 py-4 font-medium">Nome</th>
                  <th className="px-6 py-4 font-medium">Slug</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium">{cat.name}</td>
                    <td className="px-6 py-4 text-white/50">{cat.slug}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingCategory(cat); setFormData({ name: cat.name, slug: cat.slug }); setIsModalOpen(true); }} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all text-white/50">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cat.id, cat.name)} className="w-8 h-8 rounded-lg bg-red-400/10 text-red-400 flex items-center justify-center hover:bg-red-400/20 transition-all">
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
