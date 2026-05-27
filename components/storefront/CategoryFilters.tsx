'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Category } from '@/services/category.service';

interface CategoryFiltersProps {
  categories: Category[];
}

export function CategoryFilters({ categories }: CategoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'price' | 'material' | null>(null);

  // Lê filtros atuais da URL
  const currentCategory = searchParams.get('categoria') || '';
  const currentPriceSort = searchParams.get('preco') || '';
  const currentMaterial = searchParams.get('material') || '';

  // Atualiza um filtro específico na URL
  const handleFilterSelect = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.delete('pagina'); // Reinicia a página ao filtrar
    router.push(`/categoria?${params.toString()}`);
    setActiveDropdown(null);
  };

  // Limpa todos os filtros
  const handleClearFilters = () => {
    router.push('/categoria');
    setActiveDropdown(null);
  };

  const currentCategoryName = categories.find(c => c.slug === currentCategory)?.name || 'Coleção';
  
  const priceLabels: Record<string, string> = {
    'asc': 'Menor Preço',
    'desc': 'Maior Preço'
  };
  const currentPriceLabel = priceLabels[currentPriceSort] || 'Ordenar por Preço';

  const currentMaterialLabel = currentMaterial || 'Material';

  return (
    <div className="w-full flex flex-col items-center gap-4 mb-16 border-y border-white/5 py-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Dropdown de Categorias */}
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
            className={`font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#e5e2e1] px-6 py-3.5 border transition-all duration-400 flex items-center gap-2 cursor-pointer hover:border-[#f2ca50] active:scale-95 ${
              currentCategory ? 'border-[#f2ca50] text-[#f2ca50]' : 'border-white/10'
            }`}
          >
            {currentCategoryName}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'category' && (
            <div className="absolute top-[110%] left-0 w-48 bg-[#1A1A1A] border border-white/10 rounded-lg p-1.5 shadow-2xl z-30 space-y-0.5">
              <button 
                onClick={() => handleFilterSelect('categoria', '')}
                className="w-full text-left px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#d4af37]/10 hover:text-[#d4af37] rounded-md transition-colors text-white/70"
              >
                Todas Coleções
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => handleFilterSelect('categoria', cat.slug)}
                  className={`w-full text-left px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#d4af37]/10 hover:text-[#d4af37] rounded-md transition-colors ${
                    currentCategory === cat.slug ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'text-white/70'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown de Preço */}
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
            className={`font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#e5e2e1] px-6 py-3.5 border transition-all duration-400 flex items-center gap-2 cursor-pointer hover:border-[#f2ca50] active:scale-95 ${
              currentPriceSort ? 'border-[#f2ca50] text-[#f2ca50]' : 'border-white/10'
            }`}
          >
            {currentPriceLabel}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'price' && (
            <div className="absolute top-[110%] left-0 w-48 bg-[#1A1A1A] border border-white/10 rounded-lg p-1.5 shadow-2xl z-30 space-y-0.5">
              <button 
                onClick={() => handleFilterSelect('preco', '')}
                className="w-full text-left px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#d4af37]/10 hover:text-[#d4af37] rounded-md transition-colors text-white/70"
              >
                Sem ordenação
              </button>
              <button 
                onClick={() => handleFilterSelect('preco', 'asc')}
                className={`w-full text-left px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#d4af37]/10 hover:text-[#d4af37] rounded-md transition-colors ${
                  currentPriceSort === 'asc' ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'text-white/70'
                }`}
              >
                Menor Preço
              </button>
              <button 
                onClick={() => handleFilterSelect('preco', 'desc')}
                className={`w-full text-left px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#d4af37]/10 hover:text-[#d4af37] rounded-md transition-colors ${
                  currentPriceSort === 'desc' ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'text-white/70'
                }`}
              >
                Maior Preço
              </button>
            </div>
          )}
        </div>

        {/* Dropdown de Material */}
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'material' ? null : 'material')}
            className={`font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#e5e2e1] px-6 py-3.5 border transition-all duration-400 flex items-center gap-2 cursor-pointer hover:border-[#f2ca50] active:scale-95 ${
              currentMaterial ? 'border-[#f2ca50] text-[#f2ca50]' : 'border-white/10'
            }`}
          >
            {currentMaterialLabel}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === 'material' ? 'rotate-180' : ''}`} />
          </button>

          {activeDropdown === 'material' && (
            <div className="absolute top-[110%] left-0 w-48 bg-[#1A1A1A] border border-white/10 rounded-lg p-1.5 shadow-2xl z-30 space-y-0.5">
              <button 
                onClick={() => handleFilterSelect('material', '')}
                className="w-full text-left px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#d4af37]/10 hover:text-[#d4af37] rounded-md transition-colors text-white/70"
              >
                Todos Materiais
              </button>
              {['Ouro Amarelo', 'Ouro Branco', 'Ouro Rosé', 'Prata', 'Platina'].map(mat => (
                <button 
                  key={mat}
                  onClick={() => handleFilterSelect('material', mat)}
                  className={`w-full text-left px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold hover:bg-[#d4af37]/10 hover:text-[#d4af37] rounded-md transition-colors ${
                    currentMaterial === mat ? 'bg-[#d4af37]/15 text-[#d4af37]' : 'text-white/70'
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Limpar Filtros */}
        {(currentCategory || currentPriceSort || currentMaterial) && (
          <button 
            onClick={handleClearFilters}
            className="p-3 border border-red-500/20 hover:border-red-500 bg-red-500/10 text-red-400 hover:text-white rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold"
            title="Limpar todos os filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
