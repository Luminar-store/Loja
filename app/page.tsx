import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { FadeIn, Parallax } from "@/components/animations";
import { productService } from "@/services/product.service";
import { bannerService } from "@/services/banner.service";
import { cmsService } from "@/services/cms.service";
import { categoryService } from "@/services/category.service";
import { BannerCarousel } from "@/components/storefront/BannerCarousel";
import { Truck, BadgeCheck, Gift } from 'lucide-react';
import { unstable_cache } from 'next/cache';

// Next.js 15: Caching dinâmico de alto desempenho baseado em tags e invalidação imediata.
// Removemos revalidate = 60 para utilizar unstable_cache.

const getCachedCMSSections = unstable_cache(
  async () => cmsService.listAllSections(),
  ['storefront-cms-sections'],
  { tags: ['storefront'] }
);

const getCachedBanners = unstable_cache(
  async () => bannerService.listBanners(true),
  ['storefront-active-banners'],
  { tags: ['storefront', 'banners'] }
);

const getCachedFeaturedProducts = unstable_cache(
  async (limit: number) => productService.listFeaturedProducts(limit),
  ['storefront-featured-products'],
  { tags: ['storefront', 'products'] }
);

const getCachedCategories = unstable_cache(
  async () => categoryService.listCategories(),
  ['storefront-all-categories'],
  { tags: ['storefront', 'categories'] }
);

