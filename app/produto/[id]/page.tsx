import { notFound } from 'next/navigation';
import { productService } from '@/services/product.service';
import { ProductForm } from '@/components/ProductForm';
import { ProductGallery } from '@/components/storefront/ProductGallery';
import { FadeIn } from '@/components/animations';
import { AlertTriangle, Gem, PenTool, ShieldCheck } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { ProductReviews } from '@/components/storefront/ProductReviews';
import { ShippingCalculator } from '@/components/storefront/ShippingCalculator';
import { supabase } from '@/lib/supabase';

import type { Metadata } from 'next';

// Next.js 15: ISR Híbrido. Geramos estaticamente os produtos ativos e deixamos dynamicParams = true para novos produtos.
export const dynamicParams = true;

// generateStaticParams: pré-compila estaticamente as joias ativas para carregamento instantâneo
export async function generateStaticParams() {
  try {
    const products = await productService.listProducts();
    // Pré-gera páginas estáticas apenas de joias com status 'active'
    return products
      .filter(p => (p.status || '').toLowerCase() === 'active')
      .map(p => ({
        id: p.id,
      }));
  } catch (err) {
    console.error('Erro ao gerar static params:', err);
    return [];
  }
}

// Caching granular por ID do produto
const getCachedProduct = (id: string) => 
  unstable_cache(
    async () => productService.getProductById(id),
    [`product-detail-${id}`],
    { tags: [`product-${id}`, 'storefront'] }
  )();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const product = await getCachedProduct(resolvedParams.id);
    if (!product || (product.status || '').toLowerCase() !== 'active') {
      return { title: 'Peça não encontrada | Luminar Joias' };
    }
    return {
      title: `${product.name} | Luminar Joias`,
      description: product.description || `Confira a joia exclusiva ${product.name} na Luminar Joias.`,
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

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let product = null;

  try {
    product = await getCachedProduct(resolvedParams.id);
  } catch (error) {
    product = null;
  }
  
  // No e-commerce CMS real, apenas joias com status 'active' são visíveis publicamente
  if (!product || (product.status || '').toLowerCase() !== 'active') {
    notFound();
  }

  // Busca avaliações ativas no servidor para injetar no JSON-LD com estrelas reais
  let reviews: any[] = [];
  try {
    const { data } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', resolvedParams.id)
      .eq('is_approved', true);
    reviews = data || [];
  } catch (error) {
    console.error('Erro ao buscar avaliações para SEO:', error);
  }

  const reviewCount = reviews.length;
  const ratingValue = reviewCount > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
    : 0;

  // JSON-LD de Produto de Luxo
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://luminar.com.br/produto/${product.id}#product`,
    'name': product.name,
    'image': product.images && product.images.length > 0 ? product.images : ['/images/placeholder-premium.svg'],
    'description': product.description || 'Esta joia exclusiva foi desenhada meticulosamente seguindo as mais altas tradições de design da Luminar.',
    'sku': product.id,
    'mpn': product.id,
    'brand': {
      '@type': 'Brand',
      'name': 'Luminar Joias'
    },
    'material': product.material || 'Ouro Amarelo 18k',
    'offers': {
      '@type': 'Offer',
      'url': `https://luminar.com.br/produto/${product.id}`,
      'priceCurrency': 'BRL',
      'price': product.promotional_price || product.price,
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      'priceValidUntil': '2027-12-31'
    },
    ...(reviewCount > 0 ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': ratingValue,
        'reviewCount': reviewCount,
        'bestRating': '5',
        'worstRating': '1'
      },
      'review': reviews.slice(0, 5).map(r => ({
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': r.reviewer_name
        },
        'datePublished': new Date(r.created_at).toISOString().split('T')[0],
        'reviewBody': r.comment || '',
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': r.rating,
          'bestRating': '5',
          'worstRating': '1'
        }
      }))
    } : {})
  };

  // JSON-LD de Breadcrumb para navegação do Google
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Início',
        'item': 'https://luminar.com.br'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Coleções',
        'item': 'https://luminar.com.br/categoria'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': product.name,
        'item': `https://luminar.com.br/produto/${product.id}`
      }
    ]
  };

  const isLimited = product.stock !== null && product.stock <= 5 && product.stock > 0;
  const isOut = product.stock === 0;

  return (
    <div className="w-full flex flex-col bg-[#131313]">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 pt-28 md:pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32 pt-8 md:pt-16">
          
          {/* Componente Client-side de Galeria Real (product_images) */}
          <section className="lg:col-span-7">
            <FadeIn direction="right" className="w-full">
              <ProductGallery 
                images={product.images || []} 
                productName={product.name}
                isMadeToOrder={product.is_made_to_order}
              />
            </FadeIn>
          </section>
 
          {/* Seção de Informações Reais da Joia */}
          <section className="lg:col-span-5 flex flex-col space-y-8">
            <FadeIn delay={0.1} direction="left" className="space-y-4">
              <span className="font-sans text-[11px] font-bold text-[#f2ca50] tracking-[0.2em] uppercase">
                COLEÇÃO {product.category || 'Geral'}
              </span>
              <h1 className="font-serif text-[32px] md:text-[36px] text-white uppercase leading-tight tracking-wide">
                {product.name}
              </h1>
            </FadeIn>

            <ProductForm product={product as any} />

            {/* Alertas de Estoque Reativos */}
            {(isLimited || isOut) && (
              <FadeIn delay={0.2} direction="left" className={`flex items-center gap-3 py-4 px-5 border ${isOut ? 'border-red-500/20 bg-red-500/5' : 'border-[#d4af37]/20 bg-[#d4af37]/5'}`}>
                <AlertTriangle className={`w-5 h-5 ${isOut ? 'text-red-500' : 'text-[#d4af37]'}`} />
                <p className={`font-sans text-[11px] font-bold ${isOut ? 'text-red-500' : 'text-[#d4af37]'} tracking-widest uppercase`}>
                  {isOut ? 'Joia Esgotada para Pronta Entrega' : `Produção Limitada — Apenas ${product.stock} peças disponíveis`}
                </p>
              </FadeIn>
            )}

            {/* Cálculo de Frete (Interativo) */}
            <FadeIn delay={0.3} direction="left" className="w-full">
              <ShippingCalculator />
            </FadeIn>

            {/* História e Ficha Técnica da Peça */}
            <FadeIn delay={0.4} direction="left" className="pt-8 space-y-6 flex-1 border-t border-white/10">
              <div className="border-b border-white/10 flex gap-8">
                <button className="pb-3 border-b-2 border-[#f2ca50] font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#f2ca50] transition-colors duration-300">
                  História da Peça
                </button>
              </div>
              <div className="text-[15px] font-sans text-white/70 leading-relaxed space-y-4 font-light">
                <p>{product.description || 'Esta joia exclusiva foi desenhada meticulosamente seguindo as mais altas tradições de design da Luminar.'}</p>
                
                <ul className="space-y-2.5 list-none p-0 pt-4 text-xs font-mono">
                  <li className="flex items-center gap-2 text-white/70">
                    <span className="w-1.5 h-1.5 bg-[#f2ca50] rounded-full"></span> 
                    Material: {product.material || 'Ouro Amarelo 18k'}
                  </li>
                  <li className="flex items-center gap-2 text-white/70">
                    <span className="w-1.5 h-1.5 bg-[#f2ca50] rounded-full"></span> 
                    Peso Estimado: {product.weight ? `${product.weight}g` : 'Sob encomenda'}
                  </li>
                  <li className="flex items-center gap-2 text-white/70">
                    <span className="w-1.5 h-1.5 bg-[#f2ca50] rounded-full"></span> 
                    Dimensões: {product.width && product.height ? `${product.width}cm x ${product.height}cm` : 'Consulte tabela'}
                  </li>
                  <li className="flex items-center gap-2 text-white/70">
                    <span className="w-1.5 h-1.5 bg-[#f2ca50] rounded-full"></span> 
                    Confecção Autoral 100% Livre de Conflitos
                  </li>
                </ul>
              </div>
            </FadeIn>
          </section>
        </div>
        
        {/* Artesania Eterna Banner Promocional */}
        <FadeIn direction="up">
          <section className="mt-32 py-16 lg:py-24 border-t border-white/5 text-center">
            <h2 className="font-serif text-[28px] uppercase mb-16 tracking-widest text-[#e5e2e1]">Artesania Eterna</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="space-y-4 px-6 flex flex-col items-center">
                <Gem className="text-[#f2ca50] w-9 h-9" strokeWidth={1} />
                <h3 className="font-serif uppercase text-xs tracking-widest text-[#e5e2e1]">Pedras Certificadas</h3>
                <p className="text-white/50 text-xs font-sans leading-relaxed">Garantimos a procedência ética e pureza de cada diamante utilizado em nossas criações autorais.</p>
              </div>
              <div className="space-y-4 px-6 flex flex-col items-center">
                <PenTool className="text-[#f2ca50] w-9 h-9" strokeWidth={1} />
                <h3 className="font-serif uppercase text-xs tracking-widest text-[#e5e2e1]">Design Autoral</h3>
                <p className="text-white/50 text-xs font-sans leading-relaxed">Peças desenhadas à mão e esculpidas por mestres ourives para eternizar sentimentos e momentos.</p>
              </div>
              <div className="space-y-4 px-6 flex flex-col items-center">
                <ShieldCheck className="text-[#f2ca50] w-9 h-9" strokeWidth={1} />
                <h3 className="font-serif uppercase text-xs tracking-widest text-[#e5e2e1]">Garantia Vitalícia</h3>
                <p className="text-white/50 text-xs font-sans leading-relaxed">Nosso compromisso inabalável com a excelência artesanal acompanha sua joia por gerações.</p>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Prova Social e Avaliações de Luxo */}
        <FadeIn direction="up">
          <ProductReviews productId={product.id} productName={product.name} />
        </FadeIn>
      </div>

      {/* Microdados estruturados JSON-LD em conformidade com as diretrizes do Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </div>
  );
}
