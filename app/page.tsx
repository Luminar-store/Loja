import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { FadeIn, Parallax } from "@/components/animations";
import { productService } from "@/services/product.service";
import { bannerService } from "@/services/banner.service";
import { categoryService } from "@/services/category.service";
import { BannerCarousel } from "@/components/storefront/BannerCarousel";
import { PackageCheck, BadgeCheck, Sparkles, FolderOpen } from 'lucide-react';
import { unstable_cache } from 'next/cache';

// Caching otimizado
const getCachedBanners = unstable_cache(
  async () => bannerService.listBanners(true),
  ['storefront-active-banners'],
  { tags: ['storefront', 'banners'] }
);

const getCachedCategories = unstable_cache(
  async () => categoryService.listCategories(),
  ['storefront-all-categories'],
  { tags: ['storefront', 'categories'] }
);

const getCachedNewArrivals = unstable_cache(
  async () => productService.listNewArrivals(6),
  ['storefront-new-arrivals'],
  { tags: ['storefront', 'products'] }
);

const getCachedActiveProducts = unstable_cache(
  async () => productService.listActiveProducts(),
  ['storefront-active-products'],
  { tags: ['storefront', 'products'] }
);

export default async function Home() {
  const [banners, categories, newArrivals, activeProducts] = await Promise.all([
    getCachedBanners(),
    getCachedCategories(),
    getCachedNewArrivals(),
    getCachedActiveProducts()
  ]);

  const hasAnyProducts = activeProducts.length > 0;

  if (!hasAnyProducts) {
    return (
      <div className="flex flex-col w-full bg-[#131313] text-[#e5e2e1] min-h-[80vh] items-center justify-center text-center px-6">
        <FolderOpen className="w-16 h-16 text-[#f2ca50] mb-6 mx-auto opacity-80" strokeWidth={1} />
        <h1 className="font-serif text-3xl sm:text-5xl text-white uppercase tracking-[0.2em] mb-4">Nova Coleção</h1>
        <p className="font-sans text-sm text-white/50 max-w-lg tracking-widest uppercase mb-10 leading-relaxed">
          Nossa vitrine está sendo meticulosamente preparada com peças exclusivas. Acompanhe nossos próximos lançamentos.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href="/personalizados" className="inline-block border border-white/20 px-10 py-4 font-sans text-[11px] font-bold text-white uppercase tracking-[0.2em] transition-all duration-300 bg-transparent hover:bg-white hover:text-black">
            Personalizar Minha Joia
          </Link>
          <Link href="/contato" className="inline-block border border-transparent px-10 py-4 font-sans text-[11px] font-bold text-black uppercase tracking-[0.2em] transition-all duration-300 bg-[#f2ca50] hover:bg-white">
            Entrar em Contato
          </Link>
        </div>
      </div>
    );
  }

  // Identificador robusto: Mapeia categorias que possuem produtos
  const categoriesWithProducts = categories.map(cat => {
    const catProducts = activeProducts.filter(p => p.category_id === cat.id || p.category === cat.name).slice(0, 4);
    return { ...cat, products: catProducts };
  }).filter(cat => cat.products.length > 0);

  return (
    <div className="flex flex-col w-full bg-[#131313] text-[#e5e2e1] overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <div className="relative">
        <BannerCarousel banners={banners} />
      </div>

      {/* 2. NOVIDADES (FEATURED + RECENT) */}
      {newArrivals.length > 0 && (
        <section className="py-16 sm:py-24 px-6 sm:px-16 max-w-7xl mx-auto w-full">
          <FadeIn direction="up">
            <div className="flex flex-col items-center mb-16 text-center">
              <h2 className="font-serif text-[32px] text-[#e5e2e1] uppercase tracking-[0.3em] mb-4">Novidades</h2>
              <div className="w-12 h-[1px] bg-[#f2ca50]"></div>
            </div>
          </FadeIn>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-12">
            {newArrivals.map((product, index) => (
              <div key={product.id} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <FadeIn delay={index * 0.1} direction="up" fullWidth>
                  <ProductCard product={product} />
                </FadeIn>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. COLEÇÕES */}
      {categoriesWithProducts.length > 0 && (
        <div className="bg-[#0b0b0b] py-8 border-t border-white/5">
          {categoriesWithProducts.map((cat, catIndex) => (
            <section key={cat.id} className="py-16 px-6 sm:px-16 max-w-7xl mx-auto w-full">
              <FadeIn direction="up">
                <div className="flex flex-col items-center mb-16 text-center">
                  <span className="font-sans text-[10px] text-[#f2ca50] uppercase tracking-[0.3em] mb-3">Coleção</span>
                  <h2 className="font-serif text-[28px] text-white uppercase tracking-[0.2em] mb-6">{cat.name}</h2>
                  <div className="w-8 h-[1px] bg-white/20"></div>
                </div>
              </FadeIn>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {cat.products.map((product, index) => (
                  <FadeIn key={product.id} delay={index * 0.1} direction="up" fullWidth>
                    <ProductCard product={product} />
                  </FadeIn>
                ))}
              </div>

              <FadeIn direction="up">
                <div className="flex justify-center">
                  <Link href={`/categoria?categoria=${encodeURIComponent(cat.slug)}`} className="inline-block border border-white/10 px-12 py-4 font-sans text-[11px] font-bold text-white/70 uppercase tracking-[0.2em] transition-all duration-400 bg-transparent hover:bg-white/5 hover:text-white hover:border-white/30 active:scale-95">
                    Ver Coleção
                  </Link>
                </div>
              </FadeIn>
            </section>
          ))}
        </div>
      )}

      {/* 4. BENEFÍCIOS */}
      <section className="bg-[#131313] py-16 border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-16 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
          <FadeIn delay={0.1} direction="up" className="flex flex-col items-center gap-5">
            <PackageCheck className="text-[#f2ca50] w-10 h-10" strokeWidth={1} />
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Envio Seguro e Rastreado</p>
          </FadeIn>
          <FadeIn delay={0.2} direction="up" className="flex flex-col items-center gap-5">
            <BadgeCheck className="text-[#f2ca50] w-10 h-10" strokeWidth={1} />
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Certificado de Autenticidade</p>
          </FadeIn>
          <FadeIn delay={0.3} direction="up" className="flex flex-col items-center gap-5">
            <Sparkles className="text-[#f2ca50] w-10 h-10" strokeWidth={1} />
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Atendimento Exclusivo</p>
          </FadeIn>
        </div>
      </section>

      {/* 5. CTA FINAL */}
      <section className="relative py-24 sm:py-32 flex flex-col items-center justify-center text-center overflow-hidden border-t border-white/5 bg-[#0a0a0a]">
        <FadeIn direction="up">
          <div className="w-full max-w-4xl px-6 relative z-10 flex flex-col items-center">
            <span className="text-[#f2ca50] font-sans text-[10px] uppercase tracking-[0.3em] mb-6">Alta Joalheria</span>
            <h2 className="font-serif text-2xl sm:text-4xl text-[#e5e2e1] leading-relaxed tracking-wide mb-8">
              Cada joia é criada para contar uma história.
            </h2>
            <p className="font-sans text-sm sm:text-base text-white/50 leading-loose max-w-2xl mx-auto mb-12">
              Produzimos peças sob encomenda, com acabamento artesanal e atenção absoluta aos detalhes.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto">
              <Link href="/categoria" className="inline-block border border-white/20 px-10 py-4 font-sans text-[11px] font-bold text-white uppercase tracking-[0.2em] transition-all duration-300 bg-transparent hover:bg-white hover:text-black">
                Explorar Coleção
              </Link>
              <Link href="/personalizados" className="inline-block border border-transparent px-10 py-4 font-sans text-[11px] font-bold text-black uppercase tracking-[0.2em] transition-all duration-300 bg-[#f2ca50] hover:bg-white">
                Personalizar Minha Joia
              </Link>
            </div>
          </div>
        </FadeIn>
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#f2ca50]/20 via-transparent to-transparent"></div>
      </section>

    </div>
  );
}
