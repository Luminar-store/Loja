'use client';

import { OptionValue } from '@/types/product-options';
import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export interface OptionValueProps {
  val: OptionValue;
  onUpdateValue: (id: string, form: { value: string; price_modifier: number }) => Promise<void>;
  onDeleteValue: (id: string) => Promise<void>;
}

export function OptionValueItem({ val, onUpdateValue, onDeleteValue }: OptionValueProps) {
  const [editingValue, setEditingValue] = useState<{ id: string, value: string, price_modifier: number } | null>(null);

  const handleUpdate = async () => {
    if (!editingValue || !editingValue.value.trim()) return;
    await onUpdateValue(val.id, {
      value: editingValue.value.trim(),
      price_modifier: editingValue.price_modifier
    });
    setEditingValue(null);
  };

  return (
    <div className="flex items-center justify-between bg-[#131313] border border-white/5 p-3 rounded-lg group">
      {editingValue?.id === val.id ? (
        <div className="flex flex-col gap-2 w-full">
          <input
            type="text"
            value={editingValue.value}
            onChange={e => setEditingValue({...editingValue, value: e.target.value})}
            className="bg-[#1A1A1A] border border-white/10 rounded py-1 px-3 text-sm text-white focus:border-[#D4AF37]"
            placeholder="Valor (ex: 60cm)"
          />
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">R$ +</span>
            <input
              type="number"
              value={editingValue.price_modifier}
              onChange={e => setEditingValue({...editingValue, price_modifier: Number(e.target.value)})}
              className="bg-[#1A1A1A] w-24 border border-white/10 rounded py-1 px-3 text-sm text-white focus:border-[#D4AF37]"
              placeholder="Modificador"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={handleUpdate} className="text-xs bg-[#D4AF37] text-black px-3 py-1 rounded font-bold">Salvar</button>
            <button onClick={() => setEditingValue(null)} className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded">Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <span className="text-white text-sm block font-medium">{val.value}</span>
            {val.price_modifier > 0 ? (
              <span className="text-[#D4AF37] text-xs font-bold">+ R$ {val.price_modifier.toFixed(2)}</span>
            ) : val.price_modifier < 0 ? (
              <span className="text-red-400 text-xs font-bold">- R$ {Math.abs(val.price_modifier).toFixed(2)}</span>
            ) : (
              <span className="text-white/30 text-xs">Sem custo adicional</span>
            )}
          </div>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditingValue({ id: val.id, value: val.value, price_modifier: val.price_modifier })} className="p-1.5 text-white/40 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDeleteValue(val.id)} className="p-1.5 text-white/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </>
      )}
    </div>
  );
}
