import { ProductCard } from "@/components/ProductCard";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { CategoryFilters } from "@/components/storefront/CategoryFilters";
import { FadeIn } from "@/components/animations";
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

// Next.js 15: Página dinâmica baseada em URL query parameters (searchParams)
export const revalidate = 0; // Desabilita o cache estático fixo de página inteira, pois é reativo a query parameters.

export default async function CategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Resolve os parâmetros assincronamente conforme regras do Next.js 15
  const resolvedParams = await searchParams;
  const categoriaSlug = resolvedParams.categoria as string | undefined;
  const material = resolvedParams.material as string | undefined;
  const precoSort = resolvedParams.preco as string | undefined;
  const page = resolvedParams.pagina ? Number(resolvedParams.pagina) : 1;

  // Carrega categorias e produtos de forma paralela via cache
  const [categories, products] = await Promise.all([
    categoryService.listCategories(),
    productService.listProducts(),
  ]);

  // 1. Filtra apenas produtos com status 'active'
  let filteredProducts = products.filter(
    (p) => (p.status || '').toLowerCase() === 'active'
  );

  // 2. Filtra por Categoria (slug na URL -> nome da categoria correspondente)
  let activeCategoryName = '';
  if (categoriaSlug) {
    const targetCat = categories.find((c) => c.slug === categoriaSlug);
    if (targetCat) {
      activeCategoryName = targetCat.name;
      filteredProducts = filteredProducts.filter(
        (p) => p.category === targetCat.name
      );
    }
  }

  // 3. Filtra por Material
  if (material) {
    filteredProducts = filteredProducts.filter((p) => p.material === material);
  }

  // 4. Ordenação por Preço
  if (precoSort === 'asc') {
    filteredProducts.sort((a, b) => {
      const priceA = a.promotional_price !== null ? a.promotional_price : a.price;
      const priceB = b.promotional_price !== null ? b.promotional_price : b.price;
      return priceA - priceB;
    });
  } else if (precoSort === 'desc') {
    filteredProducts.sort((a, b) => {
      const priceA = a.promotional_price !== null ? a.promotional_price : a.price;
      const priceB = b.promotional_price !== null ? b.promotional_price : b.price;
      return priceB - priceA;
    });
  }

  // 5. Paginação Real
  const itemsPerPage = 9;
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-16 py-16 lg:py-24">
      {/* Cabeçalho do Catálogo */}
      <FadeIn direction="up">
        <div className="mb-12 text-center">
          <p className="text-[#f2ca50] font-sans text-[11px] font-bold tracking-[0.4em] uppercase mb-4">
            Catálogo Dinâmico
          </p>
          <h1 className="font-serif text-[40px] md:text-[48px] text-[#e5e2e1] mb-6 leading-tight">
            {activeCategoryName ? `Coleção ${activeCategoryName}` : 'Alta Joalheria'}
          </h1>
          <p className="font-sans text-[15px] md:text-[16px] text-[#d0c5af] max-w-2xl mx-auto font-light leading-relaxed">
            {activeCategoryName 
              ? `Conheça nossa seleção de peças exclusivas na coleção ${activeCategoryName}, confeccionadas artesanalmente.`
              : 'Esculturas refinadas em ouro certificado e pedras preciosas, desenhadas para capturar a luz e celebrar a exclusividade eterna.'
            }
          </p>
        </div>
      </FadeIn>

      {/* Componente Client-side de Filtros Reativos */}
      <FadeIn delay={0.1} direction="up">
        <CategoryFilters categories={categories} />
      </FadeIn>

      {/* Grid de Produtos */}
      {paginatedProducts.length === 0 ? (
        <FadeIn delay={0.2} direction="up">
          <div className="h-64 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/30 text-xs">
            <ShoppingBag className="w-6 h-6 mb-2 opacity-50 text-[#d4af37]" />
            Nenhuma joia encontrada com os filtros selecionados.
          </div>
        </FadeIn>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-16">
          {paginatedProducts.map((product, index) => (
            <FadeIn key={product.id} delay={(index % 3) * 0.1} direction="up" fullWidth>
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>
      )}

      {/* Paginação Estética */}
      {totalPages > 1 && (
        <FadeIn delay={0.2} direction="up">
          <div className="mt-20 border-t border-white/5 pt-8 flex justify-between items-center text-xs font-mono">
            <span className="text-white/40">
              Página {page} de {totalPages} ({totalItems} peças encontradas)
            </span>
            <div className="flex gap-2">
              <Link
                href={{
                  query: {
                    ...resolvedParams,
                    pagina: page - 1,
                  },
                }}
                className={`p-2.5 border border-white/10 hover:bg-white/5 rounded-lg transition-colors text-white ${
                  page === 1 ? 'opacity-30 pointer-events-none' : ''
                }`}
                scroll={true}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                href={{
                  query: {
                    ...resolvedParams,
                    pagina: page + 1,
                  },
                }}
                className={`p-2.5 border border-white/10 hover:bg-white/5 rounded-lg transition-colors text-white ${
                  page === totalPages ? 'opacity-30 pointer-events-none' : ''
                }`}
                scroll={true}
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
