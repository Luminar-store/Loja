import { Metadata } from 'next';
import { CustomOrderForm } from '@/components/custom-orders/CustomOrderForm';
import { FadeIn } from '@/components/animations';

export const metadata: Metadata = {
  title: 'Joias Personalizadas | Luminar Joias',
  description: 'Crie sua joia exclusiva conosco sob encomenda.',
};

export default function CustomOrdersPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] pt-24 pb-12">
      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <FadeIn direction="up">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl text-white leading-tight">
              Crie Sua <span className="text-[#D4AF37] italic">Joia Exclusiva</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2} direction="up">
            <p className="font-sans text-white/60 text-xs sm:text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed px-4">
              Escolha cada detalhe da sua peça - modelo, espessura, comprimento e material - e solicite um orçamento personalizado. 
              Nossa equipe entrará em contato via WhatsApp com os valores e prazos.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Configurator */}
      <section className="px-6 md:px-12 relative z-10">
        <CustomOrderForm />
      </section>
    </div>
  );
}
