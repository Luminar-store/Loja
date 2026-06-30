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
      <div className="flex flex-col w-full bg-[#131313] text-[#e5e2e1] min-h-[90vh] items-center justify-center text-center px-6">
        <FadeIn direction="up" className="flex flex-col items-center">
          <FolderOpen className="w-12 h-12 text-[#f2ca50] mb-8 mx-auto opacity-80" strokeWidth={1} />
          <h1 className="font-serif text-3xl sm:text-4xl text-white tracking-wider mb-6">Nossa nova coleção está sendo preparada.</h1>
          <p className="font-sans text-sm text-white/50 max-w-lg leading-relaxed mb-10">
            Acompanhe nossos próximos lançamentos. Cada peça é meticulosamente elaborada com exclusividade e atenção absoluta aos detalhes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/personalizados" className="inline-block border border-white/20 px-10 py-4 font-sans text-[11px] font-bold text-white uppercase tracking-[0.2em] transition-all duration-300 bg-transparent hover:bg-white hover:text-black">
              Personalizar Minha Joia
            </Link>
            <Link href="/contato" className="inline-block border border-transparent px-10 py-4 font-sans text-[11px] font-bold text-black uppercase tracking-[0.2em] transition-all duration-300 bg-[#f2ca50] hover:bg-[#d4af37]">
              Entrar em Contato
            </Link>
          </div>
        </FadeIn>
      </div>
    );
  }

  // Identificador robusto: Mapeia categorias que possuem produtos (usando category_id preferencialmente ou nome como fallback seguro em memória)
  // Além de calcular o total de produtos para mostrar no layout premium
  const categoriesWithProducts = categories.map(cat => {
    const allCatProducts = activeProducts.filter(p => p.category_id === cat.id || p.category === cat.name);
    return { ...cat, products: allCatProducts.slice(0, 4), totalProducts: allCatProducts.length };
  }).filter(cat => cat.totalProducts > 0);

  // Lógica de centralização inteligente para as Novidades
  const novidadesGridCols = newArrivals.length === 1 
    ? 'grid-cols-1 max-w-md mx-auto' 
    : newArrivals.length === 2 
      ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' 
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="flex flex-col w-full bg-[#131313] text-[#e5e2e1] overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <div className="relative">
        <BannerCarousel banners={banners} />
      </div>

      {/* 2. CATEGORIES GRID (COLEÇÕES) */}
      {categoriesWithProducts.length > 0 && (
        <section className="bg-[#0a0a0a] py-24 sm:py-32 overflow-hidden border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 sm:px-16">
            <FadeIn direction="up">
              <div className="flex flex-col items-center mb-20 text-center">
                <span className="font-sans text-[10px] text-[#f2ca50] uppercase tracking-[0.3em] mb-4">Descubra</span>
                <h2 className="font-serif text-[28px] sm:text-[32px] text-white tracking-widest mb-6">COLEÇÕES</h2>
                <div className="w-8 h-[1px] bg-white/20"></div>
              </div>
            </FadeIn>

            <div className={`grid gap-6 ${categoriesWithProducts.slice(0, 6).length <= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {categoriesWithProducts.slice(0, 6).map((cat, index) => (
                <FadeIn key={cat.id} delay={(index + 1) * 0.08} direction="up">
                  <Link href={`/categoria?categoria=${encodeURIComponent(cat.slug)}`} className="relative group h-[340px] sm:h-[480px] overflow-hidden block border border-white/5 rounded-sm">
                    {cat.image_url ? (
                      <Image src={cat.image_url} alt={cat.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
                        <span className="font-serif text-6xl text-[#f2ca50]/10 uppercase tracking-widest select-none">{cat.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-700"></div>
                    
                    <div className="absolute bottom-8 left-8 sm:bottom-12 sm:left-12 z-20">
                      <h3 className="font-serif text-2xl sm:text-3xl text-white tracking-wide mb-2">{cat.name}</h3>
                      <p className="font-sans text-[10px] text-white/60 tracking-[0.2em] uppercase mb-5">
                        {cat.totalProducts} {cat.totalProducts === 1 ? 'Peça' : 'Peças'}
                      </p>
                      <div className="inline-flex items-center">
                        <span className="font-sans text-[11px] font-bold text-[#f2ca50] uppercase tracking-widest border-b border-[#f2ca50]/30 pb-1 group-hover:border-[#f2ca50] transition-colors duration-300">Explorar</span>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. NOVIDADES (FEATURED + RECENT) */}
      {newArrivals.length > 0 && (
        <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 sm:px-16 max-w-7xl mx-auto w-full">
          <FadeIn direction="up">
            <div className="flex flex-col items-center mb-20 text-center">
              <span className="font-sans text-[10px] text-[#f2ca50] uppercase tracking-[0.3em] mb-4">Lançamentos</span>
              <h2 className="font-serif text-[28px] sm:text-[32px] text-white tracking-widest mb-6">NOVIDADES</h2>
              <div className="w-8 h-[1px] bg-white/20"></div>
            </div>
          </FadeIn>
          
          <div className={`grid ${novidadesGridCols} gap-x-6 gap-y-16`}>
            {newArrivals.map((product, index) => (
              <FadeIn key={product.id} delay={index * 0.1} direction="up" fullWidth>
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* 4. PRODUTOS POR COLEÇÃO */}
      {categoriesWithProducts.length > 0 && (
        <div className="bg-[#0b0b0b] py-8 sm:py-16 border-t border-white/5">
          {categoriesWithProducts.map((cat, catIndex) => (
            <section key={cat.id} className="py-16 sm:py-24 px-6 sm:px-16 max-w-7xl mx-auto w-full border-b border-white/5 last:border-0">
              <FadeIn direction="up">
                <div className="flex flex-col items-center mb-16 text-center">
                  <span className="font-sans text-[10px] text-white/50 uppercase tracking-[0.3em] mb-3">Coleção</span>
                  <h2 className="font-serif text-[28px] text-white tracking-widest mb-6">{cat.name}</h2>
                </div>
              </FadeIn>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-16 mb-20">
                {cat.products.map((product, index) => (
                  <FadeIn key={product.id} delay={index * 0.1} direction="up" fullWidth>
                    <ProductCard product={product} />
                  </FadeIn>
                ))}
              </div>

              <FadeIn direction="up">
                <div className="flex justify-center">
                  <Link href={`/categoria?categoria=${encodeURIComponent(cat.slug)}`} className="inline-block border border-white/10 px-12 py-4 font-sans text-[11px] font-bold text-white uppercase tracking-[0.2em] transition-all duration-400 bg-transparent hover:bg-white/5 hover:border-white/30 active:scale-95">
                    Ver Coleção Completa
                  </Link>
                </div>
              </FadeIn>
            </section>
          ))}
        </div>
      )}

      {/* 5. BENEFÍCIOS */}
      <section className="bg-[#131313] py-24 sm:py-32 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-16 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 text-center">
          <FadeIn delay={0.1} direction="up" className="flex flex-col items-center gap-6">
            <PackageCheck className="text-[#f2ca50] w-10 h-10 opacity-90" strokeWidth={1} />
            <div className="space-y-3">
              <h4 className="font-serif text-lg text-white tracking-wide">Envio Seguro e Rastreado</h4>
              <p className="font-sans text-[12px] text-white/50 leading-relaxed max-w-xs mx-auto">Sua joia viaja protegida e com seguro total até suas mãos, com rastreio em tempo real.</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2} direction="up" className="flex flex-col items-center gap-6">
            <BadgeCheck className="text-[#f2ca50] w-10 h-10 opacity-90" strokeWidth={1} />
            <div className="space-y-3">
              <h4 className="font-serif text-lg text-white tracking-wide">Certificado de Autenticidade</h4>
              <p className="font-sans text-[12px] text-white/50 leading-relaxed max-w-xs mx-auto">Garantia vitalícia e certificação internacional de todos os diamantes e metais preciosos.</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.3} direction="up" className="flex flex-col items-center gap-6">
            <Sparkles className="text-[#f2ca50] w-10 h-10 opacity-90" strokeWidth={1} />
            <div className="space-y-3">
              <h4 className="font-serif text-lg text-white tracking-wide">Atendimento Exclusivo</h4>
              <p className="font-sans text-[12px] text-white/50 leading-relaxed max-w-xs mx-auto">Concierge pessoal dedicado a tornar sua experiência de compra inesquecível e única.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 6. CTA FINAL PREMIUM */}
      <section className="relative py-32 sm:py-48 flex flex-col items-center justify-center text-center overflow-hidden bg-[#050505]">
        <FadeIn direction="up">
          <div className="max-w-3xl px-6 relative z-10 flex flex-col items-center">
            <span className="text-[#f2ca50] font-sans text-[10px] uppercase tracking-[0.3em] mb-6">Alta Joalheria</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white leading-tight tracking-wide mb-8">
              Cada joia é criada para contar uma história.
            </h2>
            <p className="font-sans text-sm sm:text-base text-white/50 leading-loose max-w-xl mx-auto mb-12">
              Produzimos peças sob encomenda, com acabamento artesanal e atenção absoluta aos detalhes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full sm:w-auto">
              <Link href="/categoria" className="inline-block border border-white/20 px-10 py-4.5 font-sans text-[11px] font-bold text-white uppercase tracking-[0.2em] transition-all duration-300 bg-transparent hover:bg-white hover:text-black">
                Explorar Coleção
              </Link>
              <Link href="/personalizados" className="inline-block border border-[#f2ca50] px-10 py-4.5 font-sans text-[11px] font-bold text-black uppercase tracking-[0.2em] transition-all duration-300 bg-[#f2ca50] hover:bg-[#d4af37] hover:border-[#d4af37]">
                Personalizar Minha Joia
              </Link>
            </div>
          </div>
        </FadeIn>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      </section>

    </div>
  );
}
