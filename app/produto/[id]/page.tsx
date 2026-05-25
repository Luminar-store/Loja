import Image from 'next/image';
import { notFound } from 'next/navigation';
import { productService } from '@/services/product.service';
import { ProductForm } from '@/components/ProductForm';
import { FadeIn, HoverImage } from '@/components/animations';
import { AlertTriangle, Gem, PenTool, ShieldCheck } from 'lucide-react';

import type { Metadata } from 'next';

export const revalidate = 0; // Disable static rendering

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const product = await productService.getProductById(resolvedParams.id);
    if (!product || ['Oculto', 'Rascunho', 'Inativo'].includes(product.status || '')) {
      return { title: 'Produto Não Encontrado | Luminar Joias' };
    }
    return {
      title: `${product.name} | Luminar Joias`,
      description: product.description || `Confira ${product.name} na Luminar Joias.`,
      openGraph: {
        title: product.name,
        description: product.description || '',
        images: product.images && product.images.length > 0 ? [{ url: product.images[0] }] : [],
      },
    };
  } catch (error) {
    return { title: 'Luminar Joias' };
  }
}

// Using async params for Next.js 15+ 
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let product = null;
  try {
    product = await productService.getProductById(resolvedParams.id);
  } catch (error) {
    product = null;
  }
  
  if (!product || ['Oculto', 'Rascunho', 'Inativo'].includes(product.status || '')) {
    notFound();
  }

  const isLimited = product.stock !== null && product.stock <= 5;
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://picsum.photos/seed/placeholder/800/1000'; // fallback
    
  const imageUrl1 = product.images && product.images.length > 1 ? product.images[1] : `https://picsum.photos/seed/${product.id}detail1/800/800`;
  const imageUrl2 = product.images && product.images.length > 2 ? product.images[2] : `https://picsum.photos/seed/${product.id}detail2/800/800`;

  return (
    <div className="w-full flex flex-col">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32 pt-16">
          {/* Gallery Section */}
          <section className="lg:col-span-7 flex flex-col md:flex-row-reverse gap-4">
            <FadeIn direction="right" className="w-full">
              <div className="w-full aspect-square bg-[#20201f] overflow-hidden relative border border-white/5">
                {product.is_made_to_order && (
                  <div className="absolute top-6 right-6 z-10 px-3 py-1 bg-[#131313]/50 backdrop-blur-md border border-[#D4AF37]/30">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                      ✦ Sob Encomenda
                    </span>
                  </div>
                )}
                <HoverImage
                  src={imageUrl}
                  alt={product.name}
                  fill
                  priority
                />
              </div>
            </FadeIn>
            
            <FadeIn direction="right" delay={0.2}>
              <div className="flex md:flex-col gap-4 overflow-x-auto no-scrollbar md:w-24">
                <div className="w-20 h-20 flex-shrink-0 border border-[#D4AF37] opacity-100 relative transition-transform duration-300 hover:scale-105 cursor-pointer">
                  <Image src={imageUrl} alt="Thumb 1" fill className="object-cover" referrerPolicy="no-referrer"/>
                </div>
                <div className="w-20 h-20 flex-shrink-0 ghost-border opacity-50 hover:opacity-100 transition-all duration-300 relative cursor-pointer hover:scale-105">
                  <Image src={imageUrl1} alt="Thumb 2" fill className="object-cover" referrerPolicy="no-referrer"/>
                </div>
                <div className="w-20 h-20 flex-shrink-0 ghost-border opacity-50 hover:opacity-100 transition-all duration-300 relative cursor-pointer hover:scale-105">
                  <Image src={imageUrl2} alt="Thumb 3" fill className="object-cover" referrerPolicy="no-referrer"/>
                </div>
              </div>
            </FadeIn>
          </section>

          {/* Information Section */}
          <section className="lg:col-span-5 flex flex-col space-y-8">
            <FadeIn delay={0.3} direction="left" className="space-y-4">
              <span className="font-sans text-[12px] font-bold text-[#f2ca50] tracking-[0.2em] uppercase">
                COLEÇÃO {product.category}
              </span>
              <h1 className="font-serif text-[32px] text-white uppercase">{product.name}</h1>
            </FadeIn>

            <ProductForm product={product as any} />

            {(isLimited || product.status === 'Esgotado' || product.stock === 0) && (
              <FadeIn delay={0.5} direction="left" className={`flex items-center gap-3 py-4 px-5 border ${(product.status === 'Esgotado' || product.stock === 0) ? 'border-red-500/20 bg-red-500/5' : 'border-[#D4AF37]/20 bg-[#D4AF37]/5'}`}>
                <AlertTriangle className={`w-5 h-5 ${(product.status === 'Esgotado' || product.stock === 0) ? 'text-red-500' : 'text-[#D4AF37]'}`} />
                <p className={`font-sans text-[12px] font-bold ${(product.status === 'Esgotado' || product.stock === 0) ? 'text-red-500' : 'text-[#D4AF37]'} tracking-widest uppercase`}>
                  {(product.status === 'Esgotado' || product.stock === 0) ? 'Produto Esgotado' : `Produção em andamento. Últimas unidades.`}
                </p>
              </FadeIn>
            )}

            {/* Shipping */}
            <FadeIn delay={0.8} direction="left" className="space-y-4 pt-6 border-t border-white/10">
              <span className="font-sans text-[12px] font-bold tracking-widest uppercase block text-white">Calcular Frete</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="00000-000" 
                  className="bg-transparent border-b border-white/20 focus:border-[#f2ca50] outline-none py-2 px-1 flex-grow font-sans text-white transition-colors duration-300"
                />
                <button className="px-6 py-2 border border-[#f2ca50] text-[#f2ca50] font-sans text-[12px] font-bold tracking-widest uppercase hover:bg-[#f2ca50] hover:text-black transition-all duration-300 active:scale-95">
                  Calcular
                </button>
              </div>
            </FadeIn>

            {/* Tabs */}
            <FadeIn delay={0.9} direction="left" className="pt-10 space-y-6 flex-1">
              <div className="border-b border-white/10 flex gap-8">
                <button className="pb-4 border-b-2 border-[#f2ca50] font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-[#f2ca50] transition-colors duration-300">
                  História da Peça
                </button>
                <button className="pb-4 border-b-2 border-transparent font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors duration-300">
                  Materiais
                </button>
              </div>
              <div className="text-[16px] font-sans text-white/70 leading-relaxed space-y-4 font-light">
                <p>{product.description}</p>
                <ul className="space-y-2 list-none p-0">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#f2ca50] rounded-full"></span> Material: {product.material || 'Ouro 18k'}</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#f2ca50] rounded-full"></span> Peso: {product.weight ? `${product.weight}kg` : '-'}</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#f2ca50] rounded-full"></span> Dimensões: {product.width}cm x {product.height}cm</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-[#f2ca50] rounded-full"></span> Design Exclusivo Luminar</li>
                </ul>
              </div>
            </FadeIn>
          </section>
        </div>
        
        {/* Featured Section */}
        <FadeIn direction="up">
          <section className="mt-32 py-16 lg:py-32 border-t border-white/5 text-center">
            <h2 className="font-serif text-[32px] uppercase mb-16 tracking-widest text-[#e5e2e1]">Artesania Eterna</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <FadeIn delay={0.2} direction="up" className="space-y-4 px-6 flex flex-col items-center">
                <Gem className="text-[#f2ca50] w-10 h-10" strokeWidth={1} />
                <h3 className="font-serif uppercase text-sm tracking-widest text-[#e5e2e1]">Pedras Certificadas</h3>
                <p className="text-white/50 text-sm font-sans">Garantimos a procedência e pureza de cada diamante utilizado em nossas criações.</p>
              </FadeIn>
              <FadeIn delay={0.3} direction="up" className="space-y-4 px-6 flex flex-col items-center">
                <PenTool className="text-[#f2ca50] w-10 h-10" strokeWidth={1} />
                <h3 className="font-serif uppercase text-sm tracking-widest text-[#e5e2e1]">Design Autoral</h3>
                <p className="text-white/50 text-sm font-sans">Peças desenhadas à mão para eternizar momentos únicos com sofisticação singular.</p>
              </FadeIn>
              <FadeIn delay={0.4} direction="up" className="space-y-4 px-6 flex flex-col items-center">
                <ShieldCheck className="text-[#f2ca50] w-10 h-10" strokeWidth={1} />
                <h3 className="font-serif uppercase text-sm tracking-widest text-[#e5e2e1]">Garantia Vitalícia</h3>
                <p className="text-white/50 text-sm font-sans">Nosso compromisso com a excelência acompanha sua joia por toda a vida.</p>
              </FadeIn>
            </div>
          </section>
        </FadeIn>
      </div>
    </div>
  );
}
