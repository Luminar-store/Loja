'use client';

import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

interface AddOptionValueFormProps {
  onCancel: () => void;
  onSubmit: (form: { value: string; price_modifier: number }) => Promise<void>;
}

export function AddOptionValueForm({ onCancel, onSubmit }: AddOptionValueFormProps) {
  const [form, setForm] = useState({ value: '', price_modifier: 0 });

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-[#1A1A1A] p-3 rounded-lg border border-dashed border-[#D4AF37]/30">
      <input
        type="text"
        className="bg-[#131313] border border-white/10 rounded py-2 px-3 text-sm text-white focus:border-[#D4AF37] outline-none flex-1 w-full"
        placeholder="Novo valor (ex: 70cm, 3mm)"
        value={form.value}
        onChange={e => setForm({...form, value: e.target.value})}
        autoFocus
      />
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-32">
          <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="number"
            className="w-full bg-[#131313] border border-white/10 rounded py-2 pl-9 pr-3 text-sm text-white focus:border-[#D4AF37] outline-none"
            placeholder="Mod. Preço"
            value={form.price_modifier === 0 ? '' : form.price_modifier}
            onChange={e => setForm({...form, price_modifier: Number(e.target.value)})}
          />
        </div>
        <button onClick={() => onSubmit(form)} className="bg-[#D4AF37] text-black h-9 px-4 rounded text-sm font-bold flex-shrink-0 hover:brightness-110">
          Add
        </button>
        <button onClick={onCancel} className="bg-white/5 text-white/50 h-9 w-9 flex items-center justify-center rounded hover:bg-white/10 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
