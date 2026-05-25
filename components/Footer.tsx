import Link from 'next/link';
import { Share2, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0B0B0B] w-full py-20 px-6 sm:px-16 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
        <div className="text-[#D4AF37] font-serif text-2xl mb-4 tracking-[0.3em] uppercase">
          LUMINAR JOIAS
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-4xl">
          <Link href="/categoria" className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors duration-400">
            Coleções
          </Link>
          <Link href="/personalizados" className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors duration-400">
            Personalizados
          </Link>
          <Link href="/rastreio" className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors duration-400">
            Meus Pedidos
          </Link>
          <Link href="/" className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors duration-400">
            Privacidade
          </Link>
        </div>

        <div className="flex gap-8 items-center">
          <Share2 className="text-white/30 cursor-pointer hover:text-[#D4AF37] transition-colors w-6 h-6" strokeWidth={1.5} />
          <Mail className="text-white/30 cursor-pointer hover:text-[#D4AF37] transition-colors w-6 h-6" strokeWidth={1.5} />
          <MapPin className="text-white/30 cursor-pointer hover:text-[#D4AF37] transition-colors w-6 h-6" strokeWidth={1.5} />
        </div>

        <p className="font-sans text-[10px] tracking-widest uppercase text-white/50 border-t border-white/5 pt-8 w-full">
          © {new Date().getFullYear()} LUMINAR JOIAS. TODOS OS DIREITOS RESERVADOS.
        </p>
      </div>
    </footer>
  );
}
