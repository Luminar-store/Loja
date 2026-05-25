'use client';

import { OptionValueProps, OptionValueItem } from '../option-values/OptionValueItem';
import { ProductOption } from '@/types/product-options';
import { useState } from 'react';
import { Check, Edit2, Trash2, X, Plus } from 'lucide-react';
import { AddOptionValueForm } from '../option-values/AddOptionValueForm';

interface ProductOptionItemProps {
  option: ProductOption;
  onUpdateOption: (id: string, name: string) => Promise<void>;
  onDeleteOption: (id: string, name: string) => Promise<void>;
  onCreateValue: (optionId: string, form: { value: string; price_modifier: number }) => Promise<void>;
  onUpdateValue: (id: string, form: { value: string; price_modifier: number }) => Promise<void>;
  onDeleteValue: (id: string) => Promise<void>;
}

export function ProductOptionItem({
  option,
  onUpdateOption,
  onDeleteOption,
  onCreateValue,
  onUpdateValue,
  onDeleteValue
}: ProductOptionItemProps) {
  const [editingOption, setEditingOption] = useState<{ id: string, name: string } | null>(null);
  const [addingValue, setAddingValue] = useState(false);

  const handleUpdateOption = async (id: string) => {
    if (!editingOption || !editingOption.name.trim()) return;
    await onUpdateOption(id, editingOption.name.trim());
    setEditingOption(null);
  };

  return (
    <div className="border border-white/10 rounded-xl bg-[#161616] overflow-hidden">
      {/* Option Header */}
      <div className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-white/5">
        {editingOption?.id === option.id ? (
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <input
              type="text"
              className="w-full bg-[#131313] border border-white/10 rounded py-1.5 px-3 text-sm text-white focus:border-[#D4AF37] outline-none"
              value={editingOption.name}
              onChange={(e) => setEditingOption({ ...editingOption, name: e.target.value })}
              autoFocus
            />
            <button onClick={() => handleUpdateOption(option.id)} className="text-[#D4AF37] hover:brightness-110"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditingOption(null)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <h3 className="font-sans font-bold text-sm tracking-widest uppercase text-[#D4AF37]">
            {option.name}
          </h3>
        )}
        
        <div className="flex items-center gap-2">
          <button onClick={() => setEditingOption({ id: option.id, name: option.name })} className="p-1.5 text-white/40 hover:text-white transition-colors" title="Editar Opção">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDeleteOption(option.id, option.name)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors" title="Remover Opção">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Option Values List */}
      <div className="p-4">
        {option.values && option.values.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {option.values.map(val => (
              <OptionValueItem
                key={val.id}
                val={val}
                onUpdateValue={onUpdateValue}
                onDeleteValue={onDeleteValue}
              />
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs italic mb-4">Nenhum valor cadastrado nesta opção.</p>
        )}

        {/* Add Value Form */}
        {addingValue ? (
          <AddOptionValueForm
            onCancel={() => setAddingValue(false)}
            onSubmit={async (form) => {
              await onCreateValue(option.id, form);
              setAddingValue(false);
            }}
          />
        ) : (
          <button
            onClick={() => setAddingValue(true)}
            className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest flex items-center gap-1 hover:brightness-110"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Valor
          </button>
        )}
      </div>
    </div>
  );
}
