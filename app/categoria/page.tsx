import { ProductCard } from "@/components/ProductCard";
import { productService } from "@/services/product.service";
import { FadeIn } from "@/components/animations";
import { ChevronDown } from 'lucide-react';

export const revalidate = 0; // Disable static rendering

export default async function CategoryPage() {
  const products = await productService.listProducts();
  const validProducts = products.filter(p => !['Rascunho', 'Oculto', 'Inativo'].includes(p.status || ''));

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-16 py-16 lg:py-24">
      {/* Page Header */}
      <FadeIn direction="up">
        <div className="mb-20 text-center">
          <p className="text-[#f2ca50] font-sans text-[12px] font-bold tracking-[0.4em] uppercase mb-4">Catálogo Completo</p>
          <h1 className="font-serif text-[48px] text-[#e5e2e1] mb-6 leading-[1.2]">Alta Joalheria</h1>
          <p className="font-sans text-[18px] text-[#d0c5af] max-w-2xl mx-auto font-light leading-[1.6]">
            Esculturas em ouro e pedras preciosas, desenhadas para capturar a luz e celebrar momentos eternos. Materiais de origem conflituosa e fascinante, moldados sob a pressão da perfeição.
          </p>
        </div>
      </FadeIn>

      {/* Filter Bar */}
      <FadeIn delay={0.2} direction="up">
        <div className="flex flex-wrap items-center justify-center gap-6 mb-20 border-y border-white/5 py-8">
          <button className="font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-[#e5e2e1] px-8 py-3 ghost-border transition-all duration-400 flex items-center gap-2 cursor-pointer hover:border-[#f2ca50] active:scale-95">
            Coleção <ChevronDown className="w-4 h-4" />
          </button>
          <button className="font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-[#e5e2e1] px-8 py-3 ghost-border transition-all duration-400 flex items-center gap-2 cursor-pointer hover:border-[#f2ca50] active:scale-95">
            Preço <ChevronDown className="w-4 h-4" />
          </button>
          <button className="font-sans text-[12px] font-bold tracking-[0.2em] uppercase text-[#e5e2e1] px-8 py-3 ghost-border transition-all duration-400 flex items-center gap-2 cursor-pointer hover:border-[#f2ca50] active:scale-95">
            Material <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </FadeIn>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-16">
        {validProducts.map((product, index) => (
          <FadeIn key={product.id} delay={(index % 3) * 0.1} direction="up" fullWidth>
            <ProductCard product={product} />
          </FadeIn>
        ))}
      </div>
      
      {/* Load More */}
      <FadeIn delay={0.3} direction="up">
        <div className="mt-24 text-center">
          <button className="bg-[#f2ca50] text-[#3c2f00] font-sans text-[12px] font-bold px-12 py-5 tracking-[0.3em] uppercase hover:brightness-110 active:scale-[0.98] transition-all duration-400 cursor-pointer">
            Ver mais peças
          </button>
        </div>
      </FadeIn>
    </div>
  );
}
