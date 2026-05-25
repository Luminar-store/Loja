'use client';

import { useState } from 'react';
import { useCustomOrder } from '@/hooks/useCustomOrder';
import { FadeIn } from '@/components/animations';
import { Loader2, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

const MODELS = ['Corrente Cubana', 'Corrente Grumet', 'Corrente Cartier', 'Pulseira Cubana', 'Pingente', 'Outro'];
const LENGTHS = ['50cm', '60cm', '70cm', 'Personalizado'];
const THICKNESSES = ['1mm', '2mm', '3mm', '4mm', '6mm', 'Personalizada'];
const MATERIALS = ['Prata 925', 'Banhado a Ouro 18k', 'Ouro 18k Maciço'];

export function CustomOrderForm() {
  const { submitOrder, loading } = useCustomOrder();

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    model: MODELS[0],
    length: LENGTHS[0],
    thickness: THICKNESSES[0],
    material: MATERIALS[0],
    notes: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [customModel, setCustomModel] = useState('');
  const [customLength, setCustomLength] = useState('');
  const [customThickness, setCustomThickness] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revogar URL anterior antes de criar nova
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalPayload = {
      ...form,
      model: form.model === 'Outro' ? customModel || 'Outro' : form.model,
      length: form.length === 'Personalizado' ? customLength || 'Personalizado' : form.length,
      thickness: form.thickness === 'Personalizada' ? customThickness || 'Personalizada' : form.thickness,
    };

    const success = await submitOrder(finalPayload, imageFile);
    if (success) {
      setForm({
        customer_name: '',
        customer_phone: '',
        model: MODELS[0],
        length: LENGTHS[0],
        thickness: THICKNESSES[0],
        material: MATERIALS[0],
        notes: ''
      });
      clearImage();
      setCustomModel('');
      setCustomLength('');
      setCustomThickness('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-12 pb-24">
      {/* Model Selection */}
      <FadeIn delay={0.2} direction="up">
        <div className="space-y-4">
          <h3 className="font-serif text-[20px] text-[#D4AF37]">1. O que você deseja criar?</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MODELS.map(model => (
              <button
                key={model}
                type="button"
                onClick={() => setForm({ ...form, model })}
                className={`p-4 border font-sans text-[12px] uppercase tracking-widest font-bold transition-all duration-300
                  ${form.model === model 
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-black' 
                    : 'bg-[#111] border-white/10 text-white/70 hover:border-[#D4AF37]/50 hover:text-white'
                  }
                `}
              >
                {model}
              </button>
            ))}
          </div>
          {form.model === 'Outro' && (
            <input
              type="text"
              placeholder="Descreva o modelo desejado..."
              required
              value={customModel}
              onChange={e => setCustomModel(e.target.value)}
              className="w-full mt-3 bg-transparent border-b border-white/20 pb-2 text-white font-sans focus:border-[#D4AF37] outline-none transition-colors"
            />
          )}
        </div>
      </FadeIn>

      {/* Length & Thickness */}
      <FadeIn delay={0.3} direction="up">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Length */}
          <div className="space-y-4">
            <h3 className="font-serif text-[20px] text-[#D4AF37]">2. Comprimento</h3>
            <div className="flex flex-wrap gap-3">
              {LENGTHS.map(len => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setForm({ ...form, length: len })}
                  className={`px-5 py-3 border font-sans text-[12px] uppercase tracking-widest font-bold transition-all duration-300
                    ${form.length === len 
                      ? 'bg-[#D4AF37] border-[#D4AF37] text-black' 
                      : 'bg-[#111] border-white/10 text-white/70 hover:border-[#D4AF37]/50 hover:text-white'
                    }
                  `}
                >
                  {len}
                </button>
              ))}
            </div>
            {form.length === 'Personalizado' && (
              <input
                type="text"
                placeholder="Ex: 65cm"
                required
                value={customLength}
                onChange={e => setCustomLength(e.target.value)}
                className="w-full mt-3 bg-transparent border-b border-white/20 pb-2 text-white font-sans focus:border-[#D4AF37] outline-none transition-colors"
              />
            )}
          </div>

          {/* Thickness */}
          <div className="space-y-4">
            <h3 className="font-serif text-[20px] text-[#D4AF37]">3. Espessura</h3>
            <div className="flex flex-wrap gap-3">
              {THICKNESSES.map(thick => (
                <button
                  key={thick}
                  type="button"
                  onClick={() => setForm({ ...form, thickness: thick })}
                  className={`px-5 py-3 border font-sans text-[12px] uppercase tracking-widest font-bold transition-all duration-300
                    ${form.thickness === thick 
                      ? 'bg-[#D4AF37] border-[#D4AF37] text-black' 
                      : 'bg-[#111] border-white/10 text-white/70 hover:border-[#D4AF37]/50 hover:text-white'
                    }
                  `}
                >
                  {thick}
                </button>
              ))}
            </div>
            {form.thickness === 'Personalizada' && (
              <input
                type="text"
                placeholder="Ex: 5.5mm"
                required
                value={customThickness}
                onChange={e => setCustomThickness(e.target.value)}
                className="w-full mt-3 bg-transparent border-b border-white/20 pb-2 text-white font-sans focus:border-[#D4AF37] outline-none transition-colors"
              />
            )}
          </div>
        </div>
      </FadeIn>

      {/* Material */}
      <FadeIn delay={0.4} direction="up">
        <div className="space-y-4">
          <h3 className="font-serif text-[20px] text-[#D4AF37]">4. Material</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MATERIALS.map(mat => (
              <button
                key={mat}
                type="button"
                onClick={() => setForm({ ...form, material: mat })}
                className={`p-4 border font-sans text-[12px] uppercase tracking-widest font-bold transition-all duration-300
                  ${form.material === mat 
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-black' 
                    : 'bg-[#111] border-white/10 text-white/70 hover:border-[#D4AF37]/50 hover:text-white'
                  }
                `}
              >
                {mat}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Image Reference */}
      <FadeIn delay={0.5} direction="up">
        <div className="space-y-4">
          <h3 className="font-serif text-[20px] text-[#D4AF37]">5. Referência Visual <span className="text-white/30 text-sm font-sans">(Opcional)</span></h3>
          <p className="text-white/50 text-sm font-sans">Tem alguma foto do que imaginou? Faça upload aqui.</p>
          
          {imagePreview ? (
            <div className="relative w-48 h-48 border border-white/20 rounded-lg overflow-hidden group">
              <Image src={imagePreview} alt="Reference" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={clearImage}
                  className="w-10 h-10 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full sm:w-2/3 md:w-1/2 h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-[#111] hover:border-[#D4AF37]/50 hover:bg-[#1a1a1a] transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <UploadCloud className="w-8 h-8 text-white/40 mb-2 shrink-0" />
                <p className="text-sm text-white/60 font-sans whitespace-nowrap"><span className="font-bold text-[#D4AF37]">Clique para enviar</span> ou arraste</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>
      </FadeIn>

      {/* Notes & Contact */}
      <FadeIn delay={0.6} direction="up">
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-serif text-[20px] text-[#D4AF37]">6. Detalhes Especiais</h3>
            <textarea
              placeholder="Ex: Gostaria de um fecho cravado, acabamento fosco..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={4}
              className="w-full bg-[#111] border border-white/10 rounded-lg p-4 text-white font-sans focus:border-[#D4AF37] outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-sans block">Seu Nome</label>
              <input
                type="text"
                required
                value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white font-sans focus:border-[#D4AF37] outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/60 text-sm font-sans block">Seu WhatsApp</label>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white font-sans focus:border-[#D4AF37] outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.7} direction="up">
        <div className="pt-8 border-t border-white/10 flex flex-col items-center">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-[#D4AF37] text-black font-sans font-bold h-14 px-4 sm:px-12 text-[11px] sm:text-[14px] tracking-[0.1em] sm:tracking-[0.2em] whitespace-nowrap hover:brightness-110 transition-all active:scale-[0.98] uppercase flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Gerando Orçamento...</>
            ) : (
              <>
                Solicitar Orçamento via WhatsApp
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </>
            )}
          </button>
          <p className="mt-4 text-white/40 text-[10px] font-sans tracking-widest uppercase">
            Sua solicitação será processada por nossa equipe e você receberá um retorno em breve.
          </p>
        </div>
      </FadeIn>
    </form>
  );
}