export default async function Home() {
  // Carrega todos os dados sob demanda de forma paralela via cache.
  // Carregamos até 8 produtos em destaque para evitar downloads desnecessários no servidor.
  const [sectionsData, banners, featuredProducts, categories] = await Promise.all([
    getCachedCMSSections(),
    getCachedBanners(),
    getCachedFeaturedProducts(8),
    getCachedCategories()
  ]);

  // Se o CMS não possuir nenhuma seção cadastrada ainda no banco, exibe a estrutura de fallback padrão
  const activeSections = sectionsData.length > 0 
    ? sectionsData.filter(s => s.is_active) 
    : [
        { section_key: 'hero', position: 0, payload: {} },
        { section_key: 'benefits', position: 1, payload: {} },
        { section_key: 'featured', position: 2, payload: {} },
        { section_key: 'categories', position: 3, payload: {} },
        { section_key: 'cta', position: 4, payload: {} }
      ];



  return (
    <div className="flex flex-col w-full bg-[#131313] text-[#e5e2e1] overflow-x-hidden">
      {activeSections.map((section, idx) => {
        const payload = (section.payload as Record<string, any>) || {};

        switch (section.section_key) {
          // --- 1. HERO SECTION (CARROSSEL DINÂMICO) ---
          case 'hero':
            return (
              <div key={section.section_key || idx}>
                <BannerCarousel banners={banners} />
              </div>
            );

          // --- 2. BENEFITS ROW ---
          case 'benefits':
            const benefit1 = payload.benefit1_title || 'Frete Grátis';
            const benefit2 = payload.benefit2_title || 'Garantia Vitalícia';
            const benefit3 = payload.benefit3_title || 'Embalagem Luxo';
            return (
              <section key={section.section_key} className="bg-[#131313] py-8 border-y border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 sm:px-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <FadeIn delay={0.1} direction="left" className="flex flex-col items-center gap-4">
                    <Truck className="text-[#f2ca50] w-8 h-8" strokeWidth={1.5} />
                    <p className="font-sans text-[12px] font-bold uppercase tracking-widest text-white/70">{benefit1}</p>
                  </FadeIn>
                  <FadeIn delay={0.2} direction="up" className="flex flex-col items-center gap-4">
                    <BadgeCheck className="text-[#f2ca50] w-8 h-8" strokeWidth={1.5} />
                    <p className="font-sans text-[12px] font-bold uppercase tracking-widest text-white/70">{benefit2}</p>
                  </FadeIn>
                  <FadeIn delay={0.3} direction="right" className="flex flex-col items-center gap-4">
                    <Gift className="text-[#f2ca50] w-8 h-8" strokeWidth={1.5} />
                    <p className="font-sans text-[12px] font-bold uppercase tracking-widest text-white/70">{benefit3}</p>
                  </FadeIn>
                </div>
              </section>
            );

          // --- 3. BEST SELLERS / FEATURED PRODUCTS ---
          case 'featured':
            const title = payload.title || 'Best Sellers';
            const limit = payload.limit || 4;

            const destaques = featuredProducts.slice(0, limit);

            if (destaques.length === 0) return null;

            return (
              <section key={section.section_key} className="py-24 sm:py-32 px-6 sm:px-16 max-w-7xl mx-auto w-full">
                <FadeIn direction="up">
                  <div className="flex flex-col items-center mb-20 text-center">
                    <h2 className="font-serif text-[32px] text-[#e5e2e1] uppercase tracking-[0.3em] mb-4">{title}</h2>
                    <div className="w-12 h-[1px] bg-[#f2ca50]"></div>
                  </div>
                </FadeIn>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {destaques.map((product, index) => (
                    <FadeIn key={product.id} delay={index * 0.1} direction="up" fullWidth>
                      <ProductCard product={product} />
                    </FadeIn>
                  ))}
                </div>
              </section>
            );

          // --- 4. CATEGORIES SECTION ---
          case 'categories':
            const catTitle = payload.title || 'Coleções Exclusivas';

            if (categories.length === 0) return null;

            return (
              <section key={section.section_key} className="bg-[#0e0e0e] py-24 sm:py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 sm:px-16">
                  <FadeIn direction="up">
                    <div className="flex flex-col items-center mb-16 text-center">
                      <h2 className="font-serif text-[28px] text-[#e5e2e1] uppercase tracking-[0.25em] mb-4">{catTitle}</h2>
                      <div className="w-10 h-[1px] bg-[#f2ca50]"></div>
                    </div>
                  </FadeIn>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categories.slice(0, 3).map((cat, index) => {
                      const image = cat.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSWIv6G539hpUq8MqIB1g7Gg9oR15Ptr18vuPP2y4UkMGAnT_Fk5mo6ZY8in5xv2rALiX5OaeFYWZSTMbKZIjIKiy2qXyvU65VyhqRZ3YG-4Lt3W2Ev8xFB_L6BU1VbgKnHKuqc6YFRDkmxfWiF1O36Hn2M3lN4IdjmL8se-OXAhUS_u_i2w-jZ4NfafnnCk5YAY2xblUJ0s7GCTgTjzoYaSsd_VqVGgU5uCD93m1m8Yz1nzU4OK6r2kGdF5r8DXa662s_G92-Heo';
                      return (
                        <FadeIn key={cat.id} delay={(index + 1) * 0.1} direction="up">
                          <Link href={`/categoria?slug=${cat.slug}`} className="relative group h-[400px] sm:h-[500px] overflow-hidden block border border-white/5">
                            <Image
                              src={image}
                              alt={cat.name}
                              fill
                              className="object-cover transition-transform duration-1000 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-colors duration-500"></div>
                            <div className="absolute bottom-10 left-8 sm:bottom-12 sm:left-12">
                              <h3 className="font-serif text-2xl text-white uppercase tracking-[0.2em] mb-4">{cat.name}</h3>
                              <span className="font-sans text-[11px] font-bold text-[#f2ca50] uppercase tracking-widest border-b border-[#f2ca50]/30 pb-1 group-hover:border-[#f2ca50] transition-colors duration-300">
                                Ver Coleção
                              </span>
                            </div>
                          </Link>
                        </FadeIn>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          // --- 5. FINAL CTA SECTOR ---
          case 'cta':
            const ctaTitle = payload.title || 'Cada peça é produzida sob encomenda, garantindo exclusividade e atenção aos detalhes.';
            const btn1Text = payload.button_text || 'Explorar Coleção';
            const btn1Link = payload.button_link || '/categoria';
            const btn2Text = payload.button_order_text || 'Personalizar Joia';
            const btn2Link = payload.button_order_link || '/personalizados';

            return (
              <section key={section.section_key} className="relative py-24 sm:py-32 flex flex-col items-center justify-center text-center overflow-hidden border-t border-white/5">
                <FadeIn direction="up">
                  <div className="max-w-3xl px-6 relative z-10">
                    <h2 className="font-serif text-2xl sm:text-4xl text-[#e5e2e1] mb-6 leading-relaxed tracking-wide">{ctaTitle}</h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                      <Link href={btn1Link} className="inline-block border border-white/10 px-8 sm:px-16 py-5 font-sans text-[12px] font-bold text-[#f2ca50] uppercase tracking-widest transition-all duration-400 bg-transparent hover:bg-[#d4af37] hover:text-[#241a00] hover:border-transparent active:scale-95">
                        {btn1Text}
                      </Link>
                      <Link href={btn2Link} className="inline-block border border-transparent px-8 sm:px-16 py-5 font-sans text-[12px] font-bold text-[#241a00] uppercase tracking-widest transition-all duration-400 bg-[#d4af37] hover:brightness-110 active:scale-95">
                        {btn2Text}
                      </Link>
                    </div>
                  </div>
                </FadeIn>
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#f2ca50]/20 via-transparent to-transparent"></div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
