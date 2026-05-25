'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { productService } from '@/services/product.service';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function ProductsPage() {
  const { products, loading, refetch } = useProducts();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este produto?')) return;
    try {
      setDeletingId(id);
      await productService.deleteProduct(id);
      toast.success('Produto deletado com sucesso!');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao deletar produto');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtragem local. Como products é cacheado, funciona bem.
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter((p) => 
      p.name.toLowerCase().includes(lower) || 
      (p.category && p.category.toLowerCase().includes(lower))
    );
  }, [products, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Produtos</h1>
          <p className="text-white/50 text-sm mt-1">Gerencie seu catálogo, estoque e preços.</p>
        </div>
        <Link 
          href="/admin/products/new"
          className="bg-[#d4af37] text-black px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#ebd070] transition-colors flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#131313] border border-white/5 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1A1A1A]/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37] transition-all"
            />
          </div>
          <button className="flex items-center gap-2 text-white/70 hover:text-white px-4 py-2 border border-white/10 rounded-lg text-sm transition-all w-full sm:w-auto justify-center bg-[#1A1A1A]">
            <Filter className="w-4 h-4" /> Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/50 uppercase tracking-widest bg-[#1A1A1A]/30">
              <tr>
                <th className="px-6 py-4 font-medium">Produto</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Preço</th>
                <th className="px-6 py-4 font-medium">Estoque</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/50">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#d4af37]" />
                    Carregando produtos...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/50">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden flex-shrink-0 bg-[#1A1A1A] relative">
                        {product.images && product.images[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover"  referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Sem foto</div>
                        )}
                      </div>
                      <span className="font-medium text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70">{product.category || '-'}</td>
                  <td className="px-6 py-4 font-serif text-[#d4af37]">R$ {product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="text-white/80">{product.stock} un.</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest border font-medium ${
                      product.status === 'Ativo' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                      product.status === 'Esgotado' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                      product.status === 'Inativo' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                      'bg-white/10 text-white/70 border-white/20'
                    }`}>
                      {product.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/products/edit/${product.id}`} className="p-2 text-white/50 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="p-2 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-white/50">
          <span>{filteredProducts.length} produtos encontrados</span>
        </div>

      </motion.div>
    </div>
  );
}
