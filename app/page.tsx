import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { FadeIn, Parallax } from "@/components/animations";
import { productService } from "@/services/product.service";
import { Truck, BadgeCheck, Gift } from 'lucide-react';

// ISR: revalida a cada 60 segundos — reduz carga no banco em tráfego alto
export const revalidate = 60;

export default async function Home() {
  const products = await productService.listProducts();
  const activeProducts = products.filter(p => !['Rascunho', 'Oculto', 'Inativo'].includes(p.status || ''));
  const destaques = activeProducts.filter(p => p.is_featured).slice(0, 4);
  
  if (destaques.length === 0) {
    destaques.push(...activeProducts.slice(0, 4));
  }

  return (
    <div className="flex flex-col w-full bg-[#131313] text-[#e5e2e1] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[100dvh] min-h-[700px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Parallax offset={100} className="w-full h-[120%] -top-[10%] absolute">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF6J73PmZwPBMK1DwEL7lsa80UXp7GyablGcBe7ZXVI9ql2teMqlje3k104swNhvGLDZ3bBi_MftM-59JDxiHnujB63a2mNKyrrEgv1z_1T3vId9MHXAzVYw5JAhQqDIMHjpO_xCbX5_Kq4jXmSqh6rpBDJnDxzO91_IJTGx51Lt1Uha7O6yR7GXDjjgbKkhXBIMF80ojS96kKzSiIlQ_b_lyDSmiB5BrIFOo4EGIGxB3a80MyTjhmGcH7z2gV3HSkDdK92_bsHEc"
              alt="Luxury Jewelry Model"
              fill
              className="object-cover object-center"
              referrerPolicy="no-referrer"
              priority
            />
          </Parallax>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/40 to-[#0B0B0B] opacity-90 block"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mt-16">
          <FadeIn delay={0.2} direction="up">
            <span className="font-sans text-[#f2ca50] text-[12px] font-bold uppercase tracking-[0.4em] mb-6 block">Elegância Eterna</span>
          </FadeIn>
          <FadeIn delay={0.4} direction="up">
            <h1 className="font-serif text-5xl md:text-[64px] text-[#e5e2e1] mb-6 leading-tight">
              Joias premium criadas para <br/><span className="italic font-light text-[#D4AF37]">marcar presença.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.5} direction="up">
            <p className="font-sans text-white/70 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed mb-10">
              Design sofisticado, acabamento refinado e produção sob encomenda.
            </p>
          </FadeIn>
          <FadeIn delay={0.6} direction="up">
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <Link href="/categoria" className="bg-[#d4af37] text-[#241a00] px-12 sm:px-32 py-4 font-sans text-[12px] font-bold uppercase tracking-widest transition-all duration-400 hover:brightness-110 active:scale-95">
                Explorar Coleção
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Benefits Row */}
      <section className="bg-[#131313] py-8 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <FadeIn delay={0.1} direction="left" className="flex flex-col items-center gap-4">
            <Truck className="text-[#f2ca50] w-8 h-8" strokeWidth={1.5} />
            <p className="font-sans text-[12px] font-bold uppercase tracking-widest text-white/70">Frete Grátis</p>
          </FadeIn>
          <FadeIn delay={0.2} direction="up" className="flex flex-col items-center gap-4">
            <BadgeCheck className="text-[#f2ca50] w-8 h-8" strokeWidth={1.5} />
            <p className="font-sans text-[12px] font-bold uppercase tracking-widest text-white/70">Garantia Vitalícia</p>
          </FadeIn>
          <FadeIn delay={0.3} direction="right" className="flex flex-col items-center gap-4">
            <Gift className="text-[#f2ca50] w-8 h-8" strokeWidth={1.5} />
            <p className="font-sans text-[12px] font-bold uppercase tracking-widest text-white/70">Embalagem Luxo</p>
          </FadeIn>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-24 sm:py-32 px-6 sm:px-16 max-w-7xl mx-auto w-full">
        <FadeIn direction="up">
          <div className="flex flex-col items-center mb-20 text-center">
            <h2 className="font-serif text-[32px] text-[#e5e2e1] uppercase tracking-[0.3em] mb-4">Best Sellers</h2>
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

      {/* Categories Section */}
      <section className="bg-[#0e0e0e] py-24 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FadeIn delay={0.1} direction="up">
              <Link href="/categoria" className="relative group h-[400px] sm:h-[500px] overflow-hidden block">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSWIv6G539hpUq8MqIB1g7Gg9oR15Ptr18vuPP2y4UkMGAnT_Fk5mo6ZY8in5xv2rALiX5OaeFYWZSTMbKZIjIKiy2qXyvU65VyhqRZ3YG-4Lt3W2Ev8xFB_L6BU1VbgKnHKuqc6YFRDkmxfWiF1O36Hn2M3lN4IdjmL8se-OXAhUS_u_i2w-jZ4NfafnnCk5YAY2xblUJ0s7GCTgTjzoYaSsd_VqVGgU5uCD93m1m8Yz1nzU4OK6r2kGdF5r8DXa662s_G92-Heo"
                  alt="Anéis"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>
                <div className="absolute bottom-10 left-8 sm:bottom-12 sm:left-12">
                  <h3 className="font-serif text-3xl text-white uppercase tracking-[0.2em] mb-4">Anéis</h3>
                  <span className="font-sans text-[12px] font-bold text-[#f2ca50] uppercase tracking-widest border-b border-[#f2ca50]/30 pb-1 group-hover:border-[#f2ca50] transition-colors duration-300">
                    Ver Coleção
                  </span>
                </div>
              </Link>
            </FadeIn>

            <FadeIn delay={0.2} direction="up">
              <Link href="/categoria" className="relative group h-[400px] sm:h-[500px] overflow-hidden block">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_NXLNlNWi5KClOXcoMT6HeN_eIPouOLhgMDT4hcS6nepZrMpgBKeoIErtpnbwpMLKjkB84K0oYQSJnZWEzK7JK9LPvpFr2XV3_Jsm6RffisH8EJyaTdgiE4NimiyFy-vvMZRm7QSmp3WQafsHoQkctWwu8v_GPjUmgohfzT1ygxap-TzX2PMjmtAz5wyNtOO3EvjTvDe4A6Vxwzksl2aPBO88h_68y9tsMYPhnuFBI2EkC9sGROuaeqdrqSzmXslMSwcuH8Pgc2I"
                  alt="Correntes"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>
                <div className="absolute bottom-10 left-8 sm:bottom-12 sm:left-12">
                  <h3 className="font-serif text-3xl text-white uppercase tracking-[0.2em] mb-4">Correntes</h3>
                  <span className="font-sans text-[12px] font-bold text-[#f2ca50] uppercase tracking-widest border-b border-[#f2ca50]/30 pb-1 group-hover:border-[#f2ca50] transition-colors duration-300">
                    Ver Coleção
                  </span>
                </div>
              </Link>
            </FadeIn>

            <FadeIn delay={0.3} direction="up">
              <Link href="/categoria" className="relative group h-[400px] sm:h-[500px] overflow-hidden block">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7FAzJHRDyubbZXOXi6mYlUnzXOa2TOpxI79G0W41zXzxMBUAdkL71jZVRV0GLi_mIRnOvNS5ZNQhXgFC3H59eN_ZEm523-kb5Zecw9QswWV3FXp1y41EG7sf2oWgXJQTZGJ8SF6ZWh9kK7KE39N-p-WcbsgnvLmbrwAn6d0kHt08npumNRUflLDxqKZW-rNvoxFVqZi7HINlabqVafF-Ks1xikBNRe2z3tVrFJ5PHLntCaHkn2RAiV2fWHZDMKDix53t3ZJ8-srI"
                  alt="Pulseiras"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>
                <div className="absolute bottom-10 left-8 sm:bottom-12 sm:left-12">
                  <h3 className="font-serif text-3xl text-white uppercase tracking-[0.2em] mb-4">Pulseiras</h3>
                  <span className="font-sans text-[12px] font-bold text-[#f2ca50] uppercase tracking-widest border-b border-[#f2ca50]/30 pb-1 group-hover:border-[#f2ca50] transition-colors duration-300">
                    Ver Coleção
                  </span>
                </div>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Category Section previously here, Social Proof Removed */}

      {/* Final CTA Sector */}
      <section className="relative py-24 sm:py-32 flex flex-col items-center justify-center text-center overflow-hidden border-t border-white/5">
        <FadeIn direction="up">
          <div className="max-w-3xl px-6 relative z-10">
            <h2 className="font-serif text-3xl sm:text-5xl text-[#e5e2e1] mb-6 leading-tight tracking-tight">Cada peça é produzida sob encomenda, garantindo exclusividade e atenção aos detalhes.</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link href="/categoria" className="inline-block border border-white/10 px-8 sm:px-16 py-5 font-sans text-[12px] font-bold text-[#f2ca50] uppercase tracking-widest transition-all duration-400 bg-transparent hover:bg-[#d4af37] hover:text-[#241a00] hover:border-transparent active:scale-95">
                Explorar Coleção
              </Link>
              <Link href="/personalizados" className="inline-block border border-transparent px-8 sm:px-16 py-5 font-sans text-[12px] font-bold text-[#241a00] uppercase tracking-widest transition-all duration-400 bg-[#d4af37] hover:brightness-110 active:scale-95">
                Personalizar Joia
              </Link>
            </div>
          </div>
        </FadeIn>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#f2ca50]/20 via-transparent to-transparent"></div>
        </div>
      </section>
    </div>
  );
}
