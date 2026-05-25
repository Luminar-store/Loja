'use client';

import { ProductOption, SelectedOption } from '@/types/product-options';
import { FadeIn } from './animations';

interface ProductVariantSelectorProps {
  options: ProductOption[];
  selectedOptions: SelectedOption[];
  onSelectOption: (optionId: string, valueId: string) => void;
  loading: boolean;
}

export function ProductVariantSelector({ options, selectedOptions, onSelectOption, loading }: ProductVariantSelectorProps) {
  if (loading) {
    return (
      <div className="space-y-4 pt-4 animate-pulse">
        <div className="h-4 bg-white/10 w-24 rounded"></div>
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-12 h-12 bg-white/10 rounded-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!options || options.length === 0) return null;

  return (
    <div className="space-y-6 pt-4">
      {options.map((option, idx) => (
        <FadeIn key={option.id} delay={0.6 + idx * 0.1} direction="left">
          <span className="font-sans text-[12px] font-bold tracking-widest uppercase block text-white mb-4">
            Selecione: {option.name}
          </span>
          <div className="flex flex-wrap gap-3">
            {option.values?.map(val => {
              const isSelected = selectedOptions.find(
                s => s.option_id === option.id && s.value_id === val.id
              );
              
              return (
                <button
                  key={val.id}
                  onClick={() => onSelectOption(option.id, val.id)}
                  className={`
                    px-4 py-3 font-sans text-[12px] font-medium tracking-wider uppercase transition-all duration-300
                    ${isSelected 
                      ? 'bg-[#D4AF37] text-black border border-[#D4AF37]' 
                      : 'bg-transparent text-white/70 border border-white/20 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                    }
                  `}
                >
                  {val.value}
                </button>
              );
            })}
          </div>
        </FadeIn>
      ))}
    </div>
  );
}
