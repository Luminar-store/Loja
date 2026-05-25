'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, X, Check } from 'lucide-react';
import { productOptionsService } from '@/services/product-options.service';
import { ProductOption } from '@/types/product-options';
import { ProductOptionItem } from './product-options/ProductOptionItem';
import toast from 'react-hot-toast';

interface ProductOptionsManagerProps {
  productId: string;
}

export function ProductOptionsManager({ productId }: ProductOptionsManagerProps) {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  // States for new option
  const [addingOption, setAddingOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productOptionsService.getOptionsByProductId(productId);
      setOptions(data);
    } catch (error) {
      toast.error('Erro ao carregar opções do produto');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const init = async () => {
      await loadOptions();
    };
    init();
  }, [loadOptions]);

  // --- Options CRUD ---

  const handleCreateOption = async () => {
    if (!newOptionName.trim()) return;
    try {
      await productOptionsService.createOption({
        product_id: productId,
        name: newOptionName.trim()
      });
      toast.success('Opção criada');
      setNewOptionName('');
      setAddingOption(false);
      loadOptions();
    } catch {
      toast.error('Erro ao criar opção');
    }
  };

  const handleUpdateOption = async (id: string, name: string) => {
    try {
      await productOptionsService.updateOption(id, { name });
      toast.success('Opção atualizada');
      loadOptions();
    } catch {
      toast.error('Erro ao editar opção');
    }
  };

  const handleDeleteOption = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar a opção "${name}" e todos os seus valores?`)) return;
    try {
      await productOptionsService.deleteOption(id);
      toast.success('Opção removida');
      loadOptions();
    } catch {
      toast.error('Erro ao deletar opção');
    }
  };

  // --- Values CRUD ---

  const handleCreateValue = async (optionId: string, form: { value: string; price_modifier: number }) => {
    if (!form.value.trim()) return;
    try {
      await productOptionsService.createOptionValue({
        option_id: optionId,
        value: form.value.trim(),
        price_modifier: form.price_modifier
      });
      toast.success('Valor adicionado');
      loadOptions();
    } catch {
      toast.error('Erro ao adicionar valor');
    }
  };

  const handleUpdateValue = async (id: string, form: { value: string; price_modifier: number }) => {
    try {
      await productOptionsService.updateOptionValue(id, {
        value: form.value.trim(),
        price_modifier: form.price_modifier
      });
      toast.success('Valor atualizado');
      loadOptions();
    } catch {
      toast.error('Erro ao editar valor');
    }
  };

  const handleDeleteValue = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este valor?')) return;
    try {
      await productOptionsService.deleteOptionValue(id);
      toast.success('Valor removido');
      loadOptions();
    } catch {
      toast.error('Erro ao deletar valor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-[#131313] border border-white/5 rounded-2xl">
        <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#131313] border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-serif">Variações do Produto</h2>
          <p className="text-white/50 text-sm mt-1">Gerencie tamanhos, cores, espessuras e modificadores de preço.</p>
        </div>
        {!addingOption && (
          <button
            onClick={() => setAddingOption(true)}
            className="px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-lg hover:bg-[#D4AF37]/20 transition-all text-sm font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar Opção
          </button>
        )}
      </div>

      <div className="p-6 space-y-8">
        {addingOption && (
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl p-5 flex items-end gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Nome da Opção</label>
              <input
                type="text"
                placeholder="Ex: Comprimento, Espessura, Aro..."
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                className="w-full bg-[#131313] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#D4AF37] outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateOption} className="w-10 h-10 rounded-lg bg-[#D4AF37] text-black flex items-center justify-center hover:brightness-110">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setAddingOption(false)} className="w-10 h-10 rounded-lg bg-white/5 text-white/50 flex items-center justify-center hover:bg-white/10 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {options.length === 0 && !addingOption && (
          <div className="text-center py-10">
            <p className="text-white/40 text-sm">Nenhuma variação cadastrada para este produto.</p>
          </div>
        )}

        <div className="space-y-6">
          {options.map((option) => (
            <ProductOptionItem
              key={option.id}
              option={option}
              onUpdateOption={handleUpdateOption}
              onDeleteOption={handleDeleteOption}
              onCreateValue={handleCreateValue}
              onUpdateValue={handleUpdateValue}
              onDeleteValue={handleDeleteValue}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
