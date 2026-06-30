import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/data';
import { ProductRow } from '@/services/product.service';

interface ProductCardProps {
  product: ProductRow;
}

export function ProductCard({ product }: ProductCardProps) {
  const isLimited = product.stock !== null && product.stock <= 5;
  const imageUrl = product.image_url
    ? product.image_url
    : (product.images && product.images.length > 0
        ? product.images[0]
        : 'https://picsum.photos/seed/placeholder/800/1000'); // fallback
    
  return (
    <Link href={`/produto/${product.id}`} className="group block cursor-pointer">
      <div className="relative aspect-square mb-6 overflow-hidden bg-[#0e0e0e] border border-white/5 group-hover:border-[#D4AF37]/30 transition-colors">
        {(product.status === 'Esgotado' || product.stock === 0) ? (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-500/10 backdrop-blur-md border border-red-500/30">
            <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold">
              Esgotado
            </span>
          </div>
        ) : product.is_made_to_order ? (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#131313]/50 backdrop-blur-md border border-[#D4AF37]/30">
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
              ✦ Sob Encomenda
            </span>
          </div>
        ) : null}
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105 opacity-90 group-hover:opacity-100"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="text-center px-4">
        <h3 className="font-serif text-[24px] text-[#e5e2e1] mb-2 transition-colors duration-400">
          {product.name}
        </h3>
        <p className="font-sans text-[14px] font-bold uppercase tracking-widest text-[#D4AF37]">
          {product.promotional_price ? (
             <span className="flex gap-2 justify-center items-center">
               <span className="line-through text-white/50 text-[12px]">{formatPrice(product.price)}</span>
               <span>{formatPrice(product.promotional_price)}</span>
             </span>
          ) : (
            formatPrice(product.price)
          )}
        </p>
      </div>
    </Link>
  );
}
